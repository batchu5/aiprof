# 🎓 AI Study Companion

An intelligent personal study assistant built with React, Vite, Tailwind CSS, FastAPI, Supabase, and Google Gemini Flash API.

## 🏗 Project Architecture

```
ai-study-companion/
├── frontend/          # React 18 + Vite + React Router v6 + Tailwind CSS v3
└── backend/           # FastAPI (Python 3.12) + Supabase + Gemini AI
```

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS v3, Lucide React, Axios, Supabase Client
- **Backend**: FastAPI (Python 3.12), Uvicorn, Pydantic v2, Supabase Python SDK, PyMuPDF, Google Generative AI (Gemini Flash)
- **Database**: Supabase (PostgreSQL + pgvector + Auth + Storage)

## 🛠 Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run at `http://localhost:5173` and communicate with the backend at `http://localhost:8000`.

## 📜 API Documentation

Once the backend is running, access the interactive API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
