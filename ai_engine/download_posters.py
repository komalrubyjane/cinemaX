"""
Download real movie posters into static/posters/ for use in the app.
Uses Google Image search to find the poster and saves it locally.
Run once to populate.
"""
import os
import urllib.request
import urllib.parse
import html
import re
import pandas as pd
import time

BASE = os.path.dirname(os.path.abspath(__file__))
POSTERS_DIR = os.path.join(BASE, "static", "posters")
MOVIES_CSV = os.path.join(BASE, "data", "movies.csv")

os.makedirs(POSTERS_DIR, exist_ok=True)

opener = urllib.request.build_opener()
opener.addheaders = [("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")]
urllib.request.install_opener(opener)

def get_google_poster_url(title):
    try:
        query = f"{title} movie poster"
        url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html_content = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
        m = re.search(r'src="(https://encrypted-tbn0\.gstatic\.com/images\?q=[^"]+)"', html_content)
        if m:
            return html.unescape(m.group(1))
    except Exception as e:
        print(f"Error finding URL for {title}: {e}")
    return None

def main():
    if not os.path.exists(MOVIES_CSV):
        print(f"Error: {MOVIES_CSV} not found.")
        return

    df = pd.read_csv(MOVIES_CSV)
    
    # Get top 50 movies to seed the local posters folder
    top_movies = df.head(50)
    
    print(f"Starting download of {len(top_movies)} posters...")
    
    count = 0
    for index, row in top_movies.iterrows():
        movie_id = row['movieId']
        title = row['title']
        path = os.path.join(POSTERS_DIR, f"{movie_id}.jpg")
        
        if os.path.exists(path):
            print(f"Skip {movie_id} ({title}) - already exists")
            continue
            
        print(f"Fetching {movie_id} ({title})...")
        poster_url = get_google_poster_url(title)
        
        if poster_url:
            try:
                urllib.request.urlretrieve(poster_url, path)
                print(f"Saved {movie_id}.jpg")
                count += 1
                time.sleep(1) # Be nice to Google
            except Exception as e:
                print(f"Error downloading {title}: {e}")
        else:
            print(f"Could not find poster for {title}")

    print(f"Finished. Downloaded {count} new posters to static/posters/")

if __name__ == "__main__":
    main()
