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
            include: {
                member: {
                    include: {
                        trainer: {
                            include: { user: { select: { id: true, name: true } } }
                        }
                    }
                }
            }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Automated Membership Expiry Check
        if (user.member && user.member.membershipDueDate) {
            const dueDate = new Date(user.member.membershipDueDate);
            const now = new Date();
            const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 3 && daysDiff >= 0) {
                // Check if we already sent a reminder today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'EXPIRY',
                        createdAt: { gte: today },
                        message: { contains: 'expiry in 3 days' }
                    }
                });

                if (!existing) {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            title: 'Membership Renewal',
                            message: `Your gym membership will expire in ${daysDiff} days. Please renew to continue your workouts.`,
                            type: 'EXPIRY'
                        }
                    });
                }
            } else if (daysDiff < 0) {
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'EXPIRY',
                        message: { contains: 'has expired' }
                    }
                });
                if (!existing) {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            title: 'Membership Expired',
                            message: 'Your gym membership has expired. Renew now to continue accessing facilities.',
                            type: 'EXPIRY'
                        }
                    });
                }
            }
        }

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
        const {
            name, age, gender, dob, mobile, address, occupation,
            height, weight, fitnessGoal, membershipType, membershipPackage,
            membershipAmount, membershipDueDate, sessionTime,
            guardianName, guardianRelation, guardianMobile
        } = req.body;

        if (name) {
            await prisma.user.update({ where: { id: userId }, data: { name } });
        }

        await prisma.member.update({
            where: { userId },
            data: {
                age: age ? parseInt(age) : undefined,
                gender: gender ?? undefined,
                dob: dob ? new Date(dob) : undefined,
                mobile: mobile ?? undefined,
                address: address ?? undefined,
                occupation: occupation ?? undefined,
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                fitnessGoal: fitnessGoal ?? undefined,
                membershipType: membershipType ?? undefined,
                membershipPackage: membershipPackage ?? undefined,
                membershipAmount: membershipAmount ? parseFloat(membershipAmount) : undefined,
                membershipDueDate: membershipDueDate ? new Date(membershipDueDate) : undefined,
                sessionTime: sessionTime ?? undefined,
                guardianName: guardianName ?? undefined,
                guardianRelation: guardianRelation ?? undefined,
                guardianMobile: guardianMobile ?? undefined,
            }
        });

        res.json({ message: 'Profile updated' });
    } catch (err) {
        console.error('Update profile error:', err);
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
            where: { userId: userId },
            include: {
                class: {
                    include: {
                        trainer: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { checkInTime: 'desc' },
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
        const userId = req.user.id;
        const member = await prisma.member.findUnique({ where: { userId } });

        const classes = await prisma.class.findMany({
            include: {
                trainer: {
                    include: { user: { select: { name: true } } }
                },
                _count: { select: { attendance: true } },
                attendance: {
                    where: { userId: userId || 0 },
                    select: { id: true }
                }
            },
            orderBy: { scheduleTime: 'asc' }
        });

        // Add 'isBooked' flag for each class relative to this member
        const processedClasses = classes.map(cls => ({
            ...cls,
            isBooked: (cls.attendance && cls.attendance.length > 0)
        }));

        res.json({ classes: processedClasses });
    } catch (err) {
        console.error('Fetch member classes error:', err);
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
            where: { userId: userId, classId }
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
            data: {
                userId: userId,
                classId,
                status: 'PRESENT',
                method: 'MANUAL_ADMIN' // Using a placeholder that exists in enum
            }
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

// POST /api/member/review/:trainerId — submit or update a review for a trainer
router.post('/review/:trainerId', async (req, res) => {
    try {
        const userId = req.user.id;
        const trainerId = parseInt(req.params.trainerId);
        const { rating, comment } = req.body;

        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Check if review already exists
        const existing = await prisma.trainerReview.findFirst({
            where: { memberId: member.id, trainerId }
        });

        let review;
        if (existing) {
            review = await prisma.trainerReview.update({
                where: { id: existing.id },
                data: {
                    rating: parseInt(rating) || 5,
                    comment
                }
            });
        } else {
            review = await prisma.trainerReview.create({
                data: {
                    memberId: member.id,
                    trainerId,
                    rating: parseInt(rating) || 5,
                    comment
                }
            });
        }

        res.status(existing ? 200 : 201).json({
            review,
            message: existing ? 'Review updated! Thank you.' : 'Review submitted! Thank you.'
        });
    } catch (err) {
        console.error('Submit review error:', err);
        res.status(500).json({ message: 'Failed to submit review' });
    }
});

// ─── GET My Body Measurements ─────────────────────────────────────────────────
router.get('/measurements', async (req, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { userId: req.user.id } });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        const measurements = await prisma.bodyMeasurement.findMany({
            where: { memberId: member.id },
            orderBy: { measuredAt: 'desc' }
        });
        res.json({ measurements });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch measurements' });
    }
});

module.exports = router;
