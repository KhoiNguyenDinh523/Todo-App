#!/bin/bash

# Deploy Backend
cd backend
gcloud run deploy todo-backend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \

# Get backend URL
BACKEND_URL=$(gcloud run services describe todo-backend --platform managed --region asia-southeast2 --format 'value(status.url)')

# Deploy Frontend
cd ../frontend/todolist
gcloud run deploy todo-frontend \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe todo-frontend --platform managed --region asia-southeast2 --format 'value(status.url)')

echo "Deployment completed!"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL" 