import pandas as pd
import random
import os

def assign_duration(genre_str):
    genres = str(genre_str).split('|')
    main_genre = genres[0] if genres else ""
    
    # Biased random durations (in minutes)
    if main_genre in ["Animation", "Children", "Comedy"]:
        return random.randint(15, 100)  # Can be shorts or normal length
    elif main_genre in ["Action", "Adventure", "Sci-Fi", "Fantasy"]:
        return random.randint(90, 150)
    elif main_genre in ["Drama", "Romance", "Crime", "Thriller"]:
        return random.randint(90, 140)
    elif main_genre in ["Documentary"]:
        return random.randint(30, 120)
    else:
        return random.randint(60, 130)

def assign_mood(genre_str):
    genres = str(genre_str).split('|')
    
    # Mapping genres to moods
    if any(g in genres for g in ["Comedy", "Animation", "Family"]):
        return "Happy", "Relax"
    elif any(g in genres for g in ["Drama", "Romance"]):
        return "Romantic", "Sad"
    elif any(g in genres for g in ["Action", "Thriller", "Horror", "Crime"]):
        return "Thrill", "Scary"
    elif any(g in genres for g in ["Documentary", "Mystery"]):
        return "Bored", "Relax"  # Cures boredom or relaxes
    else:
        return "Relax", "Happy"

def main():
    movies_path = os.path.join(os.path.dirname(__file__), "data", "movies.csv")
    if not os.path.exists(movies_path):
        print(f"File not found: {movies_path}")
        return

    print("Loading movies.csv...")
    df = pd.read_csv(movies_path)
    
    # Check if 'duration' column already exists
    if 'duration' not in df.columns:
        print("Assigning durations...")
        df['duration'] = df['genre'].apply(assign_duration) if 'genre' in df.columns else df['genres'].apply(assign_duration)
    else:
        print("'duration' column already exists. Skipping.")

    # Check if 'mood' column already exists
    if 'mood' not in df.columns:
        print("Assigning moods...")
        # Assign primary mood
        mood_series = df['genre'].apply(assign_mood) if 'genre' in df.columns else df['genres'].apply(assign_mood)
        df['mood'] = [m[0] for m in mood_series]
    else:
        print("'mood' column already exists. Skipping.")
        
    print("Saving updated movies.csv...")
    df.to_csv(movies_path, index=False)
    print("Done! Added duration and mood to dataset.")

if __name__ == "__main__":
    main()
