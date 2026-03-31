from pathlib import Path
from datetime import datetime
import sys
import os
import urllib.request
import urllib.parse
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from pydantic import BaseModel
from fastapi import FastAPI, Request, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, User, WatchHistory, Watchlist, Activity
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow nextjs frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rewrite_vercel_paths(request: Request, call_next):
    if request.scope["path"].startswith("/api/ai/"):
        request.scope["path"] = request.scope["path"].replace("/api/ai/", "/api/", 1)
    return await call_next(request)

@app.get("/api/health")
def health_check():
    return JSONResponse({"status": "ok", "message": "CinemaX AI Engine running"})

from auth import auth_router
app.include_router(auth_router)

from movie_details import movie_router
app.include_router(movie_router)

from watch_party import party_router
app.include_router(party_router)

from smart_recommendations import smart_router
app.include_router(smart_router)

# Start the background recommendation engine (non-blocking)
import recommender as rec_engine
try:
    rec_engine.init_async()
except Exception as _e:
    print(f"[Startup] Warning: recommender init failed — {_e}")

BASE_DIR = Path(__file__).resolve().parent
try:
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
except Exception as _e:
    print(f"[Startup] Warning: could not mount /static — {_e}")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Seed default users if they don't exist
from database import get_supabase
try:
    db_cli = get_supabase()
    res_admin = db_cli.table("users").select("*").eq("username", "admin").execute().data
    if not res_admin:
        db_cli.table("users").insert({"username": "admin", "password": "1234", "age": 25}).execute()
    else:
        db_cli.table("users").update({"password": "1234"}).eq("username", "admin").execute()
        
    res_user = db_cli.table("users").select("*").eq("username", "user").execute().data
    if not res_user:
        db_cli.table("users").insert({"username": "user", "password": "1234", "age": 20}).execute()
    else:
        db_cli.table("users").update({"password": "1234"}).eq("username", "user").execute()
except Exception as _e:
    print(f"[Startup] Warning: could not seed default users — {_e}")

# Content rating order (strictest to most permissive)
RATING_ORDER = ["G", "PG", "PG-13", "R", "NC-17"]

def allowed_ratings(age: int, family_mode: bool, children_mode: bool = False) -> list:
    """Return content ratings allowed based on age, family mode, and children mode."""
    if children_mode:
        return ["G"]
    if family_mode:
        return ["G", "PG", "PG-13"]
    if age < 7:
        return ["G"]
    if age < 13:
        return ["G", "PG"]
    if age < 17:
        return ["G", "PG", "PG-13"]
    if age < 18:
        return ["G", "PG", "PG-13", "R"]
    return ["G", "PG", "PG-13", "R", "NC-17"]

def get_user_age(user_id: int, db = None) -> int:
    """Get user age from DB. Default 18."""
    if db:
        res = db.table("users").select("age").eq("id", user_id).execute().data
        if res:
            return int(res[0].get("age", 18))
    
    # Fallback to CSV if user not found in DB or DB not provided
    users_path = BASE_DIR / "data" / "users.csv"
    if users_path.exists():
        df = pd.read_csv(users_path)
        row = df[df["userId"] == user_id]
        if not row.empty:
            return int(row.iloc[0]["age"])
    return 18

