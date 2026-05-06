from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from ai.engine import MindTraceAIEngine
from ai.utils.models import AnalysisRequest, AIResponse
from backend.database import db
import backend.auth as auth
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel

app = FastAPI(title="MindTrace AI Backend", description="Backend for the Reflectly-like Journaling App")

# JWT Config
SECRET_KEY = "mindtrace_super_secret_key_hackathon"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Engine on startup
engine = None

@app.on_event("startup")
async def startup_event():
    global engine
    print("\n" + "="*60)
    print("🚀 INITIALIZING MINDTRACE AI ENGINE...")
    print("⏳ Loading Neural Networks into Memory (Hugging Face Models).")
    print("⚠️  If this is your first time, it is DOWNLOADING the models (~500MB).")
    print("⚠️  This can take 3-5 minutes depending on your internet speed.")
    print("⚠️  Please DO NOT close the terminal. Be patient!")
    print("="*60 + "\n")
    engine = MindTraceAIEngine()
    print("\n" + "="*60)
    print("✅ AI MODELS LOADED AND CACHED SUCCESSFULLY!")
    print("✅ SERVER IS NOW READY TO ACCEPT MOBILE REQUESTS!")
    print("="*60 + "\n")

@app.post("/api/analyze", response_model=AIResponse)
async def analyze_journal(request: AnalysisRequest):
    global engine
    if not engine:
        engine = MindTraceAIEngine()
    result = await engine.analyze(request)
    return result

# ========================================
# DATABASE & AUTHENTICATION ROUTES
# ========================================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/api/auth/register", response_model=auth.Token)
async def register(user: auth.UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    interests_str = ",".join(user.interests)
    
    new_user = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed_pwd,
        "interests": interests_str,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=auth.Token)
async def login(user: auth.UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not auth.verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": str(db_user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/profile", response_model=auth.UserResponse)
async def get_profile(token: str):
    user = await get_current_user(token)
    return {
        "id": str(user["_id"]),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "interests": user.get("interests", ""),
        "created_at": user.get("created_at", datetime.utcnow())
    }

@app.post("/api/entries")
async def create_entry(entry: auth.EntryCreate, token: str):
    user = await get_current_user(token)
    
    entry_dict = {
        "user_id": str(user["_id"]),
        "text": entry.text,
        "emotion": entry.emotion,
        "wellness_index": entry.wellness_index,
        "risk_level": entry.risk_level,
        "date": datetime.utcnow()
    }
    
    result = await db.entries.insert_one(entry_dict)
    return {"message": "success", "id": str(result.inserted_id)}

@app.get("/api/entries")
async def get_entries(token: str):
    user = await get_current_user(token)
    cursor = db.entries.find({"user_id": str(user["_id"])}).sort("date", -1)
    
    entries = []
    async for document in cursor:
        entries.append({
            "id": str(document["_id"]),
            "text": document["text"],
            "date": document["date"].isoformat() + "Z",
            "analysis": {
                "emotion": document["emotion"],
                "wellness_index": document["wellness_index"],
                "risk_level": document["risk_level"]
            }
        })
    return entries

from typing import Optional

class EntryUpdate(BaseModel):
    text: str
    emotion: Optional[str] = None
    wellness_index: Optional[float] = None
    risk_level: Optional[str] = None

@app.put("/api/entries/{entry_id}")
async def update_entry(entry_id: str, update_data: EntryUpdate, token: str):
    user = await get_current_user(token)
    
    update_fields = {"text": update_data.text, "date": datetime.utcnow()}
    if update_data.emotion:
        update_fields["emotion"] = update_data.emotion
    if update_data.wellness_index is not None:
        update_fields["wellness_index"] = update_data.wellness_index
    if update_data.risk_level:
        update_fields["risk_level"] = update_data.risk_level
        
    result = await db.entries.update_one(
        {"_id": ObjectId(entry_id), "user_id": str(user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found or no change made")
    return {"message": "success"}

@app.delete("/api/entries/{entry_id}")
async def delete_entry(entry_id: str, token: str):
    user = await get_current_user(token)
    result = await db.entries.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "success"}

class PasswordUpdate(BaseModel):
    new_password: str

@app.put("/api/auth/password")
async def update_password(update_data: PasswordUpdate, token: str):
    user = await get_current_user(token)
    hashed_pwd = auth.get_password_hash(update_data.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hashed_pwd}}
    )
    return {"message": "Password updated successfully"}

class PasswordReset(BaseModel):
    email: str
    new_password: str

@app.post("/api/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    db_user = await db.users.find_one({"email": reset_data.email})
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")
        
    hashed_pwd = auth.get_password_hash(reset_data.new_password)
    await db.users.update_one(
        {"email": reset_data.email},
        {"$set": {"hashed_password": hashed_pwd}}
    )
    return {"message": "Password reset successfully"}
