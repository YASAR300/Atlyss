const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { generateDiet } = require('../lib/dietGenerator');

router.use(verifyToken);

// ─── MEMBER ROUTES ────────────────────────────────────────────────────────────

// POST /api/diet/request — Member submits a new diet plan request
router.post('/request', requireRole('member'), async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({
            where: { userId }
        });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const {
            dietGoal, targetWeight, activityLevel, workoutDuration, sleepDuration,
            dietType, preferredCuisine, mealsPerDay, foodAllergies, foodsLike,
            foodsAvoid, healthConditions, dietaryRestrictions, waterIntake,
            smokingAlcohol, physicalLimitations
        } = req.body;

        // Auto-calculate BMI from profile
        const heightM = member.height / 100;
        const bmi = (member.weight / (heightM * heightM)).toFixed(1);
        let bmiStatus = 'Normal';
        if (bmi < 18.5) bmiStatus = 'Underweight';
        else if (bmi >= 25 && bmi < 30) bmiStatus = 'Overweight';
        else if (bmi >= 30) bmiStatus = 'Obese';

        // Create the request
        const request = await prisma.dietRequest.create({
            data: {
                memberId: member.id,
                bmi: parseFloat(bmi),
                bmiStatus,
                dietGoal,
                targetWeight: targetWeight ? parseFloat(targetWeight) : null,
                activityLevel,
                workoutDuration: parseInt(workoutDuration) || 0,
                sleepDuration: parseInt(sleepDuration) || 8,
                dietType,
                preferredCuisine,
                mealsPerDay: parseInt(mealsPerDay) || 3,
                foodAllergies,
                foodsLike,
                foodsAvoid,
                healthConditions,
                dietaryRestrictions,
                waterIntake,
                smokingAlcohol,
                physicalLimitations,
                status: 'pending'
            }
        });

        // Trigger AI Generation
        const aiPlan = await generateDiet(request, member);

        // Save the generated plan
        const plan = await prisma.dietPlan.create({
            data: {
                memberId: member.id,
                requestId: request.id,
                name: aiPlan.name || 'Personalized Nutrition Strategy',
                goal: aiPlan.goal || dietGoal,
                duration: 7,
                status: 'pending',
                isAiGenerated: true,
                recommendations: aiPlan.recommendations,
                meals: {
                    create: aiPlan.meals.map(m => ({
                        day: m.day,
                        mealType: m.mealType,
                        mealName: m.mealName,
                        description: m.description,
                        calories: m.calories,
                        protein: m.protein,
                        carbs: m.carbs,
                        fats: m.fats
                    }))
                }
            },
            include: { meals: true }
        });

        res.status(201).json({ message: 'Diet plan generated! Awaiting trainer review.', planId: plan.id });
    } catch (err) {
        console.error('Diet request error:', err);
        res.status(500).json({ message: 'Failed to create diet request' });
    }
});

// GET /api/diet/my-plan — Member gets their active plan
router.get('/my-plan', requireRole('member'), async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await prisma.member.findUnique({ where: { userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const plan = await prisma.dietPlan.findFirst({
            where: { memberId: member.id, status: 'active' },
            include: { meals: { orderBy: [{ day: 'asc' }, { id: 'asc' }] } }
        });

        if (!plan) {
            // Check for pending
            const pending = await prisma.dietPlan.findFirst({
                where: { memberId: member.id, status: 'pending' },
                include: { meals: { orderBy: [{ day: 'asc' }, { id: 'asc' }] } }
            });
            return res.json({ plan: pending, isPending: !!pending });
        }

        res.json({ plan });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch diet plan' });
    }
});

// ─── TRAINER / ADMIN ROUTES ───────────────────────────────────────────────────

router.get('/pending', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const plans = await prisma.dietPlan.findMany({
            where: { status: 'pending' },
            include: {
                member: { include: { user: { select: { name: true } } } },
                request: true,
                meals: { orderBy: [{ day: 'asc' }, { id: 'asc' }] }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending diet plans' });
    }
});

router.get('/active', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const plans = await prisma.dietPlan.findMany({
            where: { status: 'active' },
            include: {
                member: { include: { user: { select: { name: true } } } },
                request: true,
                meals: { orderBy: [{ day: 'asc' }, { id: 'asc' }] }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch active diet plans' });
    }
});

router.get('/plan/:id', requireRole('trainer', 'admin', 'member'), async (req, res) => {
    try {
        const plan = await prisma.dietPlan.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                meals: { orderBy: [{ day: 'asc' }, { id: 'asc' }] },
                member: { include: { user: { select: { name: true } } } },
                request: true
            }
        });
        if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
        res.json({ plan });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch diet plan' });
    }
});