# Real movie posters (TMDB) – unique poster per movie by id
REAL_POSTERS = [
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    "https://image.tmdb.org/t/p/w500/1mXhlQEnjn0DqecK8dYc4ruVJxi.jpg",
    "https://image.tmdb.org/t/p/w500/c9k5IAENLQpBgm01EdwBzH8EOpE.jpg",
    "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    "https://image.tmdb.org/t/p/w500/sEvigUnBrL1YNzBRj2FjLzFkUEb.jpg",
    "https://image.tmdb.org/t/p/w500/5lAmI8xk5jL2z2tZ6viOxjOFkHo.jpg",
    "https://image.tmdb.org/t/p/w500/aANn4y2LIRREFHcjH9vETW1R4O3.jpg",
    "https://image.tmdb.org/t/p/w500/lD8dFIk9wDEvOwZw0BK47k3BMf9.jpg",
    "https://image.tmdb.org/t/p/w500/5GWeQx5UWKy0KdqeKDhV7z1sT8u.jpg",
    "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Bu4.jpg",
    "https://image.tmdb.org/t/p/w500/bnc7fmB2NwHpMefB3dcdc6gYFBJ.jpg",
    "https://image.tmdb.org/t/p/w500/jG7fJVvCAEDoroJb0FI1W0Y7Bz.jpg",
    "https://image.tmdb.org/t/p/w500/4Cb0R48TKc4oFYJTMiSQq7nKKHJ.jpg",
    "https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
    "https://image.tmdb.org/t/p/w500/5KCVpaVNCwdEAQwasHwzT2V9fHK.jpg",
    "https://image.tmdb.org/t/p/w500/rMz5R4jXYMNpJ9a3bvtMN3CZOgq.jpg",
    "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg",
    "https://image.tmdb.org/t/p/w500/4egnMfiL5DVR3LOZzx0Egs3kszl.jpg",
    "https://image.tmdb.org/t/p/w500/4ydNGQ2W6gBJnKnU9GQK0MW5ucG.jpg",
    "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
    "https://image.tmdb.org/t/p/w500/4Cb0R48TKc4oFYJTMiSQq7nKKHJ.jpg",
    "https://image.tmdb.org/t/p/w500/Adrip2Jqzw56KeuV2nAx1kIaRsM.jpg",
    "https://image.tmdb.org/t/p/w500/7u3pxc0K1wx32IleAkLv78JVruU.jpg",
    "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4NH61mezv1zYxxs9.jpg",
    "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    "https://image.tmdb.org/t/p/w500/kBf3g9crrADGckZ3V5Zq5vr5g5U.jpg",
    "https://image.tmdb.org/t/p/w500/vZ2hH2kiEJamTl3n6gU0Lg0a9BT.jpg",
    "https://image.tmdb.org/t/p/w500/2u7zbo8UdyF6OUY3yHAjVlEfcFJ.jpg",
    "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "https://image.tmdb.org/t/p/w500/6EdQbPa1pLpd1g57vDx1MDo4TcE.jpg",
    "https://image.tmdb.org/t/p/w500/7RyHsO4yDXtBv1z4O3yA0uP0WRs.jpg",
    "https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BJAIg062.jpg",
    "https://image.tmdb.org/t/p/w500/Ab8vHSUUssO2TBRqKKqxJ5Hj8n2.jpg",
    "https://image.tmdb.org/t/p/w500/btTdmkgIvOi0FFip1sPuZI2oQG6.jpg",
    "https://image.tmdb.org/t/p/w500/c9k5IAENLQpBgm01EdwBzH8EOpE.jpg",
    "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    "https://image.tmdb.org/t/p/w500/eKi8dIrr8voobbaGzDpe8w0PVbC.jpg",
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/hU0E130tsGgsYeZauKnf7Ay6Tlhf.jpg",
    "https://image.tmdb.org/t/p/w500/iBvjPM5c3TgP2BcE6Q3F5wH7kL9m.jpg",
    "https://image.tmdb.org/t/p/w500/jG7fJVvCAEDoroJb0FI1W0Y7Bz.jpg",
    "https://image.tmdb.org/t/p/w500/kqjL17yufvn9OVLyXYpvtyrFfak.jpg",
    "https://image.tmdb.org/t/p/w500/lD8dFIk9wDEvOwZw0BK47k3BMf9.jpg",
    "https://image.tmdb.org/t/p/w500/mDfJG3LCgDKhAeO6sQbjVvO9Ly6.jpg",
    "https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg",
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    "https://image.tmdb.org/t/p/w500/rMz5R4jXYMNpJ9a3bvtMN3CZOgq.jpg",
    "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
    "https://image.tmdb.org/t/p/w500/Adrip2Jqzw56KeuV2nAx1kIaRsM.jpg",
    "https://image.tmdb.org/t/p/w500/7u3pxc0K1wx32IleAkLv78JVruU.jpg",
    "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4NH61mezv1zYxxs9.jpg",
    "https://image.tmdb.org/t/p/w500/kBf3g9crrADGckZ3V5Zq5vr5g5U.jpg",
    "https://image.tmdb.org/t/p/w500/vZ2hH2kiEJamTl3n6gU0Lg0a9BT.jpg",
    "https://image.tmdb.org/t/p/w500/2u7zbo8UdyF6OUY3yHAjVlEfcFJ.jpg",
    "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "https://image.tmdb.org/t/p/w500/6EdQbPa1pLpd1g57vDx1MDo4TcE.jpg",
    "https://image.tmdb.org/t/p/w500/7RyHsO4yDXtBv1z4O3yA0uP0WRs.jpg",
    "https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BJAIg062.jpg",
    "https://image.tmdb.org/t/p/w500/Ab8vHSUUssO2TBRqKKqxJ5Hj8n2.jpg",
    "https://image.tmdb.org/t/p/w500/btTdmkgIvOi0FFip1sPuZI2oQG6.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/hU0E130tsGgsYeZauKnf7Ay6Tlhf.jpg",
    "https://image.tmdb.org/t/p/w500/kqjL17yufvn9OVLyXYpvtyrFfak.jpg",
    "https://image.tmdb.org/t/p/w500/mDfJG3LCgDKhAeO6sQbjVvO9Ly6.jpg",
    "https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg",
    "https://image.tmdb.org/t/p/w500/eKi8dIrr8voobbaGzDpe8w0PVbC.jpg",
]



import urllib.request
import re
from fastapi.responses import RedirectResponse, FileResponse

# In-memory simple cache for TMDB poster URLs
POSTER_CACHE = {}

# Cached movies DataFrame — loaded once at startup
_APP_MOVIES_DF: pd.DataFrame | None = None

def _get_movies_df() -> pd.DataFrame:
    global _APP_MOVIES_DF
    if _APP_MOVIES_DF is not None:
        return _APP_MOVIES_DF
    movies_path = BASE_DIR / "data" / "movies.csv"
    if not movies_path.exists():
        return pd.DataFrame()
    df = pd.read_csv(movies_path)
    if "content_rating" not in df.columns:
        df["content_rating"] = "PG-13"
    if "genres" in df.columns:
        df["_genre_str"] = df["genres"].fillna("Drama").str.lower()
    elif "genre" in df.columns:
        df["_genre_str"] = df["genre"].fillna("Drama").str.lower()
    else:
        df["_genre_str"] = "drama"
    _APP_MOVIES_DF = df
    return df


def poster_for_movie(movie_id: int):
    return f"/api/ai/poster/{movie_id}"

_LINKS_DF = None
def _get_tmdb_id(movie_id: int):
    global _LINKS_DF
    if _LINKS_DF is None:
        links_path = BASE_DIR / "data" / "ml-latest-small" / "links.csv"
        if links_path.exists():
            _LINKS_DF = pd.read_csv(links_path).set_index("movieId")
        else:
            _LINKS_DF = pd.DataFrame()
            
    if movie_id in _LINKS_DF.index:
        val = _LINKS_DF.loc[movie_id, "tmdbId"]
        if pd.notna(val):
            return int(val)
    return None

