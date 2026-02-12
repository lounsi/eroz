import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom de fichier unique : user-{id}-{timestamp}.ext
        const ext = path.extname(file.originalname);
        cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WEBP.'));
    },
});

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload avatar user
 * @access  Private
 */
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier téléchargé' });
        }

        // URL accessible via le serveur statique
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Mettre à jour l'utilisateur dans la BDD
        const upgradedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                avatar: true,
            },
        });

        res.json({
            message: 'Avatar mis à jour avec succès',
            avatar: avatarUrl,
            user: upgradedUser,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
    }
});

export default router;
