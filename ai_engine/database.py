"""
database.py  –  Supabase backend (replaces SQLite / SQLAlchemy)

All table operations go through the supabase-py v2 client.
Compatibility model wrappers (User, WatchHistory, …) give attribute-style
access to the dicts returned by Supabase so the rest of the code keeps working
with minimal changes.
"""
from supabase import create_client, Client
from datetime import datetime
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://nwufkntgqrvbtgrsbldw.supabase.co")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "sb_publishable_M1E92lrwu9suWYGKbDMegQ_3rMY5_L1",
)

class _NullResult:
    data = []
    def execute(self): return self

class _NullTable:
    def select(self, *a, **kw): return self
    def insert(self, *a, **kw): return self
    def update(self, *a, **kw): return self
    def delete(self, *a, **kw): return self
    def eq(self, *a, **kw): return self
    def execute(self): return _NullResult()

class _StubClient:
    """Returned when Supabase credentials are invalid — app still serves CSV data."""
    def table(self, name): return _NullTable()

_client: Client | None = None
_stub_mode = False

def get_supabase() -> Client:
    global _client, _stub_mode
    if _stub_mode:
        return _StubClient()  # type: ignore
    if _client is None:
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"[DB] Supabase init failed ({e}) — running in stub mode (CSV only)")
            _stub_mode = True
            return _StubClient()  # type: ignore
    return _client


def get_db():
    """FastAPI dependency – yields the Supabase client."""
    yield get_supabase()


# ── Lightweight model wrappers ───────────────────────────────────────────────
# These wrap dicts from Supabase to expose attribute-style access, preserving
# the existing app.py interface without a full ORM rewrite.

class User:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id               = d.get("id")
        self.username         = d.get("username", "")
        self.password         = d.get("password", "")
        self.age              = int(d.get("age") or 18)
        self.email            = d.get("email")
        self.preferred_genres = d.get("preferred_genres", "")
        self.preferred_moods  = d.get("preferred_moods", "")

    def to_dict(self):
        return {
            "username":         self.username,
            "password":         self.password,
            "age":              self.age,
            "email":            self.email,
            "preferred_genres": self.preferred_genres,
            "preferred_moods":  self.preferred_moods,
        }


class WatchHistory:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id               = d.get("id")
        self.user_id          = d.get("user_id")
        self.movie_id         = d.get("movie_id")
        self.progress_percent = float(d.get("progress_percent") or 0.0)
        ts = d.get("timestamp")
        if isinstance(ts, str):
            try:
                self.timestamp = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                self.timestamp = datetime.utcnow()
        else:
            self.timestamp = ts or datetime.utcnow()


class Watchlist:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id        = d.get("id")
        self.user_id   = d.get("user_id")
        self.movie_id  = d.get("movie_id")
        self.timestamp = d.get("timestamp")


class Activity:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id        = d.get("id")
        self.user_id   = d.get("user_id")
        self.action    = d.get("action", "")
        self.movie_id  = d.get("movie_id")
        ts = d.get("timestamp")
        if isinstance(ts, str):
            try:
                self.timestamp = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                self.timestamp = datetime.utcnow()
        else:
            self.timestamp = ts or datetime.utcnow()


class UserPreference:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id        = d.get("id")
        self.user_id   = d.get("user_id")
        self.genre     = d.get("genre", "")
        self.is_liked  = bool(d.get("is_liked", True))
        self.timestamp = d.get("timestamp")


class WatchParty:
    def __init__(self, data: dict | None = None, **kwargs):
        d = {**(data or {}), **kwargs}
        self.id               = d.get("id")
        self.room_id          = d.get("room_id", "")
        self.host_id          = d.get("host_id")
        self.participants     = d.get("participants", "[]")
        self.playback_timestamp = d.get("playback_timestamp", 0.0)
        self.playback_status  = d.get("playback_status", "paused")
        self.is_active        = d.get("is_active", True)


# Legacy shim – no longer used, kept so old imports don't crash
SessionLocal = None