import threading
_POSTER_LOCK = threading.Lock()

def scrape_poster_url(movie_id: int) -> str | None:
    if movie_id in POSTER_CACHE:
        return POSTER_CACHE[movie_id]

    tmdb_id = _get_tmdb_id(movie_id)
    if not tmdb_id:
        # Fallback to Wikipedia for regional/Indian movies missing TMDB links
        try:
            df = _get_movies_df()
            if not df.empty and movie_id in df["movieId"].values:
                title = df[df["movieId"] == movie_id].iloc[0]["title"]
                clean_title = re.sub(r'\(\d{4}\)', '', title).strip()
                wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(clean_title + ' film')}&prop=pageimages&format=json&pithumbsize=500"
                req = urllib.request.Request(wiki_url, headers={'User-Agent': 'Mozilla/5.0'})
                res = urllib.request.urlopen(req, timeout=3).read().decode('utf-8')
                pages = json.loads(res).get("query", {}).get("pages", {})
                for page_id, page_data in pages.items():
                    if "thumbnail" in page_data:
                        img_url = page_data["thumbnail"]["source"]
                        POSTER_CACHE[movie_id] = img_url
                        return img_url
        except Exception as e:
            print(f"Wiki fallback error for {movie_id}: {e}")
        return None

    try:
        url = f"https://www.themoviedb.org/movie/{tmdb_id}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        html = urllib.request.urlopen(req, timeout=5, context=ctx).read().decode('utf-8')
        
        import re
        m = re.search(r'<meta property="og:image" content="(.*?)"', html)
        if m:
            img_url = m.group(1)
            POSTER_CACHE[movie_id] = img_url
            return img_url
    except Exception as e:
        print(f"Error scraping TMDB for {movie_id}: {e}")
    return None

@app.get("/api/poster/{movie_id}")
def get_tmdb_poster(movie_id: int, request: Request):
    """Serve local poster if available, or dynamically scrape the real one from TMDB."""
    
    # Scrape real TMDB URL, fallback to curated list if scraping fails
    real_url = scrape_poster_url(movie_id)
    
    if real_url:
        from fastapi.responses import RedirectResponse
        resp = RedirectResponse(url=real_url, status_code=302)
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp
        
    if REAL_POSTERS:
        fallback_url = REAL_POSTERS[movie_id % len(REAL_POSTERS)]
        from fastapi.responses import RedirectResponse
        resp = RedirectResponse(url=fallback_url, status_code=302)
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp
            
    # Absolute fallback to a local image
    from fastapi.responses import FileResponse
    fallback_path = BASE_DIR / "static" / "posters" / "drama_0.jpg"
    return FileResponse(str(fallback_path))



MOVIE_DETAILS_CACHE = {}

@app.get("/api/movie/{movie_id}/details")
def get_movie_details(movie_id: int):
    """Fetches details (cast, runtime) from TMDB."""
    if movie_id in MOVIE_DETAILS_CACHE:
        return MOVIE_DETAILS_CACHE[movie_id]

    # Look up TMDB ID
    links_path = BASE_DIR / "data" / "ml-latest-small" / "links.csv"
    tmdb_id = None
    if links_path.exists():
        links_df = pd.read_csv(links_path)
        row = links_df[links_df["movieId"] == movie_id]
        if not row.empty and pd.notna(row.iloc[0]["tmdbId"]):
            tmdb_id = int(row.iloc[0]["tmdbId"])

    if not tmdb_id:
        return {"cast": "Unknown", "runtime": "Unknown"}

    try:
        url = f"https://www.themoviedb.org/movie/{tmdb_id}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
        
        # Extract runtime
        runtime = "Unknown"
        r_match = re.search(r'class="runtime">\s*(.*?)\s*</span>', html)
        if r_match:
            runtime = r_match.group(1).strip()
            
        # Extract cast (simple regex matching "profile" alt tags within ol)
        # Or look for JSON-LD script which is cleaner: <script type="application/ld+json">
        cast = []
        ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
        if ld_match:
            import json
            try:
                data = json.loads(ld_match.group(1))
                if 'actor' in data:
                    actors = data['actor']
                    if isinstance(actors, list):
                        cast = [a.get('name', '') for a in actors[:5]]
                    elif isinstance(actors, dict):
                        cast = [actors.get('name', '')]
            except:
                pass
                
        details = {
            "cast": ", ".join(cast) if cast else "Unknown Cast",
            "runtime": runtime
        }
        MOVIE_DETAILS_CACHE[movie_id] = details
        return details
    except Exception as e:
        print(f"Error fetching details for tmdb {tmdb_id}: {e}")
        return {"cast": "Unknown", "runtime": "Unknown"}

def get_model():
    import joblib
    model_path = BASE_DIR / "model" / "model.pkl"
    if model_path.exists():
        return joblib.load(model_path)
    return None

# Legacy spark cache — kept for compatibility, now backed by recommender.py
SPARK_RECS_CACHE = None
def get_spark_recommendations():
    """Deprecated: use rec_engine.get_recommendations() instead."""
    return None

