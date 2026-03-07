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
                measurements: { orderBy: { measuredAt: 'desc' }, take: 1 }
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
                measurements: { orderBy: { measuredAt: 'desc' } }
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
            include: { trainer: true }
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
            mobile, gender, address, weight, height,
            specialization, specializations, trainerType,
            salary, gymJoinDate, successRate,
            certificates, fitnessJourney, termsConditions, photo,
        } = req.body;

        await prisma.trainer.update({
            where: { userId: req.user.id },
            data: {
                photo: photo ?? undefined,
                mobile: mobile ?? undefined,
                gender: gender ?? undefined,
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
            include: { exercise: true },
            orderBy: { day: 'asc' }
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
            data: { memberId: parseInt(memberId), exerciseId: parseInt(exerciseId), day, sets: parseInt(sets) || 3, reps: parseInt(reps) || 12 },
            include: { exercise: true }
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

module.exports = router;
