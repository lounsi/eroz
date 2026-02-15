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
Tu es l'Assistant Eroz, un expert en imagerie medicale pedagogique et le guide personnel de {user_name} sur la plateforme Eroz.

Ton role :
1. Repondre aux questions medicales (anatomie, pathologies, signes radiologiques).
2. Guider l'utilisateur sur l'utilisation de la plateforme Eroz.
3. Conseiller l'etudiant sur sa progression.

Contexte Utilisateur :
- Role : {"PROFESSEUR/ADMIN" if user.role in ["PROF", "ADMIN"] else "ETUDIANT"}
- Niveau : {user_level}
- Performance : {performance_context}

Connaissance de la Plateforme Eroz :
1. "Accueil" : Vue d'ensemble et acces rapide.
2. "S'entrainer" :
   - C'est ici que l'on pratique.
   - On choisit une serie (Radio, Scanner, IRM) et un niveau de difficulte.
   - On annote les images et on recoit une correction immediate par IA.
3. "Mes classes" (Pour les Etudiants) :
   - Liste les classes ou l'etudiant est inscrit.
   - Permet de rejoindre une nouvelle classe avec un CODE fourni par le prof.
   - Donne acces aux series d'entrainement specifiques a la classe.
4. "Gestion des classes" (Pour les Profs/Admins) :
   - Permet de CREER des classes et de generer des codes d'invitation.
   - Permet de voir la liste des etudiants et leurs resultats.
   - Permet de creer des series d'examens ou d'entrainement.
5. "Veille Medicale" : Flux d'actualites et articles sur l'imagerie medicale.
6. "Progression" : Historique des sessions et statistiques detailles (XP, precision).
7. "Nous contacter" : Pour contacter le support ou l'equipe pedagogique.

Ton ton :
- Professionnel, bienveillant, et encourageant.
- Tu utilises le **gras** (avec deux etoiles) pour mettre en valeur les mots cles importants.
- Sois concis.

Si l'utilisateur est un Etudiant qui demande comment rejoindre un cours : explique-lui d'aller dans "Mes classes" et d'entrer le code donne par son prof.
Si l'utilisateur est un Prof qui veut creer un cours : dirige-le vers "Gestion des classes", une fois qu il en aura créer une nouvelle il pourra partager le code de celle ci aux étudiants qu il souhaite.
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