def get_movies(allowed: list = None, max_duration: int = None, mood: str = None):
    df = _get_movies_df()
    if df.empty:
        return []
    if allowed is not None:
        df = df[df["content_rating"].isin(allowed)]
    if max_duration is not None and "duration" in df.columns:
        df = df[df["duration"] <= max_duration]
    if mood and "mood" in df.columns:
        df = df[df["mood"].str.lower() == mood.lower()]

    def _genre(r):
        if "genre" in r.index and pd.notna(r.get("genre")):
            return str(r["genre"]).strip()
        if "genres" in r.index and pd.notna(r.get("genres")):
            return str(r["genres"]).split("|")[0].strip() or "Drama"
        return "Drama"

    rows = list(df.head(20).iterrows())
    return [{
        "movieId": int(r["movieId"]),
        "title": r["title"],
        "genre": _genre(r),
        "content_rating": r.get("content_rating", "PG-13") if "content_rating" in r.index else "PG-13",
        "duration": int(r["duration"]) if "duration" in r.index and pd.notna(r.get("duration")) else 120,
        "mood": str(r["mood"]) if "mood" in r.index and pd.notna(r.get("mood")) else "Neutral",
        "poster": poster_for_movie(r["movieId"]),
    } for _, r in rows]

class LoginData(BaseModel):
    username: str
    password: str
    age: int | None = 18

class WatchProgressData(BaseModel):
    user_id: str | int
    movie_id: int
    progress_percent: float

class WatchlistData(BaseModel):
    user_id: str | int
    movie_id: int

@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

DEMO_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password": "1234",
        "age": 18
    }
}
_MOCK_ID_COUNTER = 2

@app.post("/signup")
def signup(data: LoginData, db = Depends(get_db)):
    global _MOCK_ID_COUNTER
    try:
        res = db.table("users").select("*").eq("username", data.username).execute().data
    except Exception:
        res = []
        
    if res or data.username in DEMO_USERS:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {"username": data.username, "password": data.password, "age": data.age or 18}
    try:
        insert_res = db.table("users").insert(new_user).execute().data
        user_id = insert_res[0]["id"]
        age = insert_res[0].get("age", 18)
    except Exception:
        new_user["id"] = _MOCK_ID_COUNTER
        DEMO_USERS[data.username] = new_user
        user_id = _MOCK_ID_COUNTER
        age = new_user["age"]
        _MOCK_ID_COUNTER += 1
        
    return {"status": "success", "userId": user_id, "age": age}

@app.post("/login")
def login(data: LoginData, db = Depends(get_db)):
    try:
        res = db.table("users").select("*").eq("username", data.username).execute().data
    except Exception:
        res = []
        
    if res and res[0].get("password") == data.password:
        return {"status": "success", "userId": res[0]["id"], "age": res[0].get("age", 18)}
        
    user = DEMO_USERS.get(data.username)
    if user and user["password"] == data.password:
        return {"status": "success", "userId": user["id"], "age": user["age"], "token": "local-session"}
        
    return {"status": "failed"}

@app.post("/api/watch_progress")
def update_watch_progress(data: WatchProgressData, db = Depends(get_db)):
    res = db.table("watch_history").select("*").eq("user_id", data.user_id).eq("movie_id", data.movie_id).execute().data
    now_iso = datetime.utcnow().isoformat()
    if res:
        db.table("watch_history").update({"progress_percent": data.progress_percent, "timestamp": now_iso}).eq("id", res[0]["id"]).execute()
    else:
        db.table("watch_history").insert({
            "user_id": data.user_id,
            "movie_id": data.movie_id,
            "progress_percent": data.progress_percent,
            "timestamp": now_iso
        }).execute()
    
    # Check for Binge
    today = datetime.utcnow().date()
    today_records = db.table("watch_history").select("*").eq("user_id", data.user_id).execute().data
    
    binge_minutes = 0
    for r in today_records:
        ts = r.get("timestamp")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if dt.date() == today:
                    binge_minutes += (float(r.get("progress_percent", 0)) / 100) * 120  # Assume 120 mins avg movie length
            except ValueError:
                pass
            
    take_a_break = binge_minutes > 180
    return {"status": "success", "take_a_break": take_a_break, "binge_minutes": int(binge_minutes)}

@app.post("/api/watchlist/add")
def add_to_watchlist(data: WatchlistData, db = Depends(get_db)):
    exists = db.table("watchlist").select("*").eq("user_id", data.user_id).eq("movie_id", data.movie_id).execute().data
    if not exists:
        db.table("watchlist").insert({"user_id": data.user_id, "movie_id": data.movie_id}).execute()
        db.table("activity").insert({"user_id": data.user_id, "action": "added_to_watchlist", "movie_id": data.movie_id}).execute()
    return {"status": "success"}

@app.post("/api/watchlist/remove")
def remove_from_watchlist(data: WatchlistData, db = Depends(get_db)):
    db.table("watchlist").delete().eq("user_id", data.user_id).eq("movie_id", data.movie_id).execute()
    return {"status": "success"}

