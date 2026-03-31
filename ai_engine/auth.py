from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    email: str | None = None
    age: int = 18
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
def signup(data: SignupData, db: Session = Depends(get_db)):
    # Single database query to check for existing username/email
    existing_user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    
    if existing_user:
        if existing_user.username == data.username:
            raise HTTPException(status_code=400, detail="Username already exists")
        else:
            raise HTTPException(status_code=400, detail="Email already exists")
        
    hashed_password = get_password_hash(data.password)
    new_user = User(
        username=data.username,
        email=data.email,
        password=hashed_password,
        age=data.age,
        preferred_genres=data.preferred_genres
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"status": "success", "token": access_token, "userId": new_user.id}

@auth_router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    # Check if hashed or plain (for legacy seeded users)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if user.password == data.password or verify_password(data.password, user.password):
        # Found user, issue token
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"status": "success", "token": access_token, "userId": user.id}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

def get_current_user_id(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
