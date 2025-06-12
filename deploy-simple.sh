#!/bin/bash

# Load environment variables from backend/.env for local use
if [ -f backend/.env ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo "❌ Error: backend/.env file not found! It's needed for MONGO_URI and JWT_SECRET_KEY"
    exit 1
fi

echo "🚀 Starting deployment..."

# Deploy Backend
echo "📦 Deploying backend service..."
cd backend
gcloud run deploy todo-backend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=${MONGO_URI},JWT_SECRET_KEY=${JWT_SECRET_KEY},FLASK_ENV=production"

# Get backend URL
BACKEND_URL=$(gcloud run services describe todo-backend --platform managed --region asia-southeast2 --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy Frontend
echo "📦 Deploying frontend service..."
cd ../frontend/todolist
gcloud run deploy todo-frontend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "REACT_APP_API_URL=${BACKEND_URL}/api"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe todo-frontend --platform managed --region asia-southeast2 --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_URL"

# Update backend CORS with frontend URL
echo "🔄 Updating backend CORS configuration..."
gcloud run services update todo-backend \
  --region asia-southeast2 \
  --set-env-vars "FRONTEND_PROD_URL=${FRONTEND_URL}"

echo "
✅ Deployment completed successfully!
🔹 Backend URL: $BACKEND_URL
🔹 Frontend URL: $FRONTEND_URL

