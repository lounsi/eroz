# Progression System - Backend Guide

This document describes the data model and API used for the progression system.

---

## Tables (Postgres)

### 1) training_sessions
Each completed training session.

Fields:
- userId (FK)
- difficulty: "EASY" | "MEDIUM" | "HARD"
- precision (0-100)
- duration (seconds)
- totalImages
- correctAnswers
- baseScore
- multiplier
- xpEarned
- completedAt

### 2) user_stats
Aggregated stats per user.

Fields:
- totalXp
- level (1 level = 1000 XP)
- totalSessions
- averageScore
- averageTime
- currentStreak
- lastActivityAt

---

## API Endpoints
- `GET /api/progress/stats`
- `GET /api/progress/sessions?limit=10`
- `GET /api/progress/weekly-activity`
- `GET /api/progress/xp-progress`

---

## XP Rules
- baseScore = precision * 10 (0-1000)
- multiplier: EASY=1.0, MEDIUM=1.5, HARD=2.0
- xpEarned = baseScore * multiplier
- level = floor(totalXp / 1000) + 1

---

## Where to Edit
- Models: `backend/app/models/`
- Routes: `backend/app/api/routes/progress.py`
