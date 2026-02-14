from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import TrainingSession, User, UserStats
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.groq_api_key:
        return ChatResponse(
            message="Le chatbot n'est pas configure. Ajoute GROQ_API_KEY dans le fichier .env et redemarre les conteneurs."
        )

    user = db.get(User, current_user.id)
    stats = db.query(UserStats).filter(UserStats.userId == current_user.id).first()
    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.userId == current_user.id)
        .order_by(TrainingSession.completedAt.desc())
        .limit(5)
        .all()
    )

    try:
        message = generate_chat_response(
            messages=payload.messages,
            user=user,
            stats=stats,
            sessions=sessions,
        )
        return ChatResponse(message=message)
    except Exception as exc:
        logger.exception("Chatbot error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Desole, je rencontre un probleme de connexion avec mon cerveau (Groq). Reessaie plus tard !",
        ) from exc
