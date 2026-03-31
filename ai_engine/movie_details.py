from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd
import json
import random
import re
import urllib.request
import urllib.parse
import html as html_module
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

movie_router = APIRouter(prefix="/api/movies", tags=["movies"])

# In-memory cache for Google-scraped cast data
GOOGLE_CAST_CACHE = {}

def fetch_cast_from_tmdb(movie_id: int) -> dict:
    """Fetch cast from TMDB page using JSON-LD structured data (reliable, no API key needed)."""
    links_path = BASE_DIR / "data" / "ml-latest-small" / "links.csv"
    tmdb_id = None
    if links_path.exists():
        try:
            import pandas as pd_local
            links_df = pd_local.read_csv(links_path)
            row = links_df[links_df["movieId"] == movie_id]
            if not row.empty and pd_local.notna(row.iloc[0]["tmdbId"]):
                tmdb_id = int(row.iloc[0]["tmdbId"])
        except Exception:
            pass

    if not tmdb_id:
        return {"cast_names": [], "director": None}

    try:
        url = f"https://www.themoviedb.org/movie/{tmdb_id}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        content = urllib.request.urlopen(req, timeout=8, context=ctx).read().decode("utf-8", errors="ignore")

        cast_names = []
        director = None

        # Parse JSON-LD (most reliable - structured data TMDB includes)
        # TMDB wraps in CDATA: /* <![CDATA[ */ ... /* ]]> */ — strip these
        ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
        if ld_match:
            try:
                raw_json = ld_match.group(1)
                # Strip CDATA wrappers
                raw_json = re.sub(r'/\*\s*<!\[CDATA\[\s*\*/', '', raw_json)
                raw_json = re.sub(r'/\*\s*\]\]>\s*\*/', '', raw_json)
                raw_json = raw_json.strip()
                data = json.loads(raw_json)
                # Extract actors
                actors = data.get("actor", [])
                if isinstance(actors, list):
                    cast_names = [a.get("name", "").strip() for a in actors[:6] if a.get("name")]
                elif isinstance(actors, dict):
                    name = actors.get("name", "").strip()
                    if name:
                        cast_names = [name]
                # Extract director
                director_data = data.get("director", {})
                if isinstance(director_data, list) and director_data:
                    director = director_data[0].get("name", "").strip()
                elif isinstance(director_data, dict):
                    director = director_data.get("name", "").strip()
            except Exception as ex:
                print(f"JSON-LD parse error: {ex}")


        # Fallback: parse crew section from HTML for director
        if not director:
            dir_match = re.search(r'Director\s*</p>\s*.*?<a[^>]*>([^<]+)</a>', content, re.DOTALL)
            if dir_match:
                director = html_module.unescape(dir_match.group(1)).strip()

        return {"cast_names": cast_names, "director": director or None}

    except Exception as e:
        print(f"TMDB cast fetch error for tmdb_id={tmdb_id}: {e}")
        return {"cast_names": [], "director": None}


def fetch_cast_from_google(title: str) -> dict:
    """Scrape Google search results to find real cast, director info for a movie (fallback)."""
    if title in GOOGLE_CAST_CACHE:
        return GOOGLE_CAST_CACHE[title]

    clean_title = re.sub(r'\(\d{4}\)', '', title).strip()

    try:
        query = f"{clean_title} movie cast director"
        url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0'
        })
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        response = urllib.request.urlopen(req, timeout=8, context=ctx)
        html_content = response.read().decode('utf-8', errors='ignore')

        cast_names = []
        director = None

        # Method 1: Look for "Directed by" or "Director" patterns
        dir_patterns = [
            r'(?:Directed by|Director)[:\s]*([A-Z][a-zA-Z\s\.\-]+?)(?:[,<\|])',
            r'(?:directed by|Director)[:\s]*<[^>]*>([^<]+)<',
        ]
        for pat in dir_patterns:
            m = re.search(pat, html_content)
            if m:
                director = m.group(1).strip()
                director = html_module.unescape(director)
                if len(director) < 40 and director:
                    break
                else:
                    director = None

        # Method 2: Stars or Cast patterns
        star_patterns = [
            r'Stars?[:\s]*([A-Z][a-zA-Z\s,\.\-&]+?)(?:<|$)',
            r'(?:Cast|Starring)[:\s]*([A-Z][a-zA-Z\s,\.\'&-]+?)(?:<|\|)',
        ]
        for pat in star_patterns:
            matches = re.findall(pat, html_content)
            for match in matches:
                names = [n.strip() for n in match.split(",")]
                for name in names:
                    name = html_module.unescape(name).strip()
                    if 3 < len(name) < 40 and ' ' in name and not any(c in name for c in ['<', '>', '&', '{', '}']):
                        if name not in cast_names:
                            cast_names.append(name)
                if cast_names:
                    break
            if cast_names:
                break

        # Method 3: aria-label fallback
        if not cast_names:
            aria_matches = re.findall(r'aria-label="([^"]+)"', html_content)
            for label in aria_matches:
                label = html_module.unescape(label)
                if 3 < len(label) < 35 and ' ' in label and label[0].isupper():
                    if not any(kw in label.lower() for kw in ['search', 'google', 'more', 'image', 'video', 'menu', 'click', 'view', 'filter', 'tab']):
                        if label not in cast_names:
                            cast_names.append(label)
                            if len(cast_names) >= 6:
                                break

        result = {
            "cast_names": cast_names[:6] if cast_names else [],
            "director": director if director else None
        }

        GOOGLE_CAST_CACHE[title] = result
        return result

    except Exception as e:
        print(f"Google cast search error for '{title}': {e}")
        return {"cast_names": [], "director": None}


