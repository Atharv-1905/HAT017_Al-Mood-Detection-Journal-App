import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Replace this with your MongoDB Atlas Connection String
MONGODB_URL = "mongodb+srv://sarvjit:sarvjit@cluster0.2fqesmr.mongodb.net/?appName=Cluster0"

# Connect to MongoDB asynchronously using Motor
client = AsyncIOMotorClient(MONGODB_URL)

# Access the "mindtrace_db" database
db = client.mindtrace_db
