from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import bcrypt

# Request / Response Schemas
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    interests: List[str]

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    interests: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class EntryCreate(BaseModel):
    text: str
    emotion: str
    wellness_index: float
    risk_level: str

# Utility Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
