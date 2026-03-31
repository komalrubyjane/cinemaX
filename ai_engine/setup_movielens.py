"""
Download MovieLens ml-latest-small and convert to project format.
Adds content_rating for filtering. Run once: python setup_movielens.py
"""
import os
import zipfile
import urllib.request
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
ZIP_PATH = os.path.join(DATA_DIR, "ml-latest-small.zip")
EXTRACT_DIR = os.path.join(DATA_DIR, "ml-latest-small")

os.makedirs(DATA_DIR, exist_ok=True)

# Download
if not os.path.exists(ZIP_PATH):
    print("Downloading MovieLens ml-latest-small...")
    urllib.request.urlretrieve(URL, ZIP_PATH)
    print("Downloaded.")

# Extract
if not os.path.isdir(EXTRACT_DIR):
    print("Extracting...")
    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        z.extractall(DATA_DIR)
    print("Extracted.")

# Load MovieLens files
movies_ml = pd.read_csv(os.path.join(EXTRACT_DIR, "movies.csv"))
ratings_ml = pd.read_csv(os.path.join(EXTRACT_DIR, "ratings.csv"))

# Assign content_rating by genre (first genre)
def rating_for_genres(genres_str):
    if pd.isna(genres_str) or genres_str == "(no genres listed)":
        return "PG-13"
    g = genres_str.lower()
    if "children" in g or "animation" in g:
        return np.random.choice(["G", "PG"], p=[0.6, 0.4])
    if "horror" in g or "film-noir" in g:
        return np.random.choice(["R", "PG-13"], p=[0.7, 0.3])
    if "war" in g or "crime" in g:
        return np.random.choice(["R", "PG-13"], p=[0.5, 0.5])
    if "thriller" in g:
        return np.random.choice(["PG-13", "R"], p=[0.6, 0.4])
    if "drama" in g or "romance" in g or "comedy" in g:
        return np.random.choice(["PG-13", "PG", "R"], p=[0.5, 0.3, 0.2])
    if "action" in g or "adventure" in g or "sci-fi" in g:
        return np.random.choice(["PG-13", "PG", "R"], p=[0.5, 0.3, 0.2])
    return "PG-13"

movies_ml["genre"] = movies_ml["genres"].apply(
    lambda s: (s or "Drama").split("|")[0].strip() if pd.notna(s) and s else "Drama"
)
movies_ml["content_rating"] = movies_ml["genres"].apply(rating_for_genres)

# Save in project format: movieId, title, genre, content_rating
movies_out = movies_ml[["movieId", "title", "genre", "content_rating"]]
movies_out.to_csv(os.path.join(DATA_DIR, "movies.csv"), index=False)
print(f"Saved {len(movies_out)} movies to data/movies.csv")

# Ratings: keep userId, movieId, rating (drop timestamp for our pivot)
ratings_out = ratings_ml[["userId", "movieId", "rating"]]
ratings_out.to_csv(os.path.join(DATA_DIR, "ratings.csv"), index=False)
print(f"Saved {len(ratings_out)} ratings to data/ratings.csv")

# Users with synthetic age
user_ids = ratings_ml["userId"].unique()
ages = np.random.choice([8, 12, 16, 25, 35, 45, 55], size=len(user_ids), p=[0.05, 0.1, 0.15, 0.35, 0.2, 0.1, 0.05])
users_df = pd.DataFrame({"userId": user_ids, "age": ages})
users_df.to_csv(os.path.join(DATA_DIR, "users.csv"), index=False)
print(f"Saved {len(users_df)} users to data/users.csv")
print("MovieLens setup done.")
