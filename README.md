# Codevision

A comprehensive web application for team collaboration, project management, and skill development.

## 📋 Overview

CodevisionPiweb is a full-stack web application designed to facilitate team collaboration, project management, task tracking, and skill development. The platform includes features for team communication, task assignment, project tracking, quizzes, and AI-powered assistance.

## 🚀 Features

### 👥 Team Collaboration
- Team creation and management
- Real-time team chat
- Member skill tracking
- Role-based access control (Admin, Team Leader, Member)

### 📊 Project Management
- Project creation and tracking
- Task assignment and management
- Kanban board visualization
- Project analytics and reporting

### 📝 Task Management
- Task creation, assignment, and tracking
- Automatic task assignment based on skills
- Task status updates
- Deadline management

### 📚 Learning & Development
- Quiz creation and management
- Skill assessment
- Course recommendations
- Certificate generation

### 🤖 AI Integration
- AI-powered chatbot assistant
- Face verification
- Integration with OpenAI, Groq, and Hugging Face

### 📈 Analytics & Reporting
- Dashboard with key metrics
- Performance tracking
- Custom reports generation

## 🛠️ Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Material UI & Tailwind CSS
- Chart.js for data visualization
- Socket.IO for real-time communication

### Backend
- Node.js with Express
- MongoDB for database
- Mongoose for ODM
- JWT for authentication
- Socket.IO for real-time communication
- Prometheus for monitoring

### DevOps
- Docker for containerization
- Jenkins for CI/CD
- Nginx for serving frontend
- Prometheus & Grafana for monitoring

## 🏗️ Architecture

The application follows a microservices architecture with:
- Frontend service (React)
- Backend API service (Node.js/Express)
- MongoDB database
- Socket.IO for real-time communication

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Docker & Docker Compose (for containerized deployment)

### Environment Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and configure the environment variables

### Backend Setup
```bash
cd Backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔄 CI/CD Pipeline

The project includes a Jenkins pipeline for continuous integration and deployment:

1. **Checkout**: Retrieves the source code
2. **Install Dependencies**: Installs backend and frontend dependencies
3. **Build Backend**: Prepares the backend for production
4. **Build Frontend**: Creates a production build of the frontend
5. **Build Docker Images**: Creates Docker images for backend and frontend
6. **Push to Registry**: Pushes images to a Docker registry
7. **Deploy Application**: Deploys the application using Docker Compose

## 📁 Project Structure

```
CodevisionPiweb/
├── Backend/                # Node.js backend
│   ├── controllers/        # Request handlers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── server.js           # Main entry point
│   └── ...
├── Frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── dashboard/      # Admin dashboard components
│   │   ├── member/         # Member interface components
│   │   ├── home/           # Landing page components
│   │   └── ...
│   └── ...
├── docker-compose.yml      # Docker Compose configuration
├── jenkinsfile             # Jenkins CI/CD pipeline
└── ...
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- Helmet for HTTP security headers

## 📊 Monitoring

- Prometheus metrics collection
- Grafana dashboards
- Health check endpoints

## 🧪 Testing

```bash
# Run backend tests
cd Backend
npm test

# Run frontend tests
cd Frontend
npm test
```

## 📄 License

This project is proprietary and confidential.

## 👥 Contributors

- Development Team at CodevisionPiweb

---

© 2024 CodevisionPiweb. All rights reserved.
