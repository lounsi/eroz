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

## Test Accounts (auto-seeded)
- Admin: admin@eroz.com / admin123
- *to register, localhost/register* , to modify user role, use admin account.