@app.get("/home", response_class=HTMLResponse)
async def home(
    request: Request,
    user: str = "guest",
    userId: int = 1,
    age: int = 18,
    family: str = "false",
    children: str = "false",
    db = Depends(get_db)
):
    family_mode = family.lower() in ("true", "1", "yes")
    children_mode = children.lower() in ("true", "1", "yes")
    if children_mode:
        family_mode = False
    
    # Retrieve user specific parameters
    db_age = get_user_age(userId, db=db)
    
    allowed = allowed_ratings(db_age, family_mode, children_mode)
    movies = get_movies(allowed=allowed)
    
    # Retrieve continue watching
    history_records = db.table("watch_history").select("*").eq("user_id", userId).order("timestamp", desc=True).limit(10).execute().data
    continue_watching = []
    
    # Retrieve Watchlist
    watchlist_records = db.table("watchlist").select("movie_id").eq("user_id", userId).execute().data
    watchlist_ids = {w["movie_id"] for w in watchlist_records}
    
    df = _get_movies_df()
    if not df.empty:
        for h in history_records:
            prog = float(h.get("progress_percent", 0))
            if prog > 0 and prog < 95:
                row = df[df["movieId"] == h["movie_id"]]
                if not row.empty:
                    title = row.iloc[0]["title"]
                    continue_watching.append({
                        "movieId": h["movie_id"],
                        "title": title,
                        "progress": prog,
                        "poster": poster_for_movie(h["movie_id"])
                    })

    
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "user": user,
            "userId": userId,
            "age": db_age,
            "family_mode": family_mode,
            "children_mode": children_mode,
            "movies": movies,
            "continue_watching": continue_watching,
            "watchlist_ids": watchlist_ids
        },
    )

@app.get("/share/watchlist/{user_id}", response_class=HTMLResponse)
async def share_watchlist(request: Request, user_id: int, db = Depends(get_db)):
    """Publicly viewable watchlist."""
    users = db.table("users").select("*").eq("id", user_id).execute().data
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
        
    records = db.table("watchlist").select("*").eq("user_id", user_id).execute().data
    df = _get_movies_df()
    shared_movies = []
    
    if not df.empty:
        for r in records:
            row = df[df["movieId"] == r["movie_id"]]
            if not row.empty:
                shared_movies.append({
                    "movieId": r["movie_id"],
                    "title": row.iloc[0]["title"],
                    "poster": poster_for_movie(r["movie_id"])
                })
                
    # Track this action
    db.table("activity").insert({"user_id": user_id, "action": "shared_watchlist_viewed"}).execute()
    
    return templates.TemplateResponse("shared_watchlist.html", {
        "request": request, "username": users[0].get("username", "Guest"), "movies": shared_movies
    })

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(request: Request, db = Depends(get_db)):
    users_resp = db.table("users").select("id", count="exact").execute()
    users_count = users_resp.count if hasattr(users_resp, 'count') and users_resp.count is not None else 0
    
    watch_resp = db.table("watch_history").select("id", count="exact").execute()
    watch_count = watch_resp.count if hasattr(watch_resp, 'count') and watch_resp.count is not None else 0
    
    activities = db.table("activity").select("*").order("timestamp", desc=True).limit(20).execute().data
    
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "users_count": users_count,
        "watch_count": watch_count,
        "activities": activities
    })

@app.get("/recommend/multi")
def recommend_multi(
    user_ids: str, # Comma separated user IDs
    age: int | None = None,
    family: str = "false",
    children: str = "false",
    local_hour: int | None = None,
    mood: str = "",
    db = Depends(get_db)
):
    """Multi-User Conflict Resolver (Family Mode)"""
    user_id_list = [int(uid.strip()) for uid in user_ids.split(",") if uid.strip().isdigit()]
    if not user_id_list:
        return []
        
    family_mode = family.lower() in ("true", "1", "yes")
    children_mode = children.lower() in ("true", "1", "yes")
    if children_mode:
        family_mode = False
        
    # Get youngest age for strictness
    users = db.table("users").select("age").in_("id", user_id_list).execute().data
    min_age = age if age else min([int(u.get("age", 18)) for u in users] + [18])
    allowed = allowed_ratings(min_age, family_mode, children_mode)

    movies_df = _get_movies_df()
    if movies_df.empty:
        return []

    multi_recs: list[list[int]] = []
    for uid in user_id_list:
        recs = rec_engine.get_recommendations(uid, n=100)
        multi_recs.append(recs if recs else movies_df.head(100)["movieId"].tolist())

    if multi_recs:
        from functools import reduce
        sets = [set(r) for r in multi_recs]
        common = reduce(lambda a, b: a & b, sets)
        if len(common) >= 5:
            top_movies = [m for m in multi_recs[0] if m in common]
        else:
            # Union ranked by frequency
            counts_dict: dict = {}
            for r in multi_recs:
                for mid in r:
                    counts_dict[mid] = counts_dict.get(mid, 0) + 1
            top_movies = sorted(counts_dict, key=lambda m: -counts_dict[m])
    else:
        top_movies = movies_df.head(100)["movieId"].tolist()

    from collections import Counter
    movie_counts = Counter({m: (multi_recs[0].index(m) + 1) if m in multi_recs[0] else 999 for m in top_movies})


    result = []
    seen = set()
    for mid in top_movies:
        if mid in seen:
            continue
        row = movies_df[movies_df["movieId"] == mid]
        if row.empty:
            continue
        r0 = row.iloc[0]
        if r0["content_rating"] not in allowed:
            continue
        seen.add(mid)
        genre = (
            r0["genre"]
            if "genre" in row.columns and pd.notna(r0.get("genre"))
            else (str(r0.get("genres") or "Drama").split("|")[0].strip() if "genres" in row.columns else "Drama")
        )

        reasons = ["Match for all of you! (Spark ALS Engine)"]
        match_score = int(min((movie_counts[mid] / len(user_id_list)) * 95 + 5, 99)) # Higher if recommended to multiple people

        result.append({
            "movieId": int(mid),
            "title": r0["title"],
            "genre": genre,
            "content_rating": r0["content_rating"],
            "poster": poster_for_movie(mid),
            "reasons": reasons,
            "match_score": match_score
        })
        if len(result) >= 10:
            break
            
    # Fallback to general list if intersection yields 0 movies
    if not result:
        movies = get_movies(allowed=allowed)
        for m in movies[:10]:
            m["reasons"] = ["Trending match for the family!"]
            m["match_score"] = 90
            result.append(m)
            
    return result