def fetch_extra_roles(title: str, cast_names: list) -> dict:
    """Refine roles like hero, heroine and fetch producers."""
    hero = cast_names[0] if len(cast_names) > 0 else "Unknown"
    heroine = cast_names[1] if len(cast_names) > 1 else "Unknown"
    
    # Try to refine heroine by identifying common female name endings
    female_endings = ('a', 'i', 'y', 'ee', 'ah', 'ia')
    for name in cast_names[1:5]:
        first_name = name.split()[0].lower()
        if any(first_name.endswith(end) for end in female_endings):
            heroine = name
            break
            
    # Exception handling for Indian male names that end with 'a'
    if heroine.split()[0].lower() in ['shiva', 'naga', 'ravi', 'surya', 'rana', 'teja', 'brahma', 'naga', 'adi', 'bobby', 'ali', 'mani']:
         heroine = cast_names[1] if len(cast_names) > 1 else "Unknown"

    producers = ["Unknown"]
    
    # Try wikipedia as a reliable source for producers
    try:
        import urllib.request, json, re
        clean_title = re.sub(r'\(\d{4}\)', '', title).strip()
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(clean_title + ' film')}&utf8=&format=json"
        req = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=3).read().decode('utf-8')
        data = json.loads(res)
        if data.get("query", {}).get("search"):
            page_title = data["query"]["search"][0]["title"]
            page_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&titles={urllib.parse.quote(page_title)}&format=json"
            req2 = urllib.request.Request(page_url, headers={'User-Agent': 'Mozilla/5.0'})
            res2 = urllib.request.urlopen(req2, timeout=3).read().decode('utf-8')
            data2 = json.loads(res2)
            pages = data2.get("query", {}).get("pages", {})
            content = list(pages.values())[0]["revisions"][0]["*"]
            
            # Extract producer
            m = re.search(r'\|\s*producer\s*=\s*(.+?)(?=\n\||\n}})', content, re.DOTALL)
            if m:
                text = m.group(1)
                text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)
                text = re.sub(r'<[^>]+>', '', text)
                names = [n.strip() for n in re.split(r'<br\s*/?>|\\n|,|&', text) if n.strip() and "{" not in n and "[" not in n]
                if names:
                    producers = [n for n in names if len(n) > 2][:3]
    except Exception as e:
        pass
        
    return {"hero": hero, "heroine": heroine, "producers": producers}



def background_scrape_and_update(movie_id: int, title: str, clean_title: str, genres_list: list, year: int, duration: int, languages: list, description: str, poster_url: str):
    from database import get_supabase
    # Fetch real cast
    tmdb_data = fetch_cast_from_tmdb(movie_id)
    cast_names = tmdb_data["cast_names"]
    director = tmdb_data["director"]

    if not cast_names:
        google_data = fetch_cast_from_google(title)
        cast_names = google_data["cast_names"]
        if not director:
            director = google_data["director"]

    director = director or "Unknown"
    cast_str = ",".join(cast_names) if cast_names else ""
    extra_roles = fetch_extra_roles(clean_title, cast_names)

    db_cli = get_supabase()
    
    try:
        res = db_cli.table("movies").select("*").eq("movie_id", movie_id).execute().data
        
        prods = extra_roles.get("producers", ["Unknown"])
        
        movie_data = {
            "movie_id": movie_id,
            "title": clean_title,
            "genres": "|".join(genres_list),
            "duration": duration,
            "description": description,
            "rating": round(random.uniform(7.0, 9.5), 1),
            "release_year": year,
            "languages": ",".join(languages),
            "poster_url": poster_url,
            "cast": cast_str,
            "director": director,
            "hero": extra_roles.get("hero", "Unknown"),
            "heroine": extra_roles.get("heroine", "Unknown"),
            "producers": ",".join(prods) if isinstance(prods, list) else prods
        }
        
        if not res:
            db_cli.table("movies").insert(movie_data).execute()
        else:
            db_cli.table("movies").update({
                "cast": cast_str,
                "director": director,
                "hero": extra_roles.get("hero", "Unknown"),
                "heroine": extra_roles.get("heroine", "Unknown"),
                "producers": ",".join(prods) if isinstance(prods, list) else prods
            }).eq("id", res[0]["id"]).execute()
    except Exception as e:
        print(f"Error saving movie to Supabase: {e}")

