# 📚 Novella — Modern Book Journaling & Social Reading Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0%20Async-D71F00.svg?style=flat&logo=SQLAlchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E.svg?style=flat&logo=Supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com/)

**Novella** is a full-stack, responsive web application designed for bibliophiles to manage their reading journeys, log thoughts in personal reading journals, track reading progress page-by-page, rate & review titles, and connect with a community of readers.

---

## ✨ Features

- **🔒 Secure Authentication**: Integrated with Supabase Auth (Email/Password, JWT validation with automatic profile synchronization).
- **📚 Smart Book Catalog**: Search and browse global books. Includes an automated cover generator fallback and integration with OpenLibrary/Google Books APIs.
- **🏷️ Personal Bookshelf Management**: Categorize books into customized reading statuses: `Want to Read`, `Reading`, and `Completed`.
- **📊 Granular Progress Tracking**: Track chapter and page reading progress visually with real-time percentage completion metrics.
- **✍️ Private Journaling**: Record detailed private reading logs, chapter reflections, and personal thoughts attached to specific books.
- **⭐ Reviews & Ratings**: Submit 1-to-5 star ratings and written reviews for books in your library.
- **💬 Community Hub & Feed**: Participate in general book discussions, join reader chat rooms, and share reading milestones.
- **🎨 Glassmorphic Modern UI**: Beautiful, fully responsive UI built with React, Vite, Tailwind CSS v4, and Lucide React icons.

---

## 🛠️ Technology Stack

### **Backend (API)**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM & Database**: [SQLAlchemy 2.0 (AsyncIO)](https://docs.sqlalchemy.org/en/20/) with `asyncpg` (PostgreSQL) & `aiosqlite` (SQLite local dev)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/latest/) & `pydantic-settings`
- **Security & Auth**: PyJWT, cryptography, HTTP Bearer token validation linked to Supabase User UUIDs
- **Cover Image Processing**: `httpx` (Async external API fetcher) and local/cloud static file storage

### **Frontend (Client)**
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with modern glassmorphism design tokens
- **Auth Client**: `@supabase/supabase-js`
- **HTTP Client**: Axios with request interceptors for automatic JWT bearer token injection
- **Icons**: `lucide-react`

### **Database & Infrastructure**
- **Primary Database**: PostgreSQL (via Supabase) / SQLite (Fallback local environment)
- **Authentication Provider**: Supabase Auth

---

## 🏗️ Architecture & Technical Highlights

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│         React Client            │       │        FastAPI REST API         │
│   (Vite + Tailwind CSS v4)      │ ────► │     (Python + SQLAlchemy 2.0)   │
└─────────────────────────────────┘       └─────────────────────────────────┘
                │                                          │
                │ Supabase Auth                            │ Async Database Access
                ▼                                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                               Supabase Cloud                              │
│              (PostgreSQL DB + Auth User Management Engine)                │
└───────────────────────────────────────────────────────────────────────────┘
```

1. **Dual-Dialect GUID Type Decorator**: Custom SQLAlchemy `TypeDecorator` that maps seamlessly to native PostgreSQL `UUID` types in production while falling back to `String(36)` in local SQLite environments without code changes.
2. **Asynchronous I/O Pipeline**: Fully non-blocking FastAPI backend leveraging SQLAlchemy's `AsyncSession` and `httpx` async HTTP client for external API requests (OpenLibrary cover lookup).
3. **JWT Security Interceptor**: React frontend interceptor queries the active Supabase session and attaches the JWT to the `Authorization: Bearer <token>` header on every outgoing API request.
4. **Resilient Seed Engine**: Automatic catalog seeder on application startup (`lifespan` context manager) that populates default books with cover graphics if empty.

---

## 📁 Repository Structure

```
Novella/
├── app/                      # FastAPI Backend Application
│   ├── core/                 # Security, JWT verification, Supabase client
│   ├── routers/              # API Endpoints (books, library, progress, journal, community)
│   ├── config.py             # Pydantic environment configuration
│   ├── database.py           # Async SQLAlchemy engine & session factory
│   ├── models.py             # ORM models (Profile, Book, UserLibrary, Progress, Journal, etc.)
│   └── schemas.py            # Pydantic request/response validation schemas
├── frontend/                 # React Frontend Application
│   ├── src/
│   │   ├── api/              # Axios instance & token interceptors
│   │   ├── components/       # Reusable UI components & Navigation
│   │   ├── context/          # Auth Context provider
│   │   ├── lib/              # Supabase client setup
│   │   └── pages/            # View pages (Library, Book Detail, Journal, Community)
│   ├── package.json
│   └── vite.config.js
├── main.py                   # FastAPI app entry point & static mounts
├── requirements.txt          # Python backend dependencies
└── seed_books.py             # CLI database seeder script
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Python**: 3.10+ installed
- **Node.js**: 18+ and `npm` installed
- **Supabase Account**: Free project created at [supabase.com](https://supabase.com)

### 2. Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Novella.git
   cd Novella
   ```

2. **Create & activate virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up `.env` file** in the project root:
   ```env
   PROJECT_NAME="Novella API"
   VERSION="1.0.0"
   API_V1_STR="/api/v1"

   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

   # Database URL (SQLite for local dev, PostgreSQL for production)
   DATABASE_URL="sqlite+aiosqlite:///./bookjournal.db"
   ```

5. **Run the backend server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API Docs will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup

1. **Navigate to `frontend/`**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up `.env` file** in `frontend/`:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

3. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   Application will be running at: `http://localhost:5173`

---

## 🚢 Deployment Guide

For full production deployment instructions on **Render** (Backend API), **Vercel** (React Frontend), and **Supabase** (Database & Auth), see the deployment steps outlined in the documentation.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
