from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, WatchHistory, Movie
from pathlib import Path
import pandas as pd
import random
from datetime import datetime

smart_router = APIRouter(prefix="/api/smart", tags=["smart"])

BASE_DIR = Path(__file__).resolve().parent

# Genre mappings for mood-based recommendations
MOOD_GENRES = {
    "happy": ["Comedy", "Animation", "Musical", "Family", "Romance"],
    "sad": ["Drama", "Romance", "Musical"],
    "thrilled": ["Action", "Thriller", "Sci-Fi", "Adventure", "Crime"],
    "relaxed": ["Comedy", "Family", "Documentary", "Animation"],
    "romantic": ["Romance", "Drama", "Comedy"],
    "scared": ["Horror", "Thriller", "Mystery"],
    "inspired": ["Documentary", "Drama", "War", "Adventure"],
    "nostalgic": ["Animation", "Family", "Comedy", "Fantasy"],
}

# Family-safe genres
FAMILY_GENRES = ["Animation", "Family", "Comedy", "Adventure", "Fantasy", "Musical"]
KIDS_GENRES = ["Animation", "Children", "Family", "Fantasy", "Comedy"]
ADULT_GENRES = ["Horror", "Crime", "Thriller", "War"] # Excluded for kids/family

# --- Module-level DataFrame cache (avoids re-reading CSV on every request) ---
_MOVIES_DF_CACHE: pd.DataFrame | None = None

def _load_movies() -> pd.DataFrame:
    global _MOVIES_DF_CACHE
    if _MOVIES_DF_CACHE is not None:
        return _MOVIES_DF_CACHE
    path = BASE_DIR / "data" / "movies.csv"
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path)
    # Ensure a unified 'genre_str' column for fast vectorized filtering
    if "genres" in df.columns:
        df["_genre_str"] = df["genres"].fillna("Drama").str.lower()
    elif "genre" in df.columns:
        df["_genre_str"] = df["genre"].fillna("Drama").str.lower()
    else:
        df["_genre_str"] = "drama"
    _MOVIES_DF_CACHE = df
    return df

def _poster(mid):
    return f"/api/ai/poster/{mid}"

def _format(df, limit=20):
    rows = list(df.head(limit).iterrows())
    results = []
    for _, r in rows:
        genres_raw = str(r.get("genres", r.get("genre", "Drama")))
        genre = genres_raw.split("|")[0].strip() if "|" in genres_raw else genres_raw.strip()
        results.append({
            "movieId": int(r["movieId"]),
            "title": r["title"],
            "genre": genre,
            "genres": genres_raw.split("|") if "|" in genres_raw else [genres_raw],
            "poster": _poster(r["movieId"]),
            "duration": int(r.get("duration", 120)) if pd.notna(r.get("duration")) else 120,
            "content_rating": str(r.get("content_rating", "PG-13")),
            "mood": str(r.get("mood", "Neutral")),
        })
    return results

@smart_router.get("/mood/{mood}")
def get_mood_recommendations(mood: str):
    """Get movies matching a mood/emotion"""
    df = _load_movies()
    if df.empty:
        return []
    
    mood = mood.lower()
    target_genres = MOOD_GENRES.get(mood, ["Drama", "Comedy"])
    
    # Filter movies that match any target genre
    def matches(row):
        g = str(row.get("genres", row.get("genre", "")))
        return any(tg.lower() in g.lower() for tg in target_genres)
    
    filtered = df[df.apply(matches, axis=1)]
    if filtered.empty:
        filtered = df
    
    # Shuffle for variety
    filtered = filtered.sample(frac=1, random_state=random.randint(1, 999))
    return _format(filtered)

@smart_router.get("/family")
def get_family_recommendations():
    """Family-friendly curated content"""
    df = _load_movies()
    if df.empty:
        return []
    
    def is_family(row):
        g = str(row.get("genres", row.get("genre", "")))
        has_family = any(fg.lower() in g.lower() for fg in FAMILY_GENRES)
        has_adult = any(ag.lower() in g.lower() for ag in ADULT_GENRES)
        return has_family and not has_adult
    
    filtered = df[df.apply(is_family, axis=1)]
    if filtered.empty:
        filtered = df.head(20)
    
    return _format(filtered.sample(frac=1, random_state=random.randint(1, 999)))