@movie_router.get("/{movie_id}")
def get_movie_details(movie_id: int, background_tasks: BackgroundTasks, db = Depends(get_db)):
    # 1. First check the new HD Database
    db_movie_list = db.table("movies").select("*").eq("movie_id", movie_id).execute().data
    db_movie = db_movie_list[0] if db_movie_list else None

    # 2. If it exists in DB with full data including real cast (not placeholder), return it
    if db_movie and db_movie.get("description") and db_movie.get("cast") and "Actor 1" not in db_movie.get("cast", ""):
        cast_str = db_movie.get("cast", "")
        return {
            "movie_id": db_movie.get("movie_id"),
            "title": db_movie.get("title"),
            "genres": db_movie.get("genres", "").split("|") if db_movie.get("genres") else ["Drama"],
            "rating": db_movie.get("rating") or round(random.uniform(6.5, 9.5), 1),
            "release_year": db_movie.get("release_year") or 2020,
            "duration": db_movie.get("duration") or 120,
            "languages": db_movie.get("languages", "").split(",") if db_movie.get("languages") else ["English", "Hindi"],
            "description": db_movie.get("description"),
            "trailer_url": f"https://www.youtube.com/results?search_query={db_movie.get('title', '').replace(' ', '+')}+trailer",
            "poster": f"/api/ai/poster/{movie_id}",
            "cast": [{"name": c.strip(), "image": f"https://ui-avatars.com/api/?name={urllib.parse.quote(c.strip())}&background=random&color=fff&size=200"} for c in cast_str.split(",")] if cast_str else [],
            "director": db_movie.get('director') or "Unknown",
            "hero": db_movie.get('hero') or "Unknown",
            "heroine": db_movie.get('heroine') or "Unknown",
            "producers": db_movie.get('producers', "").split(",") if db_movie.get('producers') else ["Unknown"],
        }

    # 3. Look up the movie from CSV for fast fallback return
    from app import _get_movies_df
    df = _get_movies_df()
    if df.empty:
        raise HTTPException(status_code=404, detail="Movie not found")
    row = df[df["movieId"] == movie_id]

    if row.empty:
        raise HTTPException(status_code=404, detail="Movie not found")

    m = row.iloc[0]
    title = m["title"]

    # Extract year from title if present "Title (Year)"
    year_match = re.search(r'\((\d{4})\)', title)
    year = int(year_match.group(1)) if year_match else 2020
    clean_title = re.sub(r'\(\d{4}\)', '', title).strip()

    genres_list = str(m.get("genres", m.get("genre", "Drama"))).split("|")

    # 4. We don't have full cast data. Return fast placeholder data and background the rest
    description = f"{clean_title} is a captivating {genres_list[0].lower()} film that has won the hearts of audiences worldwide."
    duration = int(m.get("duration", 120)) if pd.notna(m.get("duration")) else 120
    poster_url = f"/api/ai/poster/{movie_id}"
    languages = ["English"]
    
    background_tasks.add_task(
        background_scrape_and_update,
        movie_id, title, clean_title, genres_list, year, duration, languages, description, poster_url
    )

    details = {
        "movie_id": movie_id,
        "title": clean_title,
        "genres": genres_list,
        "rating": round(random.uniform(7.0, 9.5), 1),
        "release_year": year,
        "duration": duration,
        "languages": languages,
        "description": description,
        "trailer_url": f"https://www.youtube.com/results?search_query={clean_title.replace(' ', '+')}+trailer",
        "poster": poster_url,
        "cast": [{"name": "Loading cast...", "image": None}],
        "director": "Loading director...",
        "hero": "Loading hero...",
        "heroine": "Loading heroine...",
        "producers": ["Loading producer..."],
    }
    return details


@movie_router.get("/{movie_id}/similar")
def get_similar_movies(movie_id: int):
    """Returns 10 similar movies based on genre to avoid fetching the entire home feed."""
    from app import _get_movies_df, poster_for_movie
    df = _get_movies_df()
    if df.empty:
        return []
        
    row = df[df["movieId"] == movie_id]
    if row.empty:
        return []
        
    m = row.iloc[0]
    genres_list = str(m.get("genres", m.get("genre", "Drama"))).split("|")
    primary_genre = genres_list[0].lower().strip()
    
    # Fast vectorized search
    similar_df = df[
        (df["movieId"] != movie_id) & 
        (df["_genre_str"].str.contains(primary_genre, na=False))
    ]
    
    if similar_df.empty:
        similar_df = df[df["movieId"] != movie_id]
        
    sampled = similar_df.sample(min(10, len(similar_df)), random_state=random.randint(1, 999))
    
    results = []
    for _, r in sampled.iterrows():
        g_raw = str(r.get("genres", r.get("genre", "Drama")))
        genre = g_raw.split("|")[0].strip() if "|" in g_raw else g_raw.strip()
        results.append({
            "movieId": int(r["movieId"]),
            "title": re.sub(r'\(\d{4}\)', '', r["title"]).strip(),
            "genre": genre,
            "poster": poster_for_movie(r["movieId"]),
        })
        
    return results

