import express from 'express';
import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Groq Client lazily
let groq;

router.post('/', protect, async (req, res) => {
    try {
        if (!groq) {
            console.log("Initializing Groq...");
            groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            console.log("Groq initialized successfully!");
        }

        const { messages } = req.body;
        const userId = req.user.id;

        // 1. Fetch User Context
        const [userStats, recentSessions] = await Promise.all([
            prisma.userStats.findUnique({ where: { userId } }),
            prisma.trainingSession.findMany({
                where: { userId },
                orderBy: { completedAt: 'desc' },
                take: 5,
            }),
        ]);

        // 2. Build Expert Context System Prompt
        const userName = `${req.user.firstName} ${req.user.lastName}`;
        const userLevel = userStats?.level || 1;
        const avgScore = userStats?.averageScore || 0;

        // Analyze recent performance for feedback
        let performanceContext = "L'utilisateur débute.";
        if (recentSessions.length > 0) {
            const lastSession = recentSessions[0];
            const recentAvg = recentSessions.reduce((acc, s) => acc + s.precision, 0) / recentSessions.length;
            performanceContext = `Dernière session : ${lastSession.difficulty} (${Math.round(lastSession.precision)}%). Moyenne des 5 dernières : ${Math.round(recentAvg)}%.`;
            if (recentAvg < 50) performanceContext += " L'utilisateur semble en difficulté, encourage-le à revoir les bases ou passer en mode Facile.";
            else if (recentAvg > 80) performanceContext += " L'utilisateur excelle, suggère-lui de passer à un niveau supérieur.";
        }

        const systemPrompt = `
Tu es l'Assistant Éroz, un expert en imagerie médicale pédagogique (Scanner, IRM, Radio) et le tuteur personnel de ${userName} sur la plateforme Éroz.

Ton rôle :
1. Répondre aux questions médicales sur l'imagerie (anatomie, pathologies, signes radiologiques).
2. Conseiller l'étudiant sur sa progression en fonction de ses statistiques.
3. Guider l'étudiant sur la plateforme Éroz.

Contexte de l'étudiant :
- Niveau : ${userLevel}
- Score moyen global : ${Math.round(avgScore)}%
- Performance récente : ${performanceContext}

Fonctionnalités de la plateforme à connaître :
- "S'entraîner" : Quiz interactifs sur des cas cliniques (Radio, Scanner, IRM).
- "Veille Médicale" : Articles et actualités sur l'imagerie.
- "Progression" : Statistiques détaillées et historique.
- "Contact" : Disponible dans le menu latéral pour contacter le support technique ou pédagogique.

Ton ton doit être :
- Professionnel mais bienveillant et encourageant (esprit tuteur).
- Concis et structuré (pas de pavés inutiles).
- Tu tutoies l'utilisateur pour créer du lien.

Si l'utilisateur a des difficultés, propose-lui des conseils méthodologiques ou de s'entraîner sur des cas spécifiques.
Si la question sort du cadre médical ou de la plateforme, décline poliment en rappelant ton rôle d'assistant médical.
        `.trim();

        // 3. Call Groq API (Llama 3)
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-10) // Keep context window reasonable
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const aiMessage = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

        res.json({ message: aiMessage });

    } catch (error) {
        console.error('Chatbot Error (Groq):', error);
        res.status(500).json({
            message: "Désolé, je rencontre un problème de connexion avec mon cerveau (Groq). Réessaie plus tard !"
        });
    }
});

export default router;