@smart_router.get("/kids")
def get_kids_recommendations():
    """Kids-safe curated content"""
    df = _load_movies()
    if df.empty:
        return []
    
    def is_kids(row):
        g = str(row.get("genres", row.get("genre", "")))
        has_kids = any(kg.lower() in g.lower() for kg in KIDS_GENRES)
        has_adult = any(ag.lower() in g.lower() for ag in ADULT_GENRES)
        return has_kids and not has_adult
    
    filtered = df[df.apply(is_kids, axis=1)]
    if filtered.empty:
        filtered = df.head(15)
    
    return _format(filtered.sample(frac=1, random_state=random.randint(1, 999)))

@smart_router.get("/behavior/{user_id}")
def get_behavior_profile(user_id: int, db: Session = Depends(get_db)):
    """Analyze user's watching behavior and return insights"""
    history = db.query(WatchHistory).filter(WatchHistory.user_id == user_id).all()
    
    if not history:
        # Return default profile for new users
        return {
            "total_watched": 0,
            "avg_completion": 0,
            "favorite_time": "evening",
            "top_genres": ["Drama", "Action", "Comedy"],
            "behavior_tags": ["New Explorer"],
            "mood_tendency": "curious",
            "binge_score": 0,
            "diversity_score": 50,
            "insights": [
                "Start watching to unlock personalized insights!",
                "Your taste profile is being calibrated...",
            ],
            "language_breakdown": {"English": 100},
        }
    
    total = len(history)
    avg_completion = sum(h.progress_percent for h in history) / total if total else 0
    
    # Analyze watch times
    hours = [h.timestamp.hour for h in history if h.timestamp]
    avg_hour = sum(hours) / len(hours) if hours else 20
    
    if avg_hour < 6:
        fav_time = "late_night"
        time_label = "Night Owl 🦉"
    elif avg_hour < 12:
        fav_time = "morning"
        time_label = "Morning Viewer ☀️"
    elif avg_hour < 17:
        fav_time = "afternoon"
        time_label = "Afternoon Binger 🌤️"
    elif avg_hour < 21:
        fav_time = "evening"
        time_label = "Evening Enthusiast 🌙"
    else:
        fav_time = "night"
        time_label = "Night Streamer 🌃"
    
    # Genre analysis from watched movie IDs
    df = _load_movies()
    genre_counts = {}
    lang_counts = {}
    for h in history:
        row = df[df["movieId"] == h.movie_id]
        if not row.empty:
            genres = str(row.iloc[0].get("genres", "Drama")).split("|")
            for g in genres:
                g = g.strip()
                genre_counts[g] = genre_counts.get(g, 0) + 1
    
    top_genres = sorted(genre_counts, key=genre_counts.get, reverse=True)[:5] if genre_counts else ["Drama"]
    
    # Behavior tags
    tags = [time_label]
    if avg_completion > 80:
        tags.append("Completionist 🏆")
    if avg_completion < 30:
        tags.append("Channel Surfer 📺")
    if total > 10:
        tags.append("Binge Master 🍿")
    if len(set(genre_counts.keys())) > 5:
        tags.append("Genre Explorer 🧭")
    
    # Binge score (0-100)
    binge_score = min(100, int((total / 20) * 100))
    
    # Diversity score
    unique_genres = len(set(genre_counts.keys()))
    diversity_score = min(100, unique_genres * 15)
    
    # Mood tendency based on most watched genres
    primary_genre = top_genres[0] if top_genres else "Drama"
    mood_map = {
        "Action": "thrilled", "Thriller": "thrilled", "Horror": "scared",
        "Comedy": "happy", "Romance": "romantic", "Drama": "reflective",
        "Animation": "nostalgic", "Documentary": "inspired",
    }
    mood_tendency = mood_map.get(primary_genre, "curious")
    
    # Generate smart insights
    insights = []
    if top_genres:
        insights.append(f"You gravitate towards {top_genres[0]} content — it's clearly your comfort zone")
    if fav_time == "late_night":
        insights.append("You're a night owl! We notice you watch more intense content after midnight")
    elif fav_time == "morning":
        insights.append("Early bird! You prefer lighter content during morning hours")
    if avg_completion > 85:
        insights.append("You rarely abandon a movie — once you start, you're committed!")
    if avg_completion < 40:
        insights.append("You seem to sample a lot of content. Maybe try our mood-based recommendations?")
    if total > 5 and len(top_genres) >= 3:
        insights.append(f"Your taste spans {top_genres[0]}, {top_genres[1]}, and {top_genres[2]} — quite eclectic!")
    
    return {
        "total_watched": total,
        "avg_completion": round(avg_completion, 1),
        "favorite_time": fav_time,
        "top_genres": top_genres,
        "behavior_tags": tags,
        "mood_tendency": mood_tendency,
        "binge_score": binge_score,
        "diversity_score": diversity_score,
        "insights": insights or ["Keep watching to unlock deeper insights!"],
        "language_breakdown": lang_counts if lang_counts else {"English": 100},
    }

