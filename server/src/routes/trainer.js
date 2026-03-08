const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(requireRole('trainer', 'admin'));

// Helper: parse float safely
const toF = v => v !== undefined && v !== '' && v !== null ? parseFloat(v) : null;
const toI = v => v !== undefined && v !== '' && v !== null ? parseInt(v) : null;

// GET /api/trainer/members — assigned members (full profile)
router.get('/members', async (req, res) => {
    try {
        const trainer = await prisma.trainer.findUnique({ where: { userId: req.user.id } });
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        const members = await prisma.member.findMany({
            where: { trainerId: trainer.id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                measurements: { orderBy: { measuredAt: 'desc' }, take: 1 },
                workoutPlans: {
                    where: { OR: [{ status: 'active' }, { status: 'pending' }] },
                    include: {
                        exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] },
                        request: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json({ members });
    } catch (err) {
        console.error('Trainer members error:', err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
});

// GET /api/trainer/members/:memberId — single member full detail
router.get('/members/:memberId', async (req, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { id: parseInt(req.params.memberId) },
            include: {
                user: { select: { id: true, name: true, email: true } },
                measurements: { orderBy: { measuredAt: 'desc' } },
                workoutPlans: {
                    where: { OR: [{ status: 'active' }, { status: 'pending' }] },
                    include: {
                        exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] },
                        request: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json({ member });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch member' });
    }
});

// GET /api/trainer/members/:memberId/measurements
router.get('/members/:memberId/measurements', async (req, res) => {
    try {
        const measurements = await prisma.bodyMeasurement.findMany({
            where: { memberId: parseInt(req.params.memberId) },
            orderBy: { measuredAt: 'desc' }
        });
        res.json({ measurements });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch measurements' });
    }
});

// POST /api/trainer/members/:memberId/measurements
router.post('/members/:memberId/measurements', async (req, res) => {
    try {
        const memberId = parseInt(req.params.memberId);
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const {
            measuredAt, notes,
            weight, height,
            neck, shoulder, chest, upperArm, forearm, wrist,
            upperAbdomen, waist, lowerAbdomen, hips, thigh, calf, ankle,
            bodyFat, visceralFat, restingMetabolism, bmi, biologicalAge,
        } = req.body;

        const measurement = await prisma.bodyMeasurement.create({
            data: {
                memberId,
                recordedBy: req.user.id,
                measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
                notes: notes || null,
                weight: toF(weight), height: toF(height),
                neck: toF(neck), shoulder: toF(shoulder), chest: toF(chest),
                upperArm: toF(upperArm), forearm: toF(forearm), wrist: toF(wrist),
                upperAbdomen: toF(upperAbdomen), waist: toF(waist), lowerAbdomen: toF(lowerAbdomen),
                hips: toF(hips), thigh: toF(thigh), calf: toF(calf), ankle: toF(ankle),
                bodyFat: toF(bodyFat), visceralFat: toF(visceralFat),
                restingMetabolism: toF(restingMetabolism), bmi: toF(bmi), biologicalAge: toI(biologicalAge),
            }
        });
        res.status(201).json({ measurement });
    } catch (err) {
        console.error('Measurement error:', err);
        res.status(500).json({ message: 'Failed to save measurement' });
    }
});

// GET /api/trainer/profile
router.get('/profile', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                trainer: {
                    include: {
                        members: { include: { user: { select: { id: true, name: true } } } },
                        reviews: { include: { member: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });
        if (!user) return res.status(404).json({ message: 'Not found' });
        const { password, ...clean } = user;
        res.json(clean);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

// PUT /api/trainer/profile — trainer updates own profile
router.put('/profile', async (req, res) => {
    try {
        const {
            name, mobile, gender, age, address, weight, height,
            specialization, specializations, trainerType,
            salary, gymJoinDate, successRate,
            certificates, fitnessJourney, termsConditions, photo,
        } = req.body;

        if (name) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: { name }
            });
        }

        await prisma.trainer.update({
            where: { userId: req.user.id },
            data: {
                photo: photo ?? undefined,
                mobile: mobile ?? undefined,
                gender: gender ?? undefined,
                age: age ? parseInt(age) : undefined,
                address: address ?? undefined,
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                specialization: specialization ?? undefined,
                specializations: Array.isArray(specializations) ? specializations : undefined,
                trainerType: trainerType ?? undefined,
                gymJoinDate: gymJoinDate ? new Date(gymJoinDate) : undefined,
                successRate: successRate ? parseFloat(successRate) : undefined,
                certificates: Array.isArray(certificates) ? certificates : undefined,
                fitnessJourney: fitnessJourney ?? undefined,
                termsConditions: termsConditions ?? undefined,
            }
        });
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// GET /api/trainer/workouts/:memberId
router.get('/workouts/:memberId', async (req, res) => {
    try {
        const plans = await prisma.workoutPlan.findMany({
            where: { memberId: parseInt(req.params.memberId) },
            include: { exercises: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch workout plans' });
    }
});

// POST /api/trainer/workouts
router.post('/workouts', async (req, res) => {
    try {
        const { memberId, exerciseId, day, sets, reps } = req.body;
        if (!memberId || !exerciseId || !day) return res.status(400).json({ message: 'memberId, exerciseId, and day are required' });
        const plan = await prisma.workoutPlan.create({
            data: {
                memberId: parseInt(memberId),
                name: 'Custom Trainer Plan',
                goal: 'Personal Training',
                difficulty: 'Intermediate',
                status: 'active',
                isAiGenerated: false,
                exercises: {
                    create: {
                        day,
                        name: 'Exercise Placeholder', // Based on body, would need more detail
                        sets: parseInt(sets) || 3,
                        reps: String(reps) || '12',
                        instructions: 'Follow trainer guidance',
                        targetMuscle: 'Various'
                    }
                }
            },
            include: { exercises: true }
        });
        res.status(201).json({ plan });
    } catch (err) {
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

// GET /api/trainer/exercises
router.get('/exercises', async (req, res) => {
    try {
        const exercises = await prisma.exercise.findMany({ orderBy: { muscleGroup: 'asc' } });
        res.json({ exercises });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch exercises' });
    }
});
// ─── Body Measurements (Trainer adds for their members) ──────────────────────

// GET all measurements for an assigned member
router.get('/members/:memberId/measurements', async (req, res) => {
    try {
        const trainerId = req.user.id;
        const member = await prisma.member.findFirst({
            where: { id: parseInt(req.params.memberId), trainer: { userId: trainerId } }
        });
        if (!member) return res.status(403).json({ message: 'This member is not assigned to you' });

        const measurements = await prisma.bodyMeasurement.findMany({
            where: { memberId: member.id },
            orderBy: { measuredAt: 'desc' }
        });
        res.json({ measurements });
    } catch (err) {
        console.error('Get measurements error:', err);
        res.status(500).json({ message: 'Failed to fetch measurements' });
    }
});

// POST add a new measurement for an assigned member
router.post('/members/:memberId/measurements', async (req, res) => {
    try {
        const trainerId = req.user.id;
        const member = await prisma.member.findFirst({
            where: { id: parseInt(req.params.memberId), trainer: { userId: trainerId } }
        });
        if (!member) return res.status(403).json({ message: 'This member is not assigned to you' });

        const {
            measuredAt, notes,
            weight, height,
            neck, shoulder, chest, upperArm, forearm, wrist,
            upperAbdomen, waist, lowerAbdomen, hips, thigh, calf, ankle,
            bodyFat, visceralFat, restingMetabolism, bmi, biologicalAge,
        } = req.body;

        const toF = v => v !== undefined && v !== '' && v !== null ? parseFloat(v) : null;
        const toI = v => v !== undefined && v !== '' && v !== null ? parseInt(v) : null;

        const measurement = await prisma.bodyMeasurement.create({
            data: {
                memberId: member.id,
                recordedBy: trainerId,
                measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
                notes: notes || null,
                weight: toF(weight), height: toF(height),
                neck: toF(neck), shoulder: toF(shoulder), chest: toF(chest),
                upperArm: toF(upperArm), forearm: toF(forearm), wrist: toF(wrist),
                upperAbdomen: toF(upperAbdomen), waist: toF(waist), lowerAbdomen: toF(lowerAbdomen),
                hips: toF(hips), thigh: toF(thigh), calf: toF(calf), ankle: toF(ankle),
                bodyFat: toF(bodyFat), visceralFat: toF(visceralFat),
                restingMetabolism: toF(restingMetabolism), bmi: toF(bmi), biologicalAge: toI(biologicalAge),
            }
        });
        res.status(201).json({ measurement });
    } catch (err) {
        console.error('Add measurement error:', err);
        res.status(500).json({ message: 'Failed to add measurement' });
    }
});

// DELETE a measurement record
router.delete('/members/:memberId/measurements/:id', async (req, res) => {
    try {
        const trainerId = req.user.id;
        const member = await prisma.member.findFirst({
            where: { id: parseInt(req.params.memberId), trainer: { userId: trainerId } }
        });
        if (!member) return res.status(403).json({ message: 'Not authorized' });
        await prisma.bodyMeasurement.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Measurement deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete measurement' });
    }
});

module.exports = router;
