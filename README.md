# 🧠 AI Study Companion

> An intelligent, adaptive study companion platform powered by **Google Gemini 2.0 AI**, **FastAPI**, **React (Vite)**, and **Supabase**. Transform uploaded study materials into interactive RAG-grounded AI Tutor Q&A, adaptive quizzes, concept mastery tracking, recommendations, and platform analytics.

---

## 🏗️ Architecture Overview

```
+-----------------------------------------------------------------------+
|                           FRONTEND (Vite / React 18)                 |
|  - Tailwind CSS + Glassmorphism UI                                    |
|  - Recharts Visualization Suite                                       |
|  - Supabase Auth + Protected Routing                                  |
+-----------------------------------+-----------------------------------+
                                    |
                            REST API (Axios)
                                    v
+-----------------------------------------------------------------------+
|                          BACKEND (FastAPI / Uvicorn)                  |
|  - Routers: Auth, Spaces, Projects, Materials, Tutor, Quiz, Admin     |
|  - Services: KnowledgeService, GeminiClient, MasteryService, etc.    |
+-------------------+-------------------------------+-------------------+
                    |                               |
          pgvector / SQL Queries                 Gemini 2.0 API Calls
                    v                               v
+-----------------------+               +-------------------------------+
|   SUPABASE DATABASE   |               |     GOOGLE GEMINI AI API      |
|  - PostgreSQL + RLS   |               |  - Context Grounded Q&A       |
|  - pgvector Chunks    |               |  - Adaptive Quiz Generation   |
+-----------------------+               +-------------------------------+
```

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite 5, JavaScript | Fast SPA client bundling & hot module replacement |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Recharts | Glassmorphic dark theme with dynamic charts |
| **Backend Core** | Python 3.12, FastAPI, Uvicorn | Asynchronous RESTful API services |
| **AI Engine** | Google Gemini 2.0 Flash API | RAG grounding, adaptive item generation & open-ended grading |
| **Database & Vector Search** | Supabase (PostgreSQL + pgvector) | Database tables with Row Level Security (RLS) & vector embeddings |
| **Deployment** | Vercel (Frontend) & Render / Docker (Backend) | Production hosting configurations |

---

## 📋 Prerequisites

Before running the application locally, ensure you have the following installed:

- **Node.js**: v18.x or later ([download](https://nodejs.org/))
- **Python**: v3.11 or v3.12 ([download](https://python.org/))
- **Git**: ([download](https://git-scm.com/))
- **Supabase Account**: ([signup free](https://supabase.com/))
- **Google Gemini API Key**: ([get free key](https://ai.google.dev/))

---

## 🚀 Quick Start Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/ai-study-companion.git
cd ai-study-companion
```

### Step 2: Supabase Setup & Database Schema
1. Create a new project in your [Supabase Dashboard](https://database.new).
2. Go to **SQL Editor** in Supabase and execute the project SQL schema (including vector extensions, tables: `profiles`, `spaces`, `projects`, `materials`, `content_chunks`, `concepts`, `concept_mastery`, `quizzes`, `quiz_questions`, `activity_events`, `ai_usage_logs`).
3. Obtain your Project URL, Anon API Key, and Service Role Key from **Project Settings -> API**.

### Step 3: Configure Environment Variables
Copy `.env.example` to root `.env` or create appropriate `.env` files in both `backend/` and `frontend/`:

**`backend/.env`**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
GEMINI_API_KEY=AIzaSyYourGeminiApiKey
JWT_SECRET=super-secret-jwt-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### Step 4: Install & Run Backend
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be accessible at: `http://localhost:8000` (Swagger docs at `/docs`).

---

### Step 5: Install & Run Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will open at: `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run backend unit & integration tests using `pytest`:
```bash
cd backend
.\venv\Scripts\pytest.exe tests/test_quiz.py tests/test_mastery_recommendations.py tests/test_analytics.py tests/test_admin.py tests/test_home.py
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```

---

## 🌐 Deployment Instructions

### Deploying Frontend to Vercel
1. Install Vercel CLI or connect your Git repository to [Vercel](https://vercel.com).
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://ai-study-companion-backend.onrender.com`)
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. The included `frontend/vercel.json` automatically handles SPA routing rewrites and security headers.

### Deploying Backend to Render.com
1. Connect your repository to [Render.com](https://render.com).
2. Select **Web Service** deployment.
3. Select Docker or use the provided `backend/render.yaml` blueprint specification.
4. Set Environment Variables (`SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`, etc.).

---

## 📂 Project Structure Overview

```
ai-study-companion/
├── backend/
│   ├── app/
│   │   ├── ai/               # Gemini API client & prompt engineering
│   │   ├── routers/          # FastAPI routes (Auth, Home, Spaces, Quiz, Admin, etc.)
│   │   ├── services/         # Mastery, Knowledge, Analytics, Admin services
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── config.py         # App configuration & settings
│   │   └── main.py           # FastAPI entrypoint & middleware
│   ├── tests/                # Pytest unit & integration test suites
│   ├── Dockerfile            # Container build configuration
│   └── render.yaml           # Render deployment manifest
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components (ErrorBoundary, Loading, EmptyState)
│   │   ├── pages/            # Dashboard, Spaces, Projects, Tutor, Quiz, Analytics, Admin
│   │   ├── services/         # Axios API clients & Supabase Auth integration
│   │   ├── App.jsx           # React Router navigation tree
│   │   └── index.css         # Tailwind base styles & keyframe animations
│   ├── vercel.json           # Vercel SPA routing rewrite rules
│   └── vite.config.js        # Vite production build & chunk optimization
├── .env.example              # Environment variable template
└── README.md                 # Technical project documentation
```

---

## 📌 Features & API Summary

- **Home Dashboard (`/api/home/dashboard`)**: Streak counter, continue learning shortcuts, progress overview gauge, weak concept warnings, and daily activity sparkline.
- **AI Tutor (`/api/tutor`)**: Conversational RAG Q&A with material citations and streaming support.
- **Adaptive Quiz Engine (`/api/quiz`)**: Item generation tailored to student mastery level, instant explanation feedback, and open-ended grading.
- **Mastery & Growth (`/api/mastery`)**: Concept mastery calculations, struggle point detection, and personalized study recommendations.
- **Analytics & Admin (`/api/admin`)**: 8-tab administration dashboard covering platform statistics, AI telemetry, system health, and student engagement histograms.

---

## 🔮 Known Limitations & Future Improvements

- **PDF Parsing**: PyMuPDF currently extracts raw text; future versions will add OCR for image-only scanned lecture notes.
- **Offline Mode**: Local caching of study decks for offline review via Service Workers.
- **Multi-Modal AI**: Support for audio lecture transcript ingestion and image diagram analysis in AI Tutor Q&A.

---

## 📄 License
MIT License. Built for educational AI applications.
