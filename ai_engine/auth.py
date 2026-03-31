from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db
from datetime import datetime, timedelta
import jwt
import os
import bcrypt

SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory database fallback for demo accounts and offline mode
DEMO_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password": "1234", # Demo password (plaintext fallback)
        "age": 18
    }
}
_MOCK_ID_COUNTER = 2

class LoginData(BaseModel):
    username: str
    password: str

class SignupData(BaseModel):
    username: str
    password: str
    age: int = 18

def verify_password(plain_password, hashed_password):
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    except Exception:
        # Fallback for plaintext demo passwords
        return plain_password == hashed_password.decode('utf-8') if isinstance(hashed_password, bytes) else plain_password == hashed_password

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@auth_router.post("/signup")
def signup(data: SignupData, db = Depends(get_db)):
    global _MOCK_ID_COUNTER
    
    # Try actual DB first
    try:
        res = db.table("users").select("*").eq("username", data.username).execute()
        existing_users = res.data
    except Exception:
        existing_users = None
        
    if existing_users or data.username in DEMO_USERS:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    hashed_password = get_password_hash(data.password)
    
    new_user_data = {
        "username": data.username,
        "password": hashed_password,
        "age": data.age,
    }
    
    # Try actual DB
    try:
        insert_res = db.table("users").insert(new_user_data).execute()
        new_user = insert_res.data[0]
    except Exception:
        # Fallback to local memory DB
        new_user = new_user_data.copy()
        new_user["id"] = _MOCK_ID_COUNTER
        DEMO_USERS[data.username] = new_user
        _MOCK_ID_COUNTER += 1
    
    access_token = create_access_token(data={"sub": str(new_user["id"])})
    return {"status": "success", "token": access_token, "userId": new_user["id"]}

@auth_router.post("/login")
def login(data: LoginData, db = Depends(get_db)):
    # Try actual DB
    try:
        res = db.table("users").select("*").eq("username", data.username).execute()
        users = res.data
    except Exception:
        users = None
        
    user = users[0] if users else DEMO_USERS.get(data.username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if user.get("password") == data.password or verify_password(data.password, user.get("password", "")):
        access_token = create_access_token(data={"sub": str(user["id"])})
        return {"status": "success", "token": access_token, "userId": user["id"]}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

def get_current_user_id(token: str, db = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
