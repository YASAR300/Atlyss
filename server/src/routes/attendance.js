const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/attendance/check-in (Open for Kiosk, but should be secured in production)
router.post('/check-in', async (req, res) => {
    try {
        const { userId, method, classId, status = 'PRESENT' } = req.body;

        if (!userId || !method) {
            return res.status(400).json({ message: 'userId and method are required' });
        }

        // Verify User exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { member: true, trainer: true }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if already checked in today for general entry (no classId) or specific class
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingRecord = await prisma.attendance.findFirst({
            where: {
                userId: parseInt(userId),
                classId: classId ? parseInt(classId) : null,
                checkInTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (existingRecord) {
            return res.status(400).json({ message: 'Attendance already recorded for today' });
        }

        // Create Attendance record
        const attendance = await prisma.attendance.create({
            data: {
                userId: parseInt(userId),
                method: method,
                status: status,
                classId: classId ? parseInt(classId) : null,
                checkInTime: new Date()
            },
            include: {
                user: {
                    select: { name: true, role: true }
                },
                class: true
            }
        });

        // Update Member lastAttendance if it's a member
        if (user.member) {
            await prisma.member.update({
                where: { id: user.member.id },
                data: { lastAttendance: new Date() }
            });
        }

        // Emit Socket.io event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance_update', {
                id: attendance.id,
                user: { name: user.name, role: user.role },
                method: attendance.method,
                status: attendance.status,
                checkInTime: attendance.checkInTime,
                class: { className: attendance.class?.className || 'General Entry' }
            });
        }

        res.status(201).json({
            message: 'Attendance recorded successfully',
            attendance
        });

    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ message: 'Failed to record attendance', error: err.message });
    }
});

// GET /api/attendance/history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { date, startDate, endDate, userId, role, method, classId } = req.query;

        const where = {};
        if (userId) where.userId = parseInt(userId);
        if (method) where.method = method;
        if (classId) where.classId = parseInt(classId);

        if (startDate && endDate) {
            where.checkInTime = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            where.checkInTime = { gte: start, lte: end };
        }

        if (role) {
            where.user = { role: role };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: { name: true, role: true, email: true }
                },
                class: {
                    select: { className: true }
                }
            },
            orderBy: { checkInTime: 'desc' },
            take: 100
        });

        res.json({ records });

    } catch (err) {
        console.error('Attendance history error:', err);
        res.status(500).json({ message: 'Failed to fetch attendance history' });
    }
});

// GET /api/attendance/live (Today's check-ins)
router.get('/live', verifyToken, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findMany({
            where: {
                checkInTime: { gte: startOfDay }
            },
            include: {
                user: {
                    select: { name: true, role: true }
                },
                class: {
                    select: { className: true }
                }
            },
            orderBy: { checkInTime: 'desc' },
            take: 20
        });

        res.json({ attendance });
    } catch (err) {
        console.error('Live attendance error:', err);
        res.status(500).json({ message: 'Failed to fetch live attendance' });
    }
});

module.exports = router;
