const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { generateWorkout } = require('../lib/workoutGenerator');

router.use(verifyToken);

// ─── MEMBER ROUTES ────────────────────────────────────────────────────────────

// POST /api/workouts/request — Member submits a new workout plan request
router.post('/request', requireRole('member'), async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({
            where: { userId },
            include: { measurements: { orderBy: { measuredAt: 'desc' }, take: 1 } }
        });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const {
            fitnessGoal, experienceLevel, planDuration, targetFocus,
            daysPerWeek, sessionTime, equipment, intensity,
            recoveryOption, injuries
        } = req.body;

        // Create the request
        const request = await prisma.workoutRequest.create({
            data: {
                memberId: member.id,
                fitnessGoal,
                experienceLevel,
                planDuration: parseInt(planDuration) || 7,
                targetFocus,
                daysPerWeek: parseInt(daysPerWeek) || 3,
                sessionTime: parseInt(sessionTime) || 60,
                equipment: Array.isArray(equipment) ? equipment : [],
                intensity,
                recoveryOption,
                injuries,
                status: 'pending'
            }
        });

        // Trigger AI Generation
        const aiPlan = await generateWorkout(request, member);

        // Save the generated plan
        const plan = await prisma.workoutPlan.create({
            data: {
                memberId: member.id,
                requestId: request.id,
                name: aiPlan.name,
                goal: aiPlan.goal,
                duration: aiPlan.duration,
                difficulty: aiPlan.difficulty,
                status: 'pending',
                isAiGenerated: true,
                exercises: {
                    create: aiPlan.exercises.map(ex => ({
                        day: ex.day,
                        dayTitle: ex.dayTitle,
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps.toString(),
                        restTime: ex.restTime,
                        instructions: ex.instructions,
                        targetMuscle: ex.targetMuscle,
                        order: ex.order
                    }))
                }
            },
            include: { exercises: true }
        });

        res.status(201).json({ message: 'Plan requested and generated! Awaiting trainer review.', planId: plan.id });
    } catch (err) {
        console.error('Workout request error:', err);
        res.status(500).json({ message: 'Failed to create workout request' });
    }
});

// GET /api/workouts/my-plan — Member gets their active plan
router.get('/my-plan', requireRole('member'), async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const plan = await prisma.workoutPlan.findFirst({
            where: { memberId: member.id, status: 'active' },
            include: { exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] } }
        });

        if (!plan) {
            // Check for pending
            const pending = await prisma.workoutPlan.findFirst({
                where: { memberId: member.id, status: 'pending' },
                include: { exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] } }
            });
            return res.json({ plan: pending, isPending: !!pending });
        }

        res.json({ plan });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch plan' });
    }
});

// ─── TRAINER / ADMIN ROUTES ───────────────────────────────────────────────────

// GET /api/workouts/requests — List all plans awaiting review
router.get('/pending', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const plans = await prisma.workoutPlan.findMany({
            where: { status: 'pending' },
            include: {
                member: { include: { user: { select: { name: true } } } },
                request: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending plans' });
    }
});

// GET /api/workouts/active — List all currently active member plans
router.get('/active', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const plans = await prisma.workoutPlan.findMany({
            where: { status: 'active' },
            include: {
                member: { include: { user: { select: { name: true } } } },
                request: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch active plans' });
    }
});

// GET /api/workouts/plan/:id — Get specific plan details
router.get('/plan/:id', requireRole('trainer', 'admin', 'member'), async (req, res) => {
    try {
        const plan = await prisma.workoutPlan.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] },
                member: { include: { user: { select: { name: true } } } },
                request: true
            }
        });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json({ plan });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch plan' });
    }
});

// PUT /api/workouts/plan/:id/exercise/:exId — Edit an exercise
router.put('/plan/:id/exercise/:exId', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const { name, sets, reps, restTime, instructions, targetMuscle, day, dayTitle } = req.body;
        await prisma.workoutExercise.update({
            where: { id: parseInt(req.params.exId) },
            data: {
                name,
                sets: parseInt(sets),
                reps: reps.toString(),
                restTime: parseInt(restTime),
                instructions,
                targetMuscle,
                day: parseInt(day),
                dayTitle
            }
        });

        // Mark plan as trainer edited
        await prisma.workoutPlan.update({
            where: { id: parseInt(req.params.id) },
            data: { isTrainerEdited: true }
        });

        res.json({ message: 'Exercise updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update exercise' });
    }
});

// POST /api/workouts/plan/:id/exercise — Add an exercise
router.post('/plan/:id/exercise', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        const { name, sets, reps, restTime, instructions, targetMuscle, day, dayTitle, order } = req.body;

        await prisma.workoutExercise.create({
            data: {
                planId,
                day: parseInt(day),
                dayTitle,
                name,
                sets: parseInt(sets),
                reps: reps.toString(),
                restTime: parseInt(restTime),
                instructions,
                targetMuscle,
                order: parseInt(order) || 0
            }
        });

        await prisma.workoutPlan.update({
            where: { id: planId },
            data: { isTrainerEdited: true }
        });

        res.status(201).json({ message: 'Exercise added' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add exercise' });
    }
});

// DELETE /api/workouts/plan/:id/exercise/:exId — Remove an exercise
router.delete('/plan/:id/exercise/:exId', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        await prisma.workoutExercise.delete({ where: { id: parseInt(req.params.exId) } });

        await prisma.workoutPlan.update({
            where: { id: parseInt(req.params.id) },
            data: { isTrainerEdited: true }
        });

        res.json({ message: 'Exercise removed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove exercise' });
    }
});

// PUT /api/workouts/plan/:id/finalize — Finalize and activate plan
router.put('/plan/:id/finalize', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // Deactivate old active plans for this member (EXCLUDING this one if we are just updating it)
        await prisma.workoutPlan.updateMany({
            where: {
                memberId: plan.memberId,
                status: 'active',
                NOT: { id: planId }
            },
            data: { status: 'completed' }
        });

        // Activate this plan
        let trainerId = null;
        if (req.user.role === 'trainer') {
            const trainer = await prisma.trainer.findUnique({ where: { userId: req.user.id } });
            if (trainer) trainerId = trainer.id;
        }

        await prisma.workoutPlan.update({
            where: { id: planId },
            data: {
                status: 'active',
                trainerId: trainerId
            }
        });

        // Update request status
        if (plan.requestId) {
            await prisma.workoutRequest.update({
                where: { id: plan.requestId },
                data: { status: 'fulfilled' }
            });
        }

        res.json({ message: 'Plan finalized and activated!' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to finalize plan' });
    }
});

module.exports = router;
