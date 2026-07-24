# AI-Powered Employee Management System

An intelligent, full-stack Human Resource Management System (HRMS) built with Django backend, React (Vite) frontend, and Docker orchestration.

## 🚀 Features

- **Employee Management**: Manage employee records, profiles, roles, and status.
- **Attendance & Leave Tracking**: Streamlined leave requests and daily attendance monitoring.
- **AI-Powered HR Insights**: Smart analytics and automation features for HR decision making.
- **Modern Responsive UI**: Clean dashboard built with React, Lucide Icons, and styled components.
- **Dockerized Setup**: Containerized backend and frontend with Docker Compose.

## 🛠 Tech Stack

- **Backend**: Python 3.11+, Django, Django REST Framework
- **Frontend**: React 18, Vite, Axios, Lucide React
- **Containerization**: Docker, Docker Compose

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📜 License

MIT License
