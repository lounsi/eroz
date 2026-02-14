# eroz
Eroz is an interactive medical-imaging training platform. The frontend is React/Vite and the backend is now FastAPI (Python) with Postgres.

## Quick Start (Docker)
```bash
# create .env at project root
JWT_SECRET=dev_secret
GROQ_API_KEY=

# run
docker compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:3000

## Local Development
Backend:
```bash
cd backend
python -m venv .venv
# activate venv (Windows)
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# set DATABASE_URL in backend/.env or env vars
uvicorn app.main:app --reload --port 3000
```

Frontend:
```bash
npm install
npm run dev
```

## Test Accounts (auto-seeded)
- Admin: admin@eroz.com / admin123
- Student: thomas.martin@edu.fr / student123
- Professor: prof@eroz.com / prof123
