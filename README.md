# YOLO + ArcFace Face Recognition Attendance System

A face recognition attendance system that uses **YOLO** for face detection and **ArcFace** for face recognition.

The project consists of a Python backend and a React frontend, with Supabase used for data storage and other backend services.

## Features

* Face detection using YOLO
* Face recognition using ArcFace
* Attendance management
* Python backend API
* React frontend
* Supabase integration
* CPU and GPU backend versions

## Project Structure

```text
yolo_arcface_face_recognition_attendance_system/
│
│
├── backend-gpu/
│   └── Python backend
│
├── frontend/
│   └── React frontend
│
├── .gitignore
└── README.md
```

## Technologies

### Backend

* Python
* YOLO
* ArcFace
* FastAPI
* Supabase

### Frontend

* React
* JavaScript
* Vite

### Database / Services

* Supabase

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SitSoum/Face-Recognition-attendance-system-from-Computer-Graphic-Class-ITE-Year3.git
cd yolo_arcface_face_recognition_attendance_system
```

### 2. Backend Setup

```bash
cd backend-gpu
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the appropriate backend directory.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

Do not commit `.env` files to GitHub.

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file if required:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

## Running the Project

Start the Python backend first with terminal.

```bash
cd backend-gpu
uvicorn main:app --reload
```

Then open up another terminal start the React frontend:

```bash
cd frontend
npm run dev
```

Open the URL shown by Vite in your browser.

## Environment Variables

For security, sensitive information should be stored in `.env` files.

Example `.env.example` files can be provided so other developers know which environment variables are required without exposing actual credentials.

## Git Workflow

After making changes:

```bash
git status
git add .
git commit -m "Describe your changes"
git push
```

Do not commit:

```text
.env
node_modules/
__pycache__/
venv/
dist/
```
