const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(requireRole('member', 'admin', 'trainer'));

// GET /api/member/workouts — this member's workout plan
router.get('/workouts', async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member profile not found' });

        const plans = await prisma.workoutPlan.findMany({
            where: { memberId: member.id },
            include: { exercises: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ plans });
    } catch (err) {
        console.error('Member workouts error:', err);
        res.status(500).json({ message: 'Failed to fetch workouts' });
    }
});

// GET /api/member/profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { member: true }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { password, ...u } = user;
        res.json({ user: u });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

// PUT /api/member/profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, age, height, weight, fitnessGoal, membershipType } = req.body;

        await prisma.user.update({ where: { id: userId }, data: { name } });
        await prisma.member.update({
            where: { userId },
            data: { age: parseInt(age), height: parseFloat(height), weight: parseFloat(weight), fitnessGoal, membershipType }
        });

        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// GET /api/member/attendance — attendance history
router.get('/attendance', async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const attendance = await prisma.attendance.findMany({
            where: { memberId: member.id },
            include: {
                class: {
                    include: {
                        trainer: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { checkinTime: 'desc' },
            take: 30
        });

        res.json({ attendance });
    } catch (err) {
        console.error('Member attendance error:', err);
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
});

// GET /api/member/classes — all available classes
router.get('/classes', async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                trainer: {
                    include: { user: { select: { name: true } } }
                },
                _count: { select: { attendance: true } }
            },
            orderBy: { scheduleTime: 'asc' }
        });
        res.json({ classes });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

// POST /api/member/classes/:id/book — book a class
router.post('/classes/:id/book', async (req, res) => {
    try {
        const userId = req.user.id;
        const classId = parseInt(req.params.id);

        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Check if already booked
        const existing = await prisma.attendance.findFirst({
            where: { memberId: member.id, classId }
        });
        if (existing) return res.status(400).json({ message: 'Already booked this class' });

        // Check capacity
        const cls = await prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { attendance: true } } }
        });
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        if (cls._count.attendance >= cls.capacity) {
            return res.status(400).json({ message: 'Class is full' });
        }

        const attendance = await prisma.attendance.create({
            data: { memberId: member.id, classId }
        });

        // Update lastAttendance on member
        await prisma.member.update({
            where: { id: member.id },
            data: { lastAttendance: new Date() }
        });

        res.status(201).json({ attendance, message: 'Class booked successfully!' });
    } catch (err) {
        console.error('Book class error:', err);
        res.status(500).json({ message: 'Failed to book class' });
    }
});

// GET /api/member/trainers — list trainers for members
router.get('/trainers', async (req, res) => {
    try {
        const trainers = await prisma.user.findMany({
            where: { role: 'trainer', trainer: { isActive: true } },
            include: {
                trainer: {
                    include: {
                        reviews: { include: { member: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });
        res.json({ trainers });
    } catch (err) {
        console.error('Fetch trainers error:', err);
        res.status(500).json({ message: 'Failed to fetch trainers' });
    }
});

// POST /api/member/review/:trainerId — submit a review for a trainer
router.post('/review/:trainerId', async (req, res) => {
    try {
        const userId = req.user.id;
        const trainerId = parseInt(req.params.trainerId);
        const { rating, comment } = req.body;

        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Verify this is the member's trainer or they are allowed to review
        // For now, let's allow any member to review any trainer they see
        const review = await prisma.trainerReview.create({
            data: {
                memberId: member.id,
                trainerId,
                rating: parseInt(rating) || 5,
                comment
            }
        });

        res.status(201).json({ review, message: 'Review submitted! Thank you.' });
    } catch (err) {
        console.error('Submit review error:', err);
        res.status(500).json({ message: 'Failed to submit review' });
    }
});

module.exports = router;
