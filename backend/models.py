from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.todo_db

# Define collection schemas
user_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["username", "email", "password_hash", "created_at"],
            "properties": {
                "username": {
                    "bsonType": "string",
                    "description": "must be a string and is required"
                },
                "email": {
                    "bsonType": "string",
                    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    "description": "must be a valid email address and is required"
                },
                "password_hash": {
                    "bsonType": "string",
                    "description": "must be a string and is required"
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "must be a date and is required"
                }
            }
        }
    }
}

task_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["title", "user_id", "created_at", "updated_at", "completed"],
            "properties": {
                "title": {
                    "bsonType": "string",
                    "description": "must be a string and is required"
                },
                "description": {
                    "bsonType": "string",
                    "description": "must be a string"
                },
                "user_id": {
                    "bsonType": "string",
                    "description": "must be a string (user ID) and is required"
                },
                "completed": {
                    "bsonType": "bool",
                    "description": "must be a boolean and is required"
                },
                "due_date": {
                    "bsonType": ["date", "null"],
                    "description": "must be a date if provided"
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "must be a date and is required"
                },
                "updated_at": {
                    "bsonType": "date",
                    "description": "must be a date and is required"
                }
            }
        }
    }
}

# Create or update collections with schema validation
try:
    db.create_collection("users")
except Exception:
    pass

try:
    db.create_collection("tasks")
except Exception:
    pass

# Update collection schemas
db.command("collMod", "users", **user_schema)
db.command("collMod", "tasks", **task_schema)

# Create indexes
db.users.create_index("username", unique=True)
db.users.create_index("email", unique=True)
db.tasks.create_index([("user_id", 1), ("created_at", -1)])

class User:
    def __init__(self, username, password_hash, email):
        self.username = username
        self.password_hash = password_hash
        self.email = email
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "username": self.username,
            "password_hash": self.password_hash,
            "email": self.email,
            "created_at": self.created_at
        }

class Task:
    def __init__(self, title, description, user_id, due_date=None, completed=False):
        self.title = title
        self.description = description or ""
        self.user_id = user_id
        self.due_date = due_date
        self.completed = completed
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "user_id": self.user_id,
            "due_date": self.due_date,
            "completed": self.completed,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        } 