import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Niveaux de difficulté avec multiplicateurs
const DIFFICULTIES = {
    EASY: { name: 'EASY', multiplier: 1.0 },
    MEDIUM: { name: 'MEDIUM', multiplier: 1.5 },
    HARD: { name: 'HARD', multiplier: 2.0 },
};

// Calcul du niveau basé sur l'XP total
function calculateLevel(totalXp) {
    return Math.floor(totalXp / 1000) + 1;
}

/**
 * Crée des sessions d'entraînement réalistes avec des dates garanties dans la semaine
 */
async function createSessionsAndStats(userId, sessionCount, streakDays, userName) {
    const sessions = [];
    const now = new Date();
    let totalXp = 0;

    for (let i = 0; i < sessionCount; i++) {
        // Garantir que 70% des sessions sont dans les 7 derniers jours
        // avec au moins 1 session par jour de la semaine
        let daysAgo;

        if (i < 7) {
            // Les 7 premières sessions : une par jour de la semaine
            daysAgo = i;
        } else if (i < sessionCount * 0.7) {
            // Sessions supplémentaires dans la semaine
            daysAgo = Math.floor(Math.random() * 7);
        } else {
            // Le reste dans les 2 semaines précédentes
            daysAgo = Math.floor(Math.random() * 14) + 7;
        }

        // Heure réaliste (8h-20h)
        const hours = Math.floor(Math.random() * 12) + 8;
        const minutes = Math.floor(Math.random() * 60);

        const completedAt = new Date(now);
        completedAt.setDate(completedAt.getDate() - daysAgo);
        completedAt.setHours(hours, minutes, 0, 0);

        // Choix de la difficulté (pondéré)
        const diffRoll = Math.random();
        let difficulty;
        if (diffRoll < 0.35) difficulty = DIFFICULTIES.EASY;
        else if (diffRoll < 0.75) difficulty = DIFFICULTIES.MEDIUM;
        else difficulty = DIFFICULTIES.HARD;

        // Données réalistes
        const totalImages = Math.floor(Math.random() * 10) + 10; // 10-20 images
        const correctAnswers = Math.floor(totalImages * (0.6 + Math.random() * 0.35)); // 60-95%
        const precision = Math.round((correctAnswers / totalImages) * 100 * 10) / 10;
        const duration = Math.floor(Math.random() * 300) + 120; // 2-7 minutes

        // Calcul du score et XP
        const baseScore = Math.floor(precision * 10);
        const xpEarned = Math.round(baseScore * difficulty.multiplier);
        totalXp += xpEarned;

        const session = await prisma.trainingSession.create({
            data: {
                userId,
                difficulty: difficulty.name,
                precision,
                duration,
                totalImages,
                correctAnswers,
                baseScore,
                multiplier: difficulty.multiplier,
                xpEarned,
                completedAt,
            },
        });
        sessions.push(session);
    }
    console.log(`✅ Created ${sessions.length} sessions for ${userName} (${totalXp} XP)`);

    // Statistiques
    const totalSessions = sessions.length;
    const averageScore = Math.round(sessions.reduce((acc, s) => acc + s.precision, 0) / totalSessions);
    const averageTime = Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / totalSessions);
    const level = calculateLevel(totalXp);

    await prisma.userStats.upsert({
        where: { userId },
        update: { totalXp, level, totalSessions, averageScore, averageTime, currentStreak: streakDays, lastActivityAt: now },
        create: { userId, totalXp, level, totalSessions, averageScore, averageTime, currentStreak: streakDays, lastActivityAt: now },
    });
    console.log(`✅ Stats: Level ${level}, ${totalXp} XP, ${averageScore}% avg`);
}

async function main() {
    console.log('🌱 Seeding database...');

    // Admin - 30 sessions
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@eroz.com' },
        update: {},
        create: { email: 'admin@eroz.com', password: adminPassword, firstName: 'Admin', lastName: 'Éroz', role: 'ADMIN' },
    });
    console.log('✅ Admin:', admin.email);
    await createSessionsAndStats(admin.id, 30, 15, admin.firstName);

    // Student - 12 sessions
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
        where: { email: 'thomas.martin@edu.fr' },
        update: {},
        create: { email: 'thomas.martin@edu.fr', password: studentPassword, firstName: 'Thomas', lastName: 'Martin', role: 'STUDENT' },
    });
    console.log('✅ Student:', student.email);
    await createSessionsAndStats(student.id, 12, 5, student.firstName);

    // Professor - 20 sessions
    const profPassword = await bcrypt.hash('prof123', 10);
    const prof = await prisma.user.upsert({
        where: { email: 'prof@eroz.com' },
        update: {},
        create: { email: 'prof@eroz.com', password: profPassword, firstName: 'Marie', lastName: 'Dupont', role: 'PROF' },
    });
    console.log('✅ Professor:', prof.email);
    await createSessionsAndStats(prof.id, 20, 10, prof.firstName);

    console.log('🎉 Done!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