@smart_router.get("/home_feed")
def get_home_feed(user_id: int = None, db: Session = Depends(get_db)):
    """Returns categorized movies for Netflix-style rows on the Home Page.
    Uses vectorized str.contains() instead of slow per-row df.apply()."""
    df = _load_movies()
    if df.empty:
        return {}

    gs = df["_genre_str"]  # Pre-computed lowercase genre column
    titles_lower = df["title"].str.lower()

    def sample_movies(mask: pd.Series, limit: int = 15):
        filtered = df[mask]
        if filtered.empty:
            return None
        return filtered.sample(n=min(limit, len(filtered)), random_state=random.randint(1, 999))

    feed = {}

    import recommender as rec_engine

    # 1. Continue Watching
    if user_id:
        history = db.query(WatchHistory).filter(WatchHistory.user_id == user_id).order_by(WatchHistory.timestamp.desc()).all()
        cw = []
        seen_h = set()
        for h in history:
            if h.movie_id not in seen_h and 0 < h.progress_percent < 100:
                seen_h.add(h.movie_id)
                row = df[df["movieId"] == h.movie_id]
                if not row.empty:
                    m = _format(row.head(1))[0]
                    m["progress"] = h.progress_percent
                    cw.append(m)
            if len(cw) >= 10: break
        if cw:
            feed["▶ Continue Watching"] = cw

    # 2. My List
    if user_id:
        from database import Watchlist
        wl = db.query(Watchlist).filter(Watchlist.user_id == user_id).order_by(Watchlist.timestamp.desc()).all()
        wl_movies = []
        for w in wl[:15]:
            row = df[df["movieId"] == w.movie_id]
            if not row.empty:
                wl_movies.append(_format(row.head(1))[0])
        if wl_movies:
            feed["📌 My List"] = wl_movies

    # 3. Trending Now (Top 10)
    if hasattr(rec_engine, "_MODEL_DATA") and "popular" in rec_engine._MODEL_DATA:
        pop_ids = rec_engine._MODEL_DATA["popular"][:20]
        trending = []
        for mid in pop_ids[:15]:
            row = df[df["movieId"] == mid]
            if not row.empty:
                trending.append(_format(row.head(1))[0])
        if trending:
            feed["🔥 Trending Now"] = trending
    else:
        sampled = df.sample(n=min(15, len(df)), random_state=random.randint(1, 999))
        feed["🔥 Trending Now"] = _format(sampled)

    # 2. Regional Blockbusters (title-based keyword match — vectorized)
    regional_terms = ["baahubali", "rrr", "pushpa", "dangal", "pk", "kgf", "jawan", "pathaan", "3 idiots"]
    regional_mask = titles_lower.str.contains("|".join(regional_terms), na=False)
    s = sample_movies(regional_mask)
    if s is not None:
        feed["🇮🇳 Regional Blockbusters"] = _format(s)

    # 3. Action & Thrillers
    s = sample_movies(gs.str.contains("action|thriller", na=False))
    if s is not None:
        feed["🎬 Action & Thrillers"] = _format(s)

    # 4. Sci-Fi & Fantasy
    s = sample_movies(gs.str.contains("sci-fi|fantasy", na=False))
    if s is not None:
        feed["🌌 Sci-Fi & Fantasy"] = _format(s)

    # 5. Comedy Gold
    s = sample_movies(gs.str.contains("comedy", na=False))
    if s is not None:
        feed["😂 Comedy Gold"] = _format(s)

    # 6. Romance & Drama
    s = sample_movies(gs.str.contains("romance|drama", na=False))
    if s is not None:
        feed["❤️ Romance & Drama"] = _format(s)

    # 7. Animation & Family
    s = sample_movies(gs.str.contains("animation|children", na=False))
    if s is not None:
        feed["🧸 Animation & Family"] = _format(s)

    return feed