@app.get("/api/search")
def search_movies(
    query: str = "",
    year: str = "",
    language: str = "",
    rating: str = "",
    sort_by: str = "",
    max_duration: int | None = None,
    mood: str = ""
):
    df = _get_movies_df()
    if df.empty:
        return []
        
    if query:
        df = df[df["title"].str.contains(query, case=False, na=False)]
    if year:
        df = df[df["title"].str.contains(f"({year})", case=False, regex=False, na=False)]
    if rating:
        df = df[df["content_rating"] == rating]
    if max_duration is not None and "duration" in df.columns:
        df = df[df["duration"] <= max_duration]
    if mood and "mood" in df.columns:
        df = df[df["mood"].str.lower() == mood.lower()]
        
    # Simplified search limits
    rows = list(df.head(20).iterrows())
    return [{
        "movieId": int(r["movieId"]),
        "title": r["title"],
        "genre": r.get("genres", "Drama").split("|")[0] if "genres" in r.index else "Drama",
        "content_rating": r.get("content_rating", "PG-13"),
        "duration": int(r["duration"]) if "duration" in r.index and pd.notna(r.get("duration")) else 120,
        "mood": str(r["mood"]) if "mood" in r.index and pd.notna(r.get("mood")) else "Neutral",
        "poster": poster_for_movie(r["movieId"]),
    } for _, r in rows]

@app.get("/recommend/{user_id}")
def recommend(
    user_id: str,
    age: int | None = None,
    family: str = "false",
    children: str = "false",
    local_hour: int | None = None,
    mood: str = "",
    max_duration: int | None = None,
    db = Depends(get_db)
):
    try:
        numeric_user_id = int(user_id)
        user_age = age if age and 1 <= age <= 120 else get_user_age(numeric_user_id)
    except ValueError:
        user_age = age if age and 1 <= age <= 120 else 18
        numeric_user_id = 0

    family_mode = family.lower() in ("true", "1", "yes")
    children_mode = children.lower() in ("true", "1", "yes")
    if children_mode:
        family_mode = False
    allowed = allowed_ratings(user_age, family_mode, children_mode)

    spark_recs = get_spark_recommendations()
    
    movies_df = _get_movies_df()
    if movies_df.empty:
        return []

    light_genres = ["Comedy", "Romance", "Animation", "Family", "Musical"]
    heavy_genres = ["Horror", "Thriller", "Action", "Crime", "War", "Drama"]

    mood_filters = {
        "happy": ["Comedy", "Animation", "Musical", "Family"],
        "thrill": ["Action", "Thriller", "Crime", "Adventure"],
        "scary": ["Horror", "Mystery"],
        "relax": ["Romance", "Drama", "Documentary"],
        "sad": ["Drama", "Romance", "Tragedy"],
        "stressed": ["Comedy", "Animation", "Documentary", "Family"],
        "bored": ["Action", "Adventure", "Sci-Fi", "Mystery"],
        "romantic": ["Romance", "Comedy"]
    }
    mood_genres = mood_filters.get(mood.lower(), [])
    
    # Fetch watch history
    history_records = db.table("watch_history").select("movie_id").eq("user_id", user_id).execute().data
    watched_movie_ids = {h["movie_id"] for h in history_records}
    watched_genres = {}
    for mid in watched_movie_ids:
        row = movies_df[movies_df["movieId"] == mid]
        if not row.empty:
            g = str(row.iloc[0].get("genres", "Drama")).split("|")[0].strip()
            watched_genres[g] = watched_genres.get(g, 0) + 1

    total_watched = sum(watched_genres.values()) or 1
    
    prefs = db.table("user_preference").select("*").eq("user_id", user_id).execute().data
    dropped_genres = {p["genre"] for p in prefs if not p.get("is_liked", True)}

    is_late_night = local_hour is not None and (local_hour >= 22 or local_hour <= 5)
    is_morning = local_hour is not None and (6 <= local_hour <= 11)

    fallback = False
    # Use the unified recommender engine (SVD + optional Spark, pre-computed)
    top_movies = rec_engine.get_recommendations(numeric_user_id, n=100)
    if not top_movies:
        fallback = True
        top_movies = movies_df.head(100)["movieId"].tolist()

    result = []
    seen = set()
    for mid in top_movies:
        if mid in seen:
            continue
        row = movies_df[movies_df["movieId"] == mid]
        if row.empty:
            continue
        r0 = row.iloc[0]
        if r0["content_rating"] not in allowed:
            continue
            
        genre = (
            r0["genre"]
            if "genre" in row.columns and pd.notna(r0.get("genre"))
            else (str(r0.get("genres") or "Drama").split("|")[0].strip() if "genres" in row.columns else "Drama")
        )
        
        if genre in dropped_genres:
            continue
            
        seen.add(mid)
        movie_duration = int(r0["duration"]) if "duration" in r0.index and pd.notna(r0.get("duration")) else 120
        movie_mood = str(r0["mood"]) if "mood" in r0.index and pd.notna(r0.get("mood")) else "Neutral"
        
        if max_duration and movie_duration > max_duration:
            continue

        reasons = []
        if is_late_night:
            if any(g in genre for g in heavy_genres):
                reasons.append("Great for a late night movie marathon")
            elif any(g in genre for g in light_genres):
                reasons.append("Perfect light late night watch")
                
        if is_morning and movie_duration <= 30:
            reasons.append("Quick watch for your morning break")

        if mood_genres and not any(g in genre for g in mood_genres):
            continue
        elif mood:
            reasons.append(f"Matches your '{mood}' mood perfectly")

        if not reasons:
            if not fallback:
                reasons.append("Spark ALS personalized pick")
            elif family_mode or children_mode:
                reasons.append("Top pick for families")
            elif watched_genres.get(genre, 0) > 0:
                pct = int((watched_genres[genre] / total_watched) * 100)
                reasons.append(f"Because your history is {pct}% {genre}")
            else:
                reasons.append(f"Because you tend to like {genre}")

        match_score = 98 - len(result) * 2

        result.append({
            "movieId": int(mid),
            "title": r0["title"],
            "genre": genre,
            "content_rating": r0["content_rating"],
            "duration": movie_duration,
            "mood": movie_mood,
            "poster": poster_for_movie(mid),
            "reasons": reasons,
            "match_score": match_score
        })
        if len(result) >= 10:
            break
            
    if len(result) < 4:
        movies = get_movies(allowed=allowed, max_duration=max_duration, mood=mood)
        for m in movies:
            if m["movieId"] not in seen:
                m["reasons"] = ["Popular pick matching filters"]
                m["match_score"] = 85
                result.append(m)
                if len(result) >= 10:
                    break
                    
    return result

