# 📊 Guide d'intégration : Système de Progression

Ce document explique comment utiliser les tables de la base de données pour intégrer le système de progression avec la section "S'entraîner".

---

## 🗄️ Tables Disponibles

### 1. TrainingSession
Enregistre chaque session d'entraînement terminée.

```prisma
model TrainingSession {
  id             Int      @id
  userId         Int      // Référence à l'utilisateur
  difficulty     String   // "EASY", "MEDIUM", "HARD"
  precision      Float    // Précision en % (0-100)
  duration       Int      // Durée totale en SECONDES
  totalImages    Int      // Nombre d'images dans la série
  correctAnswers Int      // Nombre de bonnes réponses
  baseScore      Int      // Score avant multiplicateur
  multiplier     Float    // 1.0 (EASY), 1.5 (MEDIUM), 2.0 (HARD)
  xpEarned       Int      // XP gagnés = baseScore × multiplier
  completedAt    DateTime // Date et heure de fin
}
```

**Comment l'utiliser à la fin d'un entraînement :**
```javascript
// Calculs
const precision = (correctAnswers / totalImages) * 100;
const baseScore = Math.floor(precision * 10); // 0-1000 points
const multipliers = { EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 };
const multiplier = multipliers[difficulty];
const xpEarned = Math.round(baseScore * multiplier);

// Enregistrement
await prisma.trainingSession.create({
    data: {
        userId: user.id,
        difficulty: "MEDIUM",  // "EASY" | "MEDIUM" | "HARD"
        precision,
        duration: tempsEnSecondes,
        totalImages,
        correctAnswers,
        baseScore,
        multiplier,
        xpEarned,
        completedAt: new Date(),
    },
});
```

---

### 2. UserStats
Statistiques agrégées. **À mettre à jour après chaque session.**

```prisma
model UserStats {
  userId        Int      @unique
  totalXp       Int      // XP total accumulé
  level         Int      // Niveau (1 niveau = 1000 XP)
  totalSessions Int      // Nombre de séries jouées
  averageScore  Float    // Précision moyenne
  averageTime   Int      // Temps moyen (secondes)
  currentStreak Int      // Jours consécutifs
  lastActivityAt DateTime
}
```

**Mise à jour après un entraînement :**
```javascript
const stats = await prisma.userStats.findUnique({ where: { userId } });

const newTotalXp = stats.totalXp + xpEarned;
const newLevel = Math.floor(newTotalXp / 1000) + 1;
const newTotal = stats.totalSessions + 1;
const newAvgScore = ((stats.averageScore * stats.totalSessions) + precision) / newTotal;

await prisma.userStats.update({
    where: { userId },
    data: {
        totalXp: newTotalXp,
        level: newLevel,
        totalSessions: newTotal,
        averageScore: newAvgScore,
        averageTime: Math.round(((stats.averageTime * stats.totalSessions) + duration) / newTotal),
        currentStreak: calculateStreak(stats.lastActivityAt),
        lastActivityAt: new Date(),
    },
});
```

---

## 🎮 Niveaux de Difficulté

| Difficulté | Valeur | Multiplicateur XP |
|-----------|--------|-------------------|
| Facile | `"EASY"` | ×1.0 |
| Moyen | `"MEDIUM"` | ×1.5 |
| Difficile | `"HARD"` | ×2.0 |

---

## 🔌 Endpoints API

| Endpoint | Description |
|----------|-------------|
| `GET /api/progress/stats` | Stats utilisateur |
| `GET /api/progress/sessions?limit=10` | Historique |
| `GET /api/progress/weekly-activity` | Activité semaine |
| `GET /api/progress/xp-progress` | Progression XP/niveau |

---

## 📈 Système de Niveaux

- **1 niveau = 1000 XP**
- XP gagné par série = `baseScore × multiplicateur`
- baseScore = `précision × 10` (max 1000)

| Niveau | Titre |
|--------|-------|
| 1-4 | Débutant |
| 5-9 | Intermédiaire |
| 10-19 | Avancé |
| 20+ | Expert |
