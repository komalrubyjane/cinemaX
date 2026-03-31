from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os
import shutil

# Determine the source DB path (bundled with the code)
_DB_DIR = os.path.dirname(os.path.abspath(__file__))
_SOURCE_DB = os.path.join(_DB_DIR, "cinema.db")

# On Vercel the project filesystem is read-only; use /tmp which is writable.
# Locally we use the original path directly.
_IS_VERCEL = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV") is not None

if _IS_VERCEL:
    _DB_PATH = "/tmp/cinema.db"
    # Copy the pre-seeded DB to /tmp if not already there
    if not os.path.exists(_DB_PATH) and os.path.exists(_SOURCE_DB):
        try:
            shutil.copy2(_SOURCE_DB, _DB_PATH)
            print(f"[DB] Copied cinema.db → {_DB_PATH}")
        except Exception as e:
            print(f"[DB] Warning: could not copy DB to /tmp: {e}")
            _DB_PATH = _SOURCE_DB  # fallback to read-only path
else:
    _DB_PATH = _SOURCE_DB

DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)  # Hashed in a real app
    age = Column(Integer, default=18)
    preferred_genres = Column(String, default="")
    preferred_moods = Column(String, default="")
    language_preference_vector = Column(Text, default="{}") # JSON
    embedding_vector = Column(Text, default="[]") # JSON for transformer model

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, unique=True, index=True) # ID from movies.csv
    title = Column(String, index=True)
    genres = Column(String)
    cast = Column(String, default="")
    director = Column(String, default="")
    languages = Column(String, default="English")
    poster_url = Column(String, default="")
    duration = Column(Integer, default=120)
    embedding_vector = Column(Text, default="[]") # JSON for transformer model
    description = Column(Text, default="")
    rating = Column(Float, default=0.0)
    release_year = Column(Integer, default=2020)
    hero = Column(String, default="")
    heroine = Column(String, default="")
    producers = Column(String, default="")

class WatchHistory(Base):
    __tablename__ = "watch_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    movie_id = Column(Integer, index=True)
    progress_percent = Column(Float, default=0.0) # 0 to 100 representing watch_time_percentage
    timestamp = Column(DateTime, default=datetime.utcnow)

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    movie_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class WatchParty(Base):
    __tablename__ = "watch_parties"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, unique=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    participants = Column(Text, default="[]") # JSON list of user ids
    playback_timestamp = Column(Float, default=0.0)
    playback_status = Column(String, default="paused") # playing, paused
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # e.g., "watched", "added_to_watchlist"
    movie_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    genre = Column(String)
    is_liked = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
