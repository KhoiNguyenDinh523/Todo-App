#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-southeast2"
MONGO_URI="mongodb+srv://nguyen523:nguyen523@knguyencluster.n4jxwgr.mongodb.net/todo_db?retryWrites=true&w=majority"
JWT_SECRET="6fK9qP2mY5vR8sB3tW7zXcN1jL4hG0pQdAeIiUuOoVlMnJbZyHxSgTkFwE"

echo "Setting up secrets in Secret Manager..."

# Create secrets if they don't exist
echo "Creating MONGO_URI secret..."
echo -n "$MONGO_URI" | gcloud secrets create MONGO_URI --data-file=- --replication-policy="automatic" || \
echo -n "$MONGO_URI" | gcloud secrets versions add MONGO_URI --data-file=-

echo "Creating JWT_SECRET_KEY secret..."
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET_KEY --data-file=- --replication-policy="automatic" || \
echo -n "$JWT_SECRET" | gcloud secrets versions add JWT_SECRET_KEY --data-file=-

# Get the service account email
SERVICE_ACCOUNT=$(gcloud iam service-accounts list --filter="displayName:Cloud Run Service Agent" --format="value(email)")
if [ -z "$SERVICE_ACCOUNT" ]; then
    echo "Error: Could not find Cloud Run Service Agent service account"
    exit 1
fi

# Grant access to secrets
echo "Granting secret access to $SERVICE_ACCOUNT..."
for SECRET_NAME in MONGO_URI JWT_SECRET_KEY; do
    gcloud secrets add-iam-policy-binding $SECRET_NAME \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/secretmanager.secretAccessor"
done

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