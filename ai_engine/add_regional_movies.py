import pandas as pd
import numpy as np
import os

# New Regional Movies Data (Title, Genre, Content Rating, Poster URL)
# TMDB Posters are accurate as possible based on standard search
REGIONAL_MOVIES = [
    # Tollywood
    {"title": "RRR", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeO1WMeW.jpg"},
    {"title": "Baahubali: The Beginning", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/9BAjt8nSQipsbbQjc8A83zGeq2T.jpg"},
    {"title": "Baahubali 2: The Conclusion", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/zEqyD0SBt6HL7W9JQoWLaRhcEbg.jpg"},
    {"title": "Pushpa: The Rise - Part 1", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/1I2HIAhxR71T2HmqY52Ym42v3gD.jpg"},
    {"title": "Ala Vaikunthapurramuloo", "genre": "Drama", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/tLp5QvTiwD6f6G1E5W8ZJ4I6TDB.jpg"},
    
    # Bollywood
    {"title": "Dangal", "genre": "Drama", "content_rating": "PG", "poster": "https://image.tmdb.org/t/p/w500/zpiL5W990SjZ1Hlq4t4YhW5eS1J.jpg"},
    {"title": "3 Idiots", "genre": "Comedy", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79zH8YW.jpg"},
    {"title": "Pathaan", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/mS0hHkInr5S7iL6cE971uBq0A9k.jpg"},
    {"title": "Jawan", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/jILeVkOBEXGuD2AAYbWwZ3M8w0j.jpg"},
    {"title": "Zindagi Na Milegi Dobara", "genre": "Drama", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/3k8r9Qx7lC4J5gJzZzK4CjG3s3R.jpg"},
    
    # Kollywood
    {"title": "Vikram", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/qXvY0yKq9FfF1F8vRbC1UaR8f2W.jpg"},
    {"title": "Leo", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/pEaIfK7iKkX5m7M4dC6UUKhJ8i.jpg"},
    {"title": "Ponniyin Selvan: Part I", "genre": "Drama", "content_rating": "PG", "poster": "https://image.tmdb.org/t/p/w500/1pC4b2wP2H2tX4u0nF4eCg8XfVj.jpg"},
    {"title": "Kaithi", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/n1aJ2oK8rFhXvQ0oG0qWn0dG2M.jpg"},
    {"title": "Master", "genre": "Action", "content_rating": "PG-13", "poster": "https://image.tmdb.org/t/p/w500/2LhP4hM9s4XQd7L2n0aB1xHw5C.jpg"},
]

def main():
    movies_path = "data/movies.csv"
    ratings_path = "data/ratings.csv"
    
    if not os.path.exists(movies_path):
        print(f"{movies_path} does not exist. Run setup_movielens.py or generate_data.py first.")
        return

    movies_df = pd.read_csv(movies_path)
    ratings_df = pd.read_csv(ratings_path)
    
    # Get max movie ID to start appending
    max_id = movies_df["movieId"].max()
    
    new_movie_rows = []
    
    # To store mapping for app.py
    id_to_poster = {}

    for i, m in enumerate(REGIONAL_MOVIES):
        new_id = max_id + i + 1
        new_movie_rows.append({
            "movieId": new_id,
            "title": m["title"],
            "genre": m["genre"],
            "content_rating": m["content_rating"]
        })
        id_to_poster[new_id] = m["poster"]

    new_movies_df = pd.DataFrame(new_movie_rows)
    
    # Check if these movies are already added (prevent duplicates)
    exist_titles = set(movies_df["title"].values)
    new_movies_df = new_movies_df[~new_movies_df["title"].isin(exist_titles)]
    
    if not new_movies_df.empty:
        movies_df = pd.concat([new_movies_df, movies_df], ignore_index=True) # Put them at the top
        movies_df.to_csv(movies_path, index=False)
        print(f"Added {len(new_movies_df)} regional movies to {movies_path}")
        
        # Inject synthetic ratings so they appear in recommendations
        users = ratings_df["userId"].unique()
        new_ratings = []
        for _, row in new_movies_df.iterrows():
            movie_id = row["movieId"]
            # 5 random users rate this movie highly (4 or 5)
            raters = np.random.choice(users, size=5, replace=False)
            for uid in raters:
                new_ratings.append({
                    "userId": uid,
                    "movieId": movie_id,
                    "rating": np.random.choice([4.0, 4.5, 5.0])
                })
        
        if new_ratings:
            new_ratings_df = pd.DataFrame(new_ratings)
            ratings_df = pd.concat([ratings_df, new_ratings_df], ignore_index=True)
            ratings_df.to_csv(ratings_path, index=False)
            print(f"Added {len(new_ratings)} synthetic ratings for new movies.")
        
        # Generate the Python code mapping to update app.py
        print("\n# Update app.py with this dictionary for poster mapping:")
        print("REGIONAL_POSTERS = {")
        for mid, url in id_to_poster.items():
            print(f"    {mid}: '{url}',")
        print("}")
    else:
        print("Regional movies already exist in the database.")

if __name__ == "__main__":
    main()
