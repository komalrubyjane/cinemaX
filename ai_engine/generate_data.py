import pandas as pd
import numpy as np
import os

os.makedirs("data", exist_ok=True)

# Small dataset for fast training
NUM_MOVIES = 100
NUM_USERS = 20

genres = ["Action", "Drama", "Comedy", "Sci-Fi", "Thriller", "Romance"]

# Content ratings: G (0), PG (7+), PG-13 (13+), R (17+), NC-17 (18+)
# Distribution: more family-friendly content
content_ratings = ["G", "PG", "PG-13", "R", "NC-17"]
content_weights = [0.15, 0.25, 0.35, 0.20, 0.05]  # Fewer adult films

# Movies with content rating
movies = []
for movie_id in range(1, NUM_MOVIES + 1):
    genre = np.random.choice(genres)
    rating = np.random.choice(content_ratings, p=content_weights)
    movies.append([movie_id, f"Movie {movie_id}", genre, rating])

movies_df = pd.DataFrame(movies, columns=["movieId", "title", "genre", "content_rating"])
movies_df.to_csv("data/movies.csv", index=False)

# Ratings with watch_time (minutes) and repeated_scenes (rewatch count)
ratings = []
for user_id in range(1, NUM_USERS + 1):
    movie_ids = np.random.choice(range(1, NUM_MOVIES + 1), 15, replace=False)
    for movie_id in movie_ids:
        rating = np.random.randint(1, 6)
        watch_time = np.random.randint(30, 180) if rating >= 3 else np.random.randint(5, 60)
        repeated_scenes = np.random.randint(0, 5) if rating >= 4 else np.random.randint(0, 2)
        ratings.append([user_id, movie_id, rating, watch_time, repeated_scenes])

ratings_df = pd.DataFrame(ratings, columns=["userId", "movieId", "rating", "watch_time", "repeated_scenes"])
ratings_df.to_csv("data/ratings.csv", index=False)

# Users with age (for content filtering)
users_data = []
for user_id in range(1, NUM_USERS + 1):
    age = np.random.choice([8, 12, 16, 25, 35, 45, 55], p=[0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05])
    users_data.append([user_id, age])

users_df = pd.DataFrame(users_data, columns=["userId", "age"])
users_df.to_csv("data/users.csv", index=False)

print("Dataset created: movies (content_rating), ratings (watch_time, repeated_scenes), users (age)")