class PreferenceUpdateData(BaseModel):
    user_id: int
    genre: str
    is_liked: bool

@app.get("/api/user/{user_id}/preferences")
def get_user_preferences(user_id: int, db = Depends(get_db)):
    """Explainable AI: Returns user's genre distribution and dropped genres."""
    movies_df = _get_movies_df()
    if movies_df.empty:
        return {"distribution": {}, "dropped": []}
        
    history = db.table("watch_history").select("movie_id").eq("user_id", user_id).execute().data
    watched_mids = {h["movie_id"] for h in history}
    
    genre_counts = {}
    for mid in watched_mids:
        row = movies_df[movies_df["movieId"] == mid]
        if not row.empty:
            g = str(row.iloc[0].get("genres", "Drama")).split("|")[0].strip()
            genre_counts[g] = genre_counts.get(g, 0) + 1
            
    total = sum(genre_counts.values()) or 1
    distribution = {g: int((c/total)*100) for g, c in genre_counts.items()}
    
    prefs = db.table("user_preference").select("*").eq("user_id", user_id).execute().data
    dropped = [p["genre"] for p in prefs if not p.get("is_liked", True)]
    
    return {"distribution": distribution, "dropped": dropped}

@app.post("/api/user/preferences")
def toggle_user_preference(data: PreferenceUpdateData, db = Depends(get_db)):
    res = db.table("user_preference").select("*").eq("user_id", data.user_id).eq("genre", data.genre).execute().data
    
    if res:
        db.table("user_preference").update({"is_liked": data.is_liked}).eq("id", res[0]["id"]).execute()
    else:
        db.table("user_preference").insert({"user_id": data.user_id, "genre": data.genre, "is_liked": data.is_liked}).execute()
    return {"status": "success"}

class ChatQuery(BaseModel):
    query: str

import os
try:
    import google.generativeai as genai
except Exception:
    genai = None
import random

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def search_movie_in_db(query: str) -> list:
    """Search for movies matching the query in the CSV dataset."""
    df = _get_movies_df()
    if df.empty:
        return []
    q = query.lower().strip()
    matches = df[df["title"].str.lower().str.contains(q, na=False)]
    return [row.to_dict() for _, row in matches.head(5).iterrows()]

def get_movie_info_for_chat(title: str, movie_id: int = None) -> str:
    """Get detailed movie info by scraping Google and checking local data."""
    from movie_details import fetch_cast_from_google
    
    google_data = fetch_cast_from_google(title)
    cast_names = google_data.get("cast_names", [])
    director = google_data.get("director", "Unknown")
    
    info_parts = [f"🎬 **{title}**"]
    if director and director != "Unknown":
        info_parts.append(f"🎥 Director: {director}")
    if cast_names:
        info_parts.append(f"⭐ Cast: {', '.join(cast_names[:5])}")
    
    return "\n".join(info_parts)

