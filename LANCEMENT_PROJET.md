# Launch Guide - Eroz

This guide shows how to run the full project (Backend + Frontend).

## Prerequisites
- Node.js (for frontend)
- Python 3.11+ (for backend)
- Postgres (or Docker)

---

## 1) Docker (Recommended)
1. Create a `.env` file at the project root (same folder as `docker-compose.yml`):
   ```bash
   JWT_SECRET=dev_secret
   GROQ_API_KEY=
   ```
2. Run:
   ```bash
   docker compose up --build
   ```

- Frontend: http://localhost
- Backend: http://localhost:3000

---

## 2) Backend (FastAPI)
```bash
cd backend
python -m venv .venv
```

Activate the venv:
- Windows (PowerShell):
  ```bash
  .\.venv\Scripts\Activate.ps1
  ```
- macOS/Linux:
  ```bash
  source .venv/bin/activate
  ```

Install and run:
```bash
pip install -r requirements.txt
# ensure DATABASE_URL is set in your environment or in backend/.env
uvicorn app.main:app --reload --port 3000
```

---

## 3) Frontend (Vite)
```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## Test Accounts (auto-seeded)
- Admin: admin@eroz.com / admin123
- Student: thomas.martin@edu.fr / student123
- Professor: prof@eroz.com / prof123
