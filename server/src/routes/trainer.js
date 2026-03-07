const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(requireRole('trainer', 'admin'));

// GET /api/trainer/members — members in this trainer's classes
router.get('/members', async (req, res) => {
    try {
        const trainerId = req.user.id;

        // Find the trainer profile
        const trainerProfile = await prisma.trainer.findUnique({ where: { userId: trainerId } });
        if (!trainerProfile) return res.status(404).json({ message: 'Trainer profile not found' });

        // Get classes by this trainer
        const classes = await prisma.class.findMany({
            where: { trainerId: trainerProfile.id },
            include: {
                attendance: {
                    include: {
                        member: {
                            include: { user: { select: { id: true, name: true, email: true } } }
                        }
                    }
                }
            }
        });

        // Collect unique members
        const memberMap = new Map();
        classes.forEach(cls => {
            cls.attendance.forEach(att => {
                if (!memberMap.has(att.member.id)) {
                    memberMap.set(att.member.id, att.member);
                }
            });
        });

        // If no members via classes, return all members (for demo purposes)
        let members = Array.from(memberMap.values());
        if (members.length === 0) {
            const allMembers = await prisma.member.findMany({
                include: { user: { select: { id: true, name: true, email: true } } }
            });
            members = allMembers;
        }

        res.json({ members });
    } catch (err) {
        console.error('Trainer members error:', err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
});

// GET /api/trainer/workouts/:memberId
router.get('/workouts/:memberId', async (req, res) => {
    try {
        const memberId = parseInt(req.params.memberId);
        const plans = await prisma.workoutPlan.findMany({
            where: { memberId },
            include: { exercise: true },
            orderBy: { day: 'asc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch workout plans' });
    }
});

// POST /api/trainer/workouts — create workout plan entries
router.post('/workouts', async (req, res) => {
    try {
        const { memberId, exerciseId, day, sets, reps } = req.body;

        if (!memberId || !exerciseId || !day) {
            return res.status(400).json({ message: 'memberId, exerciseId, and day are required' });
        }

        const plan = await prisma.workoutPlan.create({
            data: {
                memberId: parseInt(memberId),
                exerciseId: parseInt(exerciseId),
                day,
                sets: parseInt(sets) || 3,
                reps: parseInt(reps) || 12,
            },
            include: { exercise: true }
        });

        res.status(201).json({ plan });
    } catch (err) {
        console.error('Create workout error:', err);
        res.status(500).json({ message: 'Failed to create workout plan' });
    }
});

// DELETE /api/trainer/workouts/:id
router.delete('/workouts/:id', async (req, res) => {
    try {
        await prisma.workoutPlan.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Workout plan deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete workout plan' });
    }
});

// GET /api/trainer/exercises — list all exercises for plan creation
router.get('/exercises', async (req, res) => {
    try {
        const exercises = await prisma.exercise.findMany({ orderBy: { muscleGroup: 'asc' } });
        res.json({ exercises });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch exercises' });
    }
});

module.exports = router;