@app.post("/api/chat")
def handle_chat(data: ChatQuery):
    query = data.query.strip()
    if not query:
        return {"reply": "Please ask a question about movies!"}
    
    msg = query.lower()
    
    # Greetings
    if any(w in msg for w in ["hello", "hi", "hey", "namaste"]):
        return {"reply": "Hey there! 🎬 I'm CINEMAX AI. Ask me about any movie — cast, director, genre, or get recommendations! Try 'Tell me about RRR' or 'Who acted in Dangal?'"}
    
    if "who are you" in msg or "what can you do" in msg:
        return {"reply": "I'm CINEMAX AI! 🍿 I can tell you about movie cast, directors, genres, and even recommend movies based on mood. Try asking 'Cast of Baahubali' or 'Recommend a comedy'!"}

    # Movie cast queries
    cast_patterns = [
        r"(?:cast|actors?|stars?|who (?:acted|starred|is) in|who are in)\s+(.+)",
        r"(.+?)\s+(?:cast|actors?|stars?)",
        r"tell me about (.+)",
        r"info (?:about|on) (.+)",
        r"details (?:about|of|on) (.+)",
    ]
    
    for pattern in cast_patterns:
        match = re.search(pattern, msg)
        if match:
            movie_query = match.group(1).strip().strip("?.,!")
            # Search in our database
            results = search_movie_in_db(movie_query)
            if results:
                movie = results[0]
                title = movie.get("title", movie_query)
                movie_id = movie.get("movieId")
                info = get_movie_info_for_chat(title, movie_id)
                
                extra = []
                genre = movie.get("genre", movie.get("genres", ""))
                if genre:
                    extra.append(f"🎭 Genre: {genre}")
                duration = movie.get("duration")
                if duration and pd.notna(duration):
                    extra.append(f"⏱️ Duration: {int(duration)} min")
                mood = movie.get("mood")
                if mood and pd.notna(mood):
                    extra.append(f"😊 Mood: {mood}")
                
                full_info = info
                if extra:
                    full_info += "\n" + "\n".join(extra)
                
                return {"reply": full_info}
            else:
                # Try Google search anyway
                from movie_details import fetch_cast_from_google
                google_data = fetch_cast_from_google(movie_query)
                if google_data["cast_names"]:
                    parts = [f"🎬 **{movie_query.title()}**"]
                    if google_data["director"]:
                        parts.append(f"🎥 Director: {google_data['director']}")
                    parts.append(f"⭐ Cast: {', '.join(google_data['cast_names'][:5])}")
                    return {"reply": "\n".join(parts)}
                return {"reply": f"I couldn't find '{movie_query}' in our database. Try searching with the exact movie title!"}

    # Director queries
    director_patterns = [
        r"(?:who directed|director of|directed by whom)\s+(.+)",
        r"(.+?)\s+(?:director|directed by)",
    ]
    for pattern in director_patterns:
        match = re.search(pattern, msg)
        if match:
            movie_query = match.group(1).strip().strip("?.,!")
            results = search_movie_in_db(movie_query)
            if results:
                title = results[0].get("title", movie_query)
                from movie_details import fetch_cast_from_google
                google_data = fetch_cast_from_google(title)
                director = google_data.get("director", "Unknown")
                return {"reply": f"🎥 {title} was directed by **{director}**"}
            return {"reply": f"I couldn't find '{movie_query}'. Try the full movie name!"}

    # Mood-based recommendations
    mood_keywords = {
        "happy": "happy", "comedy": "happy", "funny": "happy", "laugh": "happy",
        "sad": "sad", "emotional": "sad", "cry": "sad",
        "action": "thrill", "thrill": "thrill", "exciting": "thrill", "adventure": "thrill",
        "scary": "scary", "horror": "scary", "creepy": "scary",
        "romantic": "romantic", "romance": "romantic", "love": "romantic",
        "relax": "relax", "chill": "relax", "calm": "relax",
    }
    
    if any(w in msg for w in ["recommend", "suggest", "mood", "watch", "want to see"]):
        detected_mood = None
        for keyword, mood_val in mood_keywords.items():
            if keyword in msg:
                detected_mood = mood_val
                break
        
        df = _get_movies_df()
        if not df.empty:
            if detected_mood and "mood" in df.columns:
                filtered = df[df["mood"].str.lower() == detected_mood]
                if not filtered.empty:
                    picks = filtered.sample(min(3, len(filtered)))
                    titles = [r["title"] for _, r in picks.iterrows()]
                    return {"reply": f"For a **{detected_mood}** mood, I recommend:\n🎬 " + "\n🎬 ".join(titles) + "\n\nClick on any movie poster on the homepage to see full details!"}
            
            # Random recommendations
            picks = df.sample(min(3, len(df)))
            titles = [r["title"] for _, r in picks.iterrows()]
            return {"reply": "Here are some picks for you:\n🎬 " + "\n🎬 ".join(titles) + "\n\nTell me your mood (happy, thrill, romantic, scary) for better recommendations!"}

    # Genre queries
    genre_keywords = ["action", "comedy", "drama", "horror", "romance", "thriller", "animation", "sci-fi", "fantasy", "adventure"]
    for genre in genre_keywords:
        if genre in msg and any(w in msg for w in ["movie", "film", "show", "list", "best"]):
            df = _get_movies_df()
            if not df.empty:
                genre_col = "genre" if "genre" in df.columns else "genres"
                filtered = df[df[genre_col].str.lower().str.contains(genre, na=False)]
                if not filtered.empty:
                    picks = filtered.sample(min(3, len(filtered)))
                    titles = [r["title"] for _, r in picks.iterrows()]
                    return {"reply": f"Top **{genre.title()}** movies:\n🎬 " + "\n🎬 ".join(titles)}

    # Direct movie title search as last resort
    results = search_movie_in_db(msg.strip("?.,!"))
    if results:
        movie = results[0]
        title = movie.get("title", msg)
        info = get_movie_info_for_chat(title, movie.get("movieId"))
        genre = movie.get("genre", movie.get("genres", ""))
        if genre:
            info += f"\n🎭 Genre: {genre}"
        return {"reply": info}

    # Gemini fallback if available
    if GEMINI_API_KEY and genai:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            system_prompt = "You are CINEMAX AI, an expert cinematic assistant embedded in a movie streaming platform. Keep answers brief (max 3 sentences), use emojis, and be perfectly accurate about movies, directors, and casting."
            response = model.generate_content(f"{system_prompt}\nUser Question: {query}")
            return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API Error: {e}")

    # Final fallback
    return {"reply": f"I'm not sure about that. Try asking me:\n• 'Tell me about RRR'\n• 'Cast of Baahubali'\n• 'Recommend a comedy'\n• 'Who directed Inception?'\n• 'Action movies'"}

