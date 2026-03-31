from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db, User
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os

SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

import bcrypt

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginData(BaseModel):
    username: str
    password: str

class SignupData(BaseModel):
    username: str
    password: str
    age: int = 18
    preferred_genres: str = ""
    preferred_genres: str = ""

def verify_password(plain_password, hashed_password):
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    except Exception:
        return False

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
    # Check if username exists
    res = db.table("users").select("*").eq("username", data.username).execute()
    existing_users = res.data

    if existing_users:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    hashed_password = get_password_hash(data.password)
    
    # Insert new user
    new_user_data = {
        "username": data.username,
        "password": hashed_password,
        "age": data.age,
    }
    
    insert_res = db.table("users").insert(new_user_data).execute()
    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    new_user = insert_res.data[0]
    
    access_token = create_access_token(data={"sub": str(new_user["id"])})
    return {"status": "success", "token": access_token, "userId": new_user["id"]}

@auth_router.post("/login")
def login(data: LoginData, db = Depends(get_db)):
    res = db.table("users").select("*").eq("username", data.username).execute()
    users = res.data

    if not users:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    user = users[0]
    
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
