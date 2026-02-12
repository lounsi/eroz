import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only) - with optional search
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { search } = req.query;

        let where = {};
        if (search) {
            where = {
                OR: [
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                    { email: { contains: search } },
                ],
            };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user role (Admin only)
router.put('/:id/role', protect, adminOnly, async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    if (!['STUDENT', 'PROF', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
        });
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Update failed' });
    }
});

// Delete user (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Delete failed' });
    }
});

export default router;
