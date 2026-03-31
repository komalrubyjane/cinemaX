import sys
from fastapi.testclient import TestClient
from app import app
from database import SessionLocal, User

client = TestClient(app)

def test_search_duration():
    print("Testing max_duration filter in search...")
    response = client.get("/api/search?max_duration=30")
    assert response.status_code == 200
    data = response.json()
    for m in data:
        assert m["duration"] <= 30
    print(f"Success! Found {len(data)} movies under 30 mins.")

def test_recommend_mood():
    print("Testing mood filter in recommendations...")
    response = client.get("/recommend/1?mood=sad")
    assert response.status_code == 200
    data = response.json()
    for m in data:
        genres = m["genre"].lower()
        assert "drama" in genres or "romance" in genres or "tragedy" in genres
    print(f"Success! Recommendations aligned with 'sad' mood.")

def test_group_watch():
    print("Testing Watch-With-Friends API...")
    # Create room
    res = client.post("/api/group/create", json={"user_id": 1})
    assert res.status_code == 200
    room_code = res.json()["room_code"]
    print(f"Created room: {room_code}")
    
    # Join room with another user
    # First ensure User 2 exists
    db = SessionLocal()
    u2 = db.query(User).filter(User.id == 2).first()
    if not u2:
        db.add(User(id=2, username="testuser2", password="123", age=25))
        db.commit()
    db.close()
    
    res = client.post("/api/group/join", json={"user_id": 2, "room_code": room_code})
    assert res.status_code == 200
    print("User 2 joined room.")
    
    # Chat
    client.post("/api/group/chat", json={"user_id": 1, "room_code": room_code, "message": "hello"})
    client.post("/api/group/chat", json={"user_id": 2, "room_code": room_code, "message": "hey"})
    
    res = client.get(f"/api/group/{room_code}/chat")
    chats = res.json()
    assert len(chats) == 2
    assert chats[0]["message"] == "hello"
    print("Chat system works.")
    
    # Get group recs
    res = client.get(f"/api/group/{room_code}/recommend")
    recs = res.json()
    assert len(recs) > 0
    print(f"Group recommendations returned {len(recs)} shared movies.")

if __name__ == "__main__":
    try:
        test_search_duration()
        test_recommend_mood()
        test_group_watch()
        print("All tests passed.")
    except AssertionError as e:
        print("TEST FAILED:", e)
        sys.exit(1)
        
