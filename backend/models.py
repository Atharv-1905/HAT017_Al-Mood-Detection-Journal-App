from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    interests = Column(String) # Stored as comma-separated string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    entries = relationship("JournalEntry", back_populates="owner")

class JournalEntry(Base):
    __tablename__ = "entries"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    emotion = Column(String)
    wellness_index = Column(Float)
    risk_level = Column(String)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="entries")
