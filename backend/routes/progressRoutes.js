import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user stats (current user)
router.get('/stats', protect, async (req, res) => {
    try {
        let stats = await prisma.userStats.findUnique({
            where: { userId: req.user.id },
        });

        // If no stats exist, create default ones
        if (!stats) {
            stats = await prisma.userStats.create({
                data: { userId: req.user.id },
            });
        }

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user training sessions (current user)
router.get('/sessions', protect, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const sessions = await prisma.trainingSession.findMany({
            where: { userId: req.user.id },
            orderBy: { completedAt: 'desc' },
            take: parseInt(limit),
        });

        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get weekly activity (for chart)
router.get('/weekly-activity', protect, async (req, res) => {
    try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const sessions = await prisma.trainingSession.findMany({
            where: {
                userId: req.user.id,
                completedAt: { gte: weekAgo },
            },
            orderBy: { completedAt: 'asc' },
        });

        // Group by day of week
        const activityByDay = {
            Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0
        };

        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        sessions.forEach(session => {
            const dayName = dayNames[new Date(session.completedAt).getDay()];
            activityByDay[dayName]++;
        });

        res.json(activityByDay);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get XP progress to next level
router.get('/xp-progress', protect, async (req, res) => {
    try {
        const stats = await prisma.userStats.findUnique({
            where: { userId: req.user.id },
        });

        if (!stats) {
            return res.json({
                level: 1,
                currentXp: 0,
                xpForNextLevel: 1000,
                progress: 0,
            });
        }

        const xpPerLevel = 1000;
        const currentLevelXp = stats.totalXp % xpPerLevel;
        const progress = Math.round((currentLevelXp / xpPerLevel) * 100);

        res.json({
            level: stats.level,
            totalXp: stats.totalXp,
            currentXp: currentLevelXp,
            xpForNextLevel: xpPerLevel,
            progress,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
