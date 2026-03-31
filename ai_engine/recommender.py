"""
Pure Python Collaborative Filtering Recommendation Engine
Uses SVD (sklearn TruncatedSVD) on MovieLens ratings data.
Pre-computes recommendations at startup and caches them.
Falls back gracefully for new/cold-start users.
"""
from pathlib import Path
import pandas as pd
import numpy as np
import random
import threading

HAS_ML = True
try:
    import joblib
except ImportError:
    HAS_ML = False

BASE_DIR = Path(__file__).resolve().parent

# ─── Global cache ──────────────────────────────────────────────
_RECS_CACHE: dict[int, list[int]] = {}   # {user_id: [movieId, ...]}
_MODEL_DATA: dict = {}
_LOCK = threading.Lock()
_READY = False   # True once background init has finished

# ─── Public API ────────────────────────────────────────────────
def get_recommendations(user_id: int, n: int = 50) -> list[int]:
    """Return top-N recommended movieIds for a user (fast, no DB needed)."""
    uid = _coerce_int(user_id)
    if uid in _RECS_CACHE:
        return _RECS_CACHE[uid][:n]
    return _cold_start_fallback(n)

def get_similar_movies(movie_id: int, n: int = 10) -> list[int]:
    """Return 'More Like This' movies based on SVD vector cosine similarity."""
    mid = _coerce_int(movie_id)
    
    latent = _MODEL_DATA.get("latent_matrix")
    movie_index = _MODEL_DATA.get("movie_index")
    svd = _MODEL_DATA.get("svd")
    
    if latent is not None and svd is not None and movie_index is not None and mid in movie_index:
        try:
            # Reconstruct item factors: V matrix (components_)
            # V is (n_components, n_items). V.T is (n_items, n_components)
            item_factors = svd.components_.T
            idx = movie_index.get_loc(mid)
            target_vector = item_factors[idx]
            
            # Compute cosine similarity
            from numpy.linalg import norm
            import numpy as np
            norms = norm(item_factors, axis=1)
            target_norm = norm(target_vector)
            
            if target_norm == 0:
                return _cold_start_fallback(n)
                
            sims = np.dot(item_factors, target_vector) / (norms * target_norm + 1e-9)
            
            # Get top N most similar indices (excluding the movie itself)
            sims[idx] = -1.0 
            top_indices = sims.argsort()[::-1][:n]
            return [int(movie_index[i]) for i in top_indices]
        except Exception as e:
            print(f"Error computing similarity: {e}")
            
    return _cold_start_fallback(n)

def is_ready() -> bool:
    return _READY

def init_async():
    """Call once at startup – runs in a background thread so startup is instant."""
    t = threading.Thread(target=_build, daemon=True)
    t.start()


# ─── Internals ─────────────────────────────────────────────────
def _coerce_int(v) -> int:
    try:
        return int(v)
    except Exception:
        return 0

def _cold_start_fallback(n: int) -> list[int]:
    """Return popular movies when user has no history."""
    if "popular" in _MODEL_DATA:
        ids = _MODEL_DATA["popular"]
        shuffled = ids[:]
        random.shuffle(shuffled)
        return shuffled[:n]
    return []

def _build():
    global _RECS_CACHE, _MODEL_DATA, _READY

    print("[Recommender] Starting recommendation engine init...")

    ratings_path = BASE_DIR / "data" / "ratings.csv"
    model_path   = BASE_DIR / "model"  / "model.pkl"

    # ── Step 1: Try loading pre-trained model ──
    if model_path.exists() and HAS_ML:
        try:
            data = joblib.load(str(model_path))
            _MODEL_DATA.update(data)
            print("[Recommender] Loaded pre-trained SVD model.")
        except Exception as e:
            print(f"[Recommender] Could not load model.pkl: {e}")

    # ── Step 2: Build popular-movies fallback ──
    if ratings_path.exists():
        try:
            ratings = pd.read_csv(ratings_path)
            pop = (
                ratings.groupby("movieId")["rating"]
                .agg(["mean", "count"])
                .query("count >= 10")
                .assign(score=lambda df: df["mean"] * np.log1p(df["count"]))
                .sort_values("score", ascending=False)
                .head(500)
                .index.tolist()
            )
            _MODEL_DATA["popular"] = [int(m) for m in pop]
            print(f"[Recommender] Built popularity list ({len(pop)} movies).")
        except Exception as e:
            print(f"[Recommender] Could not build popularity list: {e}")

    # ── Step 3: Pre-compute personalised recs for every known user ──
    svd           = _MODEL_DATA.get("svd")
    latent_matrix = _MODEL_DATA.get("latent_matrix")
    user_index    = _MODEL_DATA.get("user_index")   # pd.Index of user IDs
    movie_index   = _MODEL_DATA.get("movie_index")  # pd.Index of movie IDs

    if svd is not None and latent_matrix is not None and user_index is not None and HAS_ML:
        recs: dict[int, list[int]] = {}
        print(f"[Recommender] Pre-computing recs for {len(user_index)} users...")
        # pred_matrix[user_idx, :] = estimated ratings for all items
        pred_matrix = latent_matrix @ svd.components_   # (n_users, n_movies)

        for uid_raw in user_index:
            try:
                uid  = int(uid_raw)
                idx  = user_index.get_loc(uid_raw)
                preds = pred_matrix[idx]
                top_indices = preds.argsort()[::-1][:100]
                top_movie_ids = [int(movie_index[i]) for i in top_indices]
                recs[uid] = top_movie_ids
            except Exception:
                pass

        with _LOCK:
            _RECS_CACHE.update(recs)
        print(f"[Recommender] Pre-computed {len(recs)} user profiles ✓")
    else:
        print("[Recommender] SVD model not found – will use popularity fallback.")

    # ── Step 4: Also pre-compute recs from spark CSV if it exists ──
    spark_path = BASE_DIR / "data" / "spark_recommendations.csv"
    if spark_path.exists():
        try:
            df = pd.read_csv(spark_path)
            count = 0
            for _, row in df.iterrows():
                uid  = int(row["userId"])
                mids = [int(m.strip()) for m in str(row["movieIds"]).split(",") if m.strip().isdigit()]
                if mids:
                    # Merge: Spark recs first, then SVD recs
                    existing = _RECS_CACHE.get(uid, [])
                    merged   = list(dict.fromkeys(mids + existing))   # dedup, Spark first
                    _RECS_CACHE[uid] = merged
                    count += 1
            print(f"[Recommender] Merged Spark recs for {count} users ✓")
        except Exception as e:
            print(f"[Recommender] Could not load spark_recommendations.csv: {e}")

    _READY = True
    print("[Recommender] ✅ Ready — all recommendation data loaded.")
