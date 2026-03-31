"""
Improved model training script - uses more SVD components, mean-centering,
and popularity-weighted scoring for sharper, more accurate recommendations.
Run once to generate model/model.pkl used by recommender.py
"""
import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix
import joblib
import os

os.makedirs("model", exist_ok=True)

print("Loading data...")
movies  = pd.read_csv("data/movies.csv")
ratings = pd.read_csv("data/ratings.csv")

n_users  = ratings["userId"].nunique()
n_movies = ratings["movieId"].nunique()
n_ratings = len(ratings)
print(f"  {n_ratings} ratings  |  {n_movies} movies  |  {n_users} users")

# ── Mean-center ratings per user (captures relative preference, not absolute) ──
print("Mean-centering ratings per user...")
user_means = ratings.groupby("userId")["rating"].mean()
ratings = ratings.copy()
ratings["rating_centered"] = ratings["rating"] - ratings["userId"].map(user_means)

# ── Build sparse user-item matrix ──
user_ids   = sorted(ratings["userId"].unique())
movie_ids  = sorted(ratings["movieId"].unique())
user_idx   = {u: i for i, u in enumerate(user_ids)}
movie_idx  = {m: i for i, m in enumerate(movie_ids)}

rows = ratings["userId"].map(user_idx).values
cols = ratings["movieId"].map(movie_idx).values
vals = ratings["rating_centered"].values.astype(np.float32)

sparse = csr_matrix((vals, (rows, cols)), shape=(len(user_ids), len(movie_ids)))
print(f"  Sparse matrix: {sparse.shape}  |  nnz={sparse.nnz}")

# ── SVD — 150 components for much richer latent space ──
n_components = min(150, sparse.shape[1] - 1, sparse.shape[0] - 1)
print(f"Training TruncatedSVD (n_components={n_components}, n_iter=15)...")
svd = TruncatedSVD(n_components=n_components, random_state=42, n_iter=15)
latent_matrix = svd.fit_transform(sparse)

user_index  = pd.Index(user_ids)
movie_index = pd.Index(movie_ids)

if "genre" not in movies.columns and "genres" in movies.columns:
    movies["genre"] = movies["genres"].apply(
        lambda s: (s or "Drama").split("|")[0].strip() if pd.notna(s) else "Drama"
    )

# ── Build popularity list (Bayesian-weighted score) ──
print("Computing popularity rankings...")
pop = (
    ratings.groupby("movieId")["rating"]
    .agg(["mean", "count"])
    .query("count >= 20")
    .assign(score=lambda df: df["mean"] * np.log1p(df["count"]))
    .sort_values("score", ascending=False)
    .head(500)
    .index.tolist()
)
print(f"  Top {len(pop)} popular movies identified.")

model_data = {
    "svd":            svd,
    "latent_matrix":  latent_matrix,
    "user_index":     user_index,
    "movie_index":    movie_index,
    "movies":         movies,
    "popular":        [int(m) for m in pop],
    "user_means":     user_means.to_dict(),
}

joblib.dump(model_data, "model/model.pkl")
explained = svd.explained_variance_ratio_.sum()
print(f"\n✅ Model trained — {explained*100:.1f}% variance explained.")
print("   Saved to model/model.pkl")
print(f"   Components: {n_components}  |  Users: {len(user_ids)}  |  Movies: {len(movie_ids)}")
