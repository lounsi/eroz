from __future__ import annotations

from typing import Iterable

from groq import Groq

from app.core.config import settings
from app.models import TrainingSession, User, UserStats


def generate_chat_response(
    *,
    messages: list[dict] | list,
    user: User | None,
    stats: UserStats | None,
    sessions: Iterable[TrainingSession],
) -> str:
    client = Groq(api_key=settings.groq_api_key)

    user_name = f"{user.firstName} {user.lastName}" if user else "Etudiant"
    user_level = stats.level if stats else 1
    avg_score = stats.averageScore if stats else 0

    sessions_list = list(sessions)
    performance_context = "L'utilisateur debute."
    if sessions_list:
        last_session = sessions_list[0]
        recent_avg = sum(s.precision for s in sessions_list) / len(sessions_list)
        performance_context = (
            f"Derniere session : {last_session.difficulty} ({round(last_session.precision)}%). "
            f"Moyenne des 5 dernieres : {round(recent_avg)}%."
        )
        if recent_avg < 50:
            performance_context += " L'utilisateur semble en difficulte, encourage-le a revoir les bases ou passer en mode Facile."
        elif recent_avg > 80:
            performance_context += " L'utilisateur excelle, suggere-lui de passer a un niveau superieur."

    system_prompt = f"""
Tu es l'Assistant Eroz, un expert en imagerie medicale pedagogique (Scanner, IRM, Radio) et le tuteur personnel de {user_name} sur la plateforme Eroz.

Ton role :
1. Repondre aux questions medicales sur l'imagerie (anatomie, pathologies, signes radiologiques).
2. Conseiller l'etudiant sur sa progression en fonction de ses statistiques.
3. Guider l'etudiant sur la plateforme Eroz.

Contexte de l'etudiant :
- Niveau : {user_level}
- Score moyen global : {round(avg_score)}%
- Performance recente : {performance_context}

Fonctionnalites de la plateforme a connaitre :
- "S'entrainer" : Quiz interactifs sur des cas cliniques (Radio, Scanner, IRM).
- "Veille Medicale" : Articles et actualites sur l'imagerie.
- "Progression" : Statistiques detaillees et historique.
- "Contact" : Disponible dans le menu lateral pour contacter le support technique ou pedagogique.

Ton ton doit etre :
- Professionnel mais bienveillant et encourageant (esprit tuteur).
- Concis et structure (pas de paves inutiles).
- Tu tutoies l'utilisateur pour creer du lien.

Si l'utilisateur a des difficultes, propose-lui des conseils methodologiques ou de s'entrainer sur des cas specifiques.
Si la question sort du cadre medical ou de la plateforme, decline poliment en rappelant ton role d'assistant medical.
    """.strip()

    trimmed_messages = []
    for msg in messages[-10:]:
        trimmed_messages.append({"role": msg.role if hasattr(msg, "role") else msg["role"], "content": msg.content if hasattr(msg, "content") else msg["content"]})

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            *trimmed_messages,
        ],
        temperature=0.7,
        max_tokens=500,
    )

    content = completion.choices[0].message.content if completion.choices else None
    return content or "Desole, je n'ai pas pu generer de reponse."
