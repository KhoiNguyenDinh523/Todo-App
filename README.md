# Full-Stack Todo List Application

A modern, responsive Todo List application built with React.js frontend and Flask backend, using MongoDB Atlas for data storage.

## Project Overview
- **Frontend**: React.js with Material-UI
- **Backend**: Flask (Python)
- **Database**: MongoDB Atlas
- **Authentication**: JWT-based
- **Deployment**: Google Cloud Run

## Main Features
- User authentication (signup/login)
- CRUD operations for tasks
- Task filtering and sorting
- Search functionality
- Responsive design
- Secure data storage
- Containerized deployment

## Local Development Setup

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- Docker and Docker Compose
- MongoDB Atlas account

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# Set up .env file with required environment variables
flask run
```

### Frontend Setup
```bash
cd frontend/todolist
npm install
npm start
```

### Environment Variables
Create `.env` files in both frontend and backend directories:

Backend (.env):
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET_KEY=your_jwt_secret
```

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:8080
```

## Cloud Run Deployment

1. Install Google Cloud CLI and initialize:
```bash
gcloud init
gcloud auth configure-docker
```

2. Set up project and enable required services:
```bash
gcloud services enable run.googleapis.com
```

3. Deploy using the provided script:
```bash
./deploy-simple.sh
```

The script will:
- Build and push Docker images
- Deploy both frontend and backend to Cloud Run
- Configure environment variables
- Set up public access

For detailed deployment options and troubleshooting, refer to the deployment script. 