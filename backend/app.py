from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta, datetime
from passlib.hash import pbkdf2_sha256
import os
from dotenv import load_dotenv
from bson import ObjectId
from models import User, Task, db

# Load environment variables from .env file (if it exists)
load_dotenv()

# Required environment variables
required_vars = ['MONGO_URI', 'JWT_SECRET_KEY']
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Get environment setting
ENV = os.getenv("FLASK_ENV", "development")

app = Flask(__name__)

# Configure CORS based on environment
if ENV == "development":
    # In development, allow all origins and set debug to True
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    app.debug = True
else:
    # In production, get the frontend URL from environment variable
    frontend_url = os.getenv('FRONTEND_PROD_URL')
    if not frontend_url:
        print("Warning: FRONTEND_PROD_URL not set in production environment")
        # Fallback to allow any origin if FRONTEND_PROD_URL is not set
        frontend_url = "*"
    
    CORS(app, resources={
        r"/api/*": {
            "origins": [frontend_url],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

# JWT Configuration
jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    raise RuntimeError("JWT_SECRET_KEY must be set")
app.config["JWT_SECRET_KEY"] = jwt_secret
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
jwt = JWTManager(app)

# Authentication endpoints
@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["username", "email", "password"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if username or email already exists
        if db.users.find_one({"username": data["username"]}):
            return jsonify({"error": "Username already exists"}), 400
        
        if db.users.find_one({"email": data["email"]}):
            return jsonify({"error": "Email already exists"}), 400
        
        # Create new user
        user = User(
            username=data["username"],
            password_hash=pbkdf2_sha256.hash(data["password"]),
            email=data["email"]
        )
        
        # Insert user into database
        result = db.users.insert_one(user.to_dict())
        
        return jsonify({
            "message": "User registered successfully",
            "user_id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = db.users.find_one({"username": data["username"]})
        
        if not user or not pbkdf2_sha256.verify(data["password"], user["password_hash"]):
            return jsonify({"error": "Invalid username or password"}), 401
        
        access_token = create_access_token(identity=str(user["_id"]))
        return jsonify({
            "token": access_token,
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"]
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Task endpoints
@app.route("/api/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        status = request.args.get('status', 'all')
        sort_by = request.args.get('sort_by', 'created_desc')
        search = request.args.get('search', '').strip()

        # Base query
        query = {"user_id": user_id}

        # Add status filter
        if status == 'completed':
            query["completed"] = True
        elif status == 'incomplete':
            query["completed"] = False

        # Add search filter if provided
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]

        # Determine sort order
        sort_options = {
            'created_asc': [('created_at', 1)],
            'created_desc': [('created_at', -1)],
            'updated_asc': [('updated_at', 1)],
            'updated_desc': [('updated_at', -1)]
        }
        sort_order = sort_options.get(sort_by, [('created_at', -1)])

        # Execute query with sorting
        tasks = list(db.tasks.find(query).sort(sort_order))
        
        # Convert ObjectId to string for JSON serialization
        for task in tasks:
            task["_id"] = str(task["_id"])
        
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks", methods=["POST"])
@jwt_required()
def create_task():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if "title" not in data:
            return jsonify({"error": "Title is required"}), 400
        
        task = Task(
            title=data["title"],
            description=data.get("description", ""),
            user_id=user_id,
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            completed=False
        )
        
        result = db.tasks.insert_one(task.to_dict())
        task_dict = task.to_dict()
        task_dict["_id"] = str(result.inserted_id)
        
        return jsonify(task_dict), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks/<task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        task = db.tasks.find_one({"_id": ObjectId(task_id), "user_id": user_id})
        if not task:
            return jsonify({"error": "Task not found"}), 404
        
        updates = {
            "title": data.get("title", task["title"]),
            "description": data.get("description", task["description"]),
            "completed": data.get("completed", task["completed"]),
            "due_date": datetime.fromisoformat(data["due_date"]) if data.get("due_date") else task.get("due_date"),
            "updated_at": datetime.utcnow()
        }
        
        db.tasks.update_one(
            {"_id": ObjectId(task_id), "user_id": user_id},
            {"$set": updates}
        )
        
        updated_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        updated_task["_id"] = str(updated_task["_id"])
        
        return jsonify(updated_task), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks/<task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    try:
        user_id = get_jwt_identity()
        
        result = db.tasks.delete_one({"_id": ObjectId(task_id), "user_id": user_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Task not found"}), 404
        
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    config_status = {
        "mongo_uri_set": bool(os.getenv("MONGO_URI")),
        "jwt_secret_set": bool(os.getenv("JWT_SECRET_KEY")),
        "environment": ENV,
        "frontend_url": os.getenv("FRONTEND_PROD_URL", "not set (using development CORS)"),
    }
    return jsonify({
        "status": "healthy",
        "configuration": config_status
    }), 200

if __name__ == "__main__":
    if ENV == "development":
        # Development server
        app.run(host="0.0.0.0", port=5000, debug=True)
    else:
        # Production server
        port = int(os.getenv("PORT", 8080))
        app.run(host="0.0.0.0", port=port, debug=False)