// PUT /api/diet/plan/:id/meal/:mealId — Edit a specific meal
router.put('/plan/:id/meal/:mealId', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const { mealName, description, calories, protein, carbs, fats, mealType, day } = req.body;
        await prisma.dietMeal.update({
            where: { id: parseInt(req.params.mealId) },
            data: {
                mealName,
                description,
                calories: calories ? parseInt(calories) : null,
                protein: protein ? parseFloat(protein) : null,
                carbs: carbs ? parseFloat(carbs) : null,
                fats: fats ? parseFloat(fats) : null,
                mealType,
                day: day ? parseInt(day) : undefined
            }
        });

        // Mark plan as trainer edited
        await prisma.dietPlan.update({
            where: { id: parseInt(req.params.id) },
            data: { isTrainerEdited: true }
        });

        res.json({ message: 'Meal updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update meal' });
    }
});

// POST /api/diet/plan/:id/meal — Add a new meal to a plan
router.post('/plan/:id/meal', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const { mealName, description, calories, protein, carbs, fats, mealType, day } = req.body;
        await prisma.dietMeal.create({
            data: {
                planId: parseInt(req.params.id),
                day: parseInt(day),
                mealName,
                description,
                mealType,
                calories: calories ? parseInt(calories) : null,
                protein: protein ? parseFloat(protein) : null,
                carbs: carbs ? parseFloat(carbs) : null,
                fats: fats ? parseFloat(fats) : null
            }
        });

        await prisma.dietPlan.update({
            where: { id: parseInt(req.params.id) },
            data: { isTrainerEdited: true }
        });

        res.status(201).json({ message: 'Meal added' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add meal' });
    }
});

// DELETE /api/diet/plan/:id/meal/:mealId — Remove a meal
router.delete('/plan/:id/meal/:mealId', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        await prisma.dietMeal.delete({
            where: { id: parseInt(req.params.mealId) }
        });

        await prisma.dietPlan.update({
            where: { id: parseInt(req.params.id) },
            data: { isTrainerEdited: true }
        });

        res.json({ message: 'Meal removed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove meal' });
    }
});

router.put('/plan/:id/finalize', requireRole('trainer', 'admin'), async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // Deactivate old active plans
        await prisma.dietPlan.updateMany({
            where: { memberId: plan.memberId, status: 'active', NOT: { id: planId } },
            data: { status: 'completed' }
        });

        let trainerId = null;
        if (req.user.role === 'trainer') {
            const trainer = await prisma.trainer.findUnique({ where: { userId: req.user.id } });
            if (trainer) trainerId = trainer.id;
        }

        await prisma.dietPlan.update({
            where: { id: planId },
            data: { status: 'active', trainerId }
        });

        if (plan.requestId) {
            await prisma.dietRequest.update({
                where: { id: plan.requestId },
                data: { status: 'fulfilled' }
            });
        }

        // Create Notification for the member
        const memberUser = await prisma.member.findUnique({
            where: { id: plan.memberId },
            select: { userId: true }
        });

        if (memberUser) {
            await prisma.notification.create({
                data: {
                    userId: memberUser.userId,
                    title: 'Diet Plan Ready',
                    message: `Your personalized nutrition strategy "${plan.name}" has been finalized and is now active.`,
                    type: 'DIET'
                }
            });
        }

        res.json({ message: 'Diet plan finalized and activated!' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to finalize diet plan' });
    }
});

module.exports = router;
