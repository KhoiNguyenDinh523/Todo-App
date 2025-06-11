#!/bin/bash

# Check if environment variables are set
if [ -z "$MONGO_URI" ] || [ -z "$JWT_SECRET_KEY" ]; then
    echo "Error: Required environment variables are not set!"
    echo "Please set MONGO_URI and JWT_SECRET_KEY before running this script"
    exit 1
fi

# Deploy Backend
cd backend
echo "Deploying backend with environment variables..."
gcloud run deploy todo-backend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=${MONGO_URI},JWT_SECRET_KEY=${JWT_SECRET_KEY}"

# Get backend URL
BACKEND_URL=$(gcloud run services describe todo-backend --platform managed --region asia-southeast2 --format 'value(status.url)')

# Deploy Frontend
cd ../frontend/todolist
echo "Deploying frontend..."
gcloud run deploy todo-frontend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "REACT_APP_API_URL=${BACKEND_URL}/api"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe todo-frontend --platform managed --region asia-southeast2 --format 'value(status.url)')

echo "✅ Deployment completed!"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL" 