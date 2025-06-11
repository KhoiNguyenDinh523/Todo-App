#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-southeast2"

# Deploy Backend
cd backend
echo "Deploying backend..."
gcloud run deploy todo-backend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-secrets="MONGO_URI=MONGO_URI:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

# Get backend URL
BACKEND_URL=$(gcloud run services describe todo-backend --platform managed --region $REGION --format 'value(status.url)')

# Deploy Frontend
cd ../frontend/todolist
echo "Deploying frontend..."
gcloud run deploy todo-frontend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "REACT_APP_API_URL=${BACKEND_URL}/api"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe todo-frontend --platform managed --region $REGION --format 'value(status.url)')

echo "Deployment completed!"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL" 