const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/authMiddleware');

// Get current user's notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { id: parseInt(req.params.id), userId: req.user.id },
            data: { status: 'READ' }
        });
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, status: 'UNREAD' },
            data: { status: 'READ' }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Admin Broadcast
router.post('/broadcast', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { title, message, type } = req.body;
    try {
        const members = await prisma.user.findMany({
            where: { role: 'member' },
            select: { id: true }
        });

        const notifications = members.map(m => ({
            userId: m.id,
            title,
            message,
            type: type || 'OFFER',
            status: 'UNREAD'
        }));

        await prisma.notification.createMany({ data: notifications });
        res.json({ message: `Broadcast sent to ${members.length} members` });
    } catch (err) {
        res.status(500).json({ message: 'Broadcast failed', error: err.message });
    }
});

module.exports = router;
