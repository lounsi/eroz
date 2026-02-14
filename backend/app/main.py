from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.services.seed import seed_if_needed
import app.models  # noqa: F401

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    for _ in range(30):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            break
        except Exception:
            time.sleep(2)
    else:
        raise RuntimeError("Database not ready")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_needed(db)
    finally:
        db.close()


@app.get("/", response_class=PlainTextResponse)
def root():
    return "API Eroz is running"


base_dir = Path(__file__).resolve().parents[1]
upload_dir = Path(settings.upload_dir)
if not upload_dir.is_absolute():
    upload_dir = base_dir / upload_dir
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

app.include_router(api_router, prefix="/api")
