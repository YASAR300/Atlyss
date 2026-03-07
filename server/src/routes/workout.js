const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { generateWeeklyPlan } = require('../lib/workoutGenerator');

router.use(verifyToken);

// POST /api/workouts/generate — generate a plan for a member
router.post('/generate', requireRole('admin', 'trainer'), async (req, res) => {
    try {
        const { memberId, experienceLevel } = req.body;

        if (!memberId) return res.status(400).json({ message: 'memberId is required' });

        const member = await prisma.member.findUnique({
            where: { id: parseInt(memberId) },
            include: { user: true }
        });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const exercises = await prisma.exercise.findMany();
        if (exercises.length === 0) {
            return res.status(400).json({ message: 'No exercises in database. Please seed first.' });
        }

        const level = experienceLevel || 'intermediate';
        const plan = generateWeeklyPlan(member.fitnessGoal, level, exercises);

        // Delete existing plan for this member
        await prisma.workoutPlan.deleteMany({ where: { memberId: member.id } });

        // Save new plan
        const planEntries = [];
        for (const [day, exercises] of Object.entries(plan)) {
            for (const ex of exercises) {
                planEntries.push({
                    memberId: member.id,
                    exerciseId: ex.exerciseId,
                    day,
                    sets: ex.sets,
                    reps: ex.reps,
                });
            }
        }

        if (planEntries.length > 0) {
            await prisma.workoutPlan.createMany({ data: planEntries });
        }

        res.json({
            message: `Workout plan generated for ${member.user.name}`,
            plan,
            totalExercises: planEntries.length,
        });
    } catch (err) {
        console.error('Generate workout error:', err);
        res.status(500).json({ message: 'Failed to generate workout plan' });
    }
});

// GET /api/workouts/exercises — all exercises
router.get('/exercises', async (req, res) => {
    try {
        const { muscleGroup, difficulty } = req.query;
        const exercises = await prisma.exercise.findMany({
            where: {
                ...(muscleGroup ? { muscleGroup: { contains: muscleGroup, mode: 'insensitive' } } : {}),
                ...(difficulty ? { difficulty } : {}),
            },
            orderBy: { muscleGroup: 'asc' }
        });
        res.json({ exercises });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch exercises' });
    }
});

module.exports = router;
