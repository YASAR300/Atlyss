const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(requireRole('admin'));

// ─── Helpers ────────────────────────────────────────────────────────────────
const MEMBER_INCLUDE = {
    member: {
        include: {
            trainer: { include: { user: { select: { id: true, name: true } } } },
            measurements: { orderBy: { measuredAt: 'desc' }, take: 1 },
            workoutPlans: {
                include: {
                    exercises: { orderBy: [{ day: 'asc' }, { order: 'asc' }] },
                    request: true
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    }
};

const TRAINER_INCLUDE = {
    trainer: {
        include: {
            members: { include: { user: { select: { id: true, name: true } } } },
            reviews: { include: { member: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }
        }
    }
};

// Generate member number: MEM-YYYY-XXXXX
async function generateMemberNo() {
    const year = new Date().getFullYear();
    const count = await prisma.member.count();
    return `MEM-${year}-${String(count + 1).padStart(5, '0')}`;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [totalMembers, totalTrainers, totalClasses, todayAttendance] = await Promise.all([
            prisma.member.count(),
            prisma.trainer.count(),
            prisma.class.count(),
            prisma.attendance.count({
                where: { checkInTime: { gte: startOfDay }, status: 'PRESENT' }
            })
        ]);
        const activeMembers = await prisma.member.count({
            where: { lastAttendance: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        });

        // Simplified weekly attendance for now to avoid groupBy on DateTime
        const weeklyAttendance = [];

        res.json({ totalMembers, totalTrainers, totalClasses, activeMembers, todayAttendance, weeklyAttendance });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

// ─── GET Members ─────────────────────────────────────────────────────────────
router.get('/members', async (req, res) => {
    try {
        const { search, membership, page = 1, limit = 12 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            role: 'member',
            ...(membership ? { member: { membershipType: membership } } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { member: { mobile: { contains: search, mode: 'insensitive' } } },
                    { member: { memberNo: { contains: search, mode: 'insensitive' } } },
                ]
            } : {}),
        };

        const [members, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: MEMBER_INCLUDE,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.json({ members: members.map(({ password, ...m }) => m), total, page: parseInt(page) });
    } catch (err) {
        console.error('Members error:', err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
});

// ─── GET Kiosk Users (Members + Trainers) ───────────────────────────────────
router.get('/kiosk-users', async (req, res) => {
    try {
        const [members, trainers] = await Promise.all([
            prisma.user.findMany({
                where: { role: 'member' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    member: { select: { memberNo: true } }
                }
            }),
            prisma.user.findMany({
                where: { role: 'trainer' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    trainer: { select: { mobile: true } }
                }
            })
        ]);

        res.json({ members, trainers });
    } catch (err) {
        console.error('Kiosk users error:', err);
        res.status(500).json({ message: 'Failed to fetch kiosk users' });
    }
});

// ─── GET Single Member ────────────────────────────────────────────────────────
router.get('/members/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                member: {
                    include: {
                        trainer: { include: { user: { select: { id: true, name: true } } } },
                        measurements: { orderBy: { measuredAt: 'desc' } }
                    }
                }
            }
        });
        if (!user) return res.status(404).json({ message: 'Member not found' });
        const { password, ...clean } = user;
        res.json(clean);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch member' });
    }
});

// ─── POST Create Member ───────────────────────────────────────────────────────
router.post('/members', async (req, res) => {
    try {
        const {
            name, email, password,
            age, gender, dob, mobile, address, occupation,
            height, weight, fitnessGoal, sessionTime,
            membershipType, membershipPackage, membershipAmount, membershipDueDate,
            guardianName, guardianRelation, guardianMobile,
            trainerId,
        } = req.body;

        if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        const memberNo = await generateMemberNo();
        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name, email,
                password: hashed,
                role: 'member',
                member: {
                    create: {
                        memberNo,
                        age: parseInt(age) || 25,
                        gender: gender || null,
                        dob: dob ? new Date(dob) : null,
                        mobile: mobile || null,
                        address: address || null,
                        occupation: occupation || null,
                        height: parseFloat(height) || 170,
                        weight: parseFloat(weight) || 70,
                        fitnessGoal: fitnessGoal || 'weight_loss',
                        sessionTime: sessionTime || null,
                        membershipType: membershipType || 'basic',
                        membershipPackage: membershipPackage || null,
                        membershipAmount: membershipAmount ? parseFloat(membershipAmount) : null,
                        membershipDueDate: membershipDueDate ? new Date(membershipDueDate) : null,
                        guardianName: guardianName || null,
                        guardianRelation: guardianRelation || null,
                        guardianMobile: guardianMobile || null,
                        trainerId: trainerId ? parseInt(trainerId) : null,
                    }
                }
            },
            include: MEMBER_INCLUDE
        });

        const { password: _, ...clean } = user;
        res.status(201).json({ user: clean, memberNo });
    } catch (err) {
        console.error('Create member error:', err);
        res.status(500).json({ message: 'Failed to create member' });
    }
});

// ─── PUT Update Member ────────────────────────────────────────────────────────
router.put('/members/:id', async (req, res) => {
    try {
        const uid = parseInt(req.params.id);
        const {
            name,
            age, gender, dob, mobile, address, occupation,
            height, weight, fitnessGoal, sessionTime,
            membershipType, membershipPackage, membershipAmount, membershipDueDate,
            guardianName, guardianRelation, guardianMobile,
            trainerId,
        } = req.body;

        await prisma.$transaction([
            prisma.user.update({ where: { id: uid }, data: { name } }),
            prisma.member.update({
                where: { userId: uid },
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
                    sessionTime: sessionTime ?? undefined,
                    membershipType: membershipType ?? undefined,
                    membershipPackage: membershipPackage ?? undefined,
                    membershipAmount: membershipAmount ? parseFloat(membershipAmount) : undefined,
                    membershipDueDate: membershipDueDate ? new Date(membershipDueDate) : undefined,
                    guardianName: guardianName ?? undefined,
                    guardianRelation: guardianRelation ?? undefined,
                    guardianMobile: guardianMobile ?? undefined,
                    trainerId: trainerId ? parseInt(trainerId) : (trainerId === null ? null : undefined),
                }
            })
        ]);
        res.json({ message: 'Member updated' });
    } catch (err) {
        console.error('Update member error:', err);
        res.status(500).json({ message: 'Failed to update member' });
    }
});

// ─── POST Trainer Assignment ──────────────────────────────────────────────────
router.put('/members/:id/assign', async (req, res) => {
    try {
        const uid = parseInt(req.params.id);
        const { trainerId } = req.body;
        await prisma.member.update({
            where: { userId: uid },
            data: { trainerId: trainerId ? parseInt(trainerId) : null }
        });
        res.json({ message: 'Trainer assigned successfully' });
    } catch (err) {
        console.error('Assign trainer error:', err);
        res.status(500).json({ message: 'Failed to assign trainer' });
    }
});

// ─── DELETE Member ────────────────────────────────────────────────────────────
router.delete('/members/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete member' });
    }
});

// ─── Assign Trainer ───────────────────────────────────────────────────────────
router.put('/members/:id/trainer', async (req, res) => {
    try {
        const { trainerId } = req.body;
        await prisma.member.update({
            where: { userId: parseInt(req.params.id) },
            data: { trainerId: trainerId ? parseInt(trainerId) : null }
        });
        res.json({ message: 'Trainer assigned' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to assign trainer' });
    }
});

// ─── Body Measurements ────────────────────────────────────────────────────────
router.get('/members/:id/measurements', async (req, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { userId: parseInt(req.params.id) } });
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

router.post('/members/:id/measurements', async (req, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { userId: parseInt(req.params.id) } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

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

// ─── GET Trainers ─────────────────────────────────────────────────────────────
router.get('/trainers', async (req, res) => {
    try {
        const { search } = req.query;
        const where = {
            role: 'trainer',
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };
        const trainers = await prisma.user.findMany({
            where,
            include: TRAINER_INCLUDE,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ trainers: trainers.map(({ password, ...t }) => t) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch trainers' });
    }
});

// ─── GET Single Trainer ───────────────────────────────────────────────────────
router.get('/trainers/:id', async (req, res) => {
    try {
        const trainer = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            include: TRAINER_INCLUDE
        });
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        const { password, ...clean } = trainer;
        res.json(clean);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch trainer' });
    }
});

// ─── POST Create Trainer ──────────────────────────────────────────────────────
router.post('/trainers', async (req, res) => {
    try {
        const {
            name, email, password,
            mobile, gender, address, weight, height,
            specialization, specializations, trainerType, experience,
            salary, gymJoinDate, successRate,
            certificates, fitnessJourney, termsConditions, photo,
            age, isActive,
        } = req.body;

        if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name, email, password: hashed, role: 'trainer',
                trainer: {
                    create: {
                        photo: photo || null,
                        mobile: mobile || null,
                        gender: gender || null,
                        address: address || null,
                        weight: weight ? parseFloat(weight) : null,
                        height: height ? parseFloat(height) : null,
                        specialization: specialization || 'General Fitness',
                        specializations: Array.isArray(specializations) ? specializations : [],
                        trainerType: trainerType || 'general',
                        experience: parseInt(experience) || 1,
                        salary: salary ? parseFloat(salary) : null,
                        gymJoinDate: gymJoinDate ? new Date(gymJoinDate) : null,
                        successRate: successRate ? parseFloat(successRate) : null,
                        certificates: Array.isArray(certificates) ? certificates : [],
                        fitnessJourney: fitnessJourney || null,
                        termsConditions: termsConditions || null,
                        age: age ? parseInt(age) : null,
                        isActive: isActive !== undefined ? Boolean(isActive) : true,
                    }
                }
            },
            include: TRAINER_INCLUDE
        });
        const { password: _, ...clean } = user;
        res.status(201).json({ user: clean });
    } catch (err) {
        console.error('Create trainer error:', err);
        res.status(500).json({ message: 'Failed to create trainer' });
    }
});

// ─── PUT Update Trainer ───────────────────────────────────────────────────────
router.put('/trainers/:id', async (req, res) => {
    try {
        const uid = parseInt(req.params.id);
        const {
            name,
            mobile, gender, address, weight, height,
            specialization, specializations, trainerType, experience,
            salary, gymJoinDate, successRate,
            certificates, fitnessJourney, termsConditions, photo,
            age, isActive,
        } = req.body;

        await prisma.$transaction([
            prisma.user.update({ where: { id: uid }, data: { name } }),
            prisma.trainer.update({
                where: { userId: uid },
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
                    experience: experience ? parseInt(experience) : undefined,
                    salary: salary ? parseFloat(salary) : undefined,
                    gymJoinDate: gymJoinDate ? new Date(gymJoinDate) : undefined,
                    successRate: successRate ? parseFloat(successRate) : undefined,
                    certificates: Array.isArray(certificates) ? certificates : undefined,
                    fitnessJourney: fitnessJourney ?? undefined,
                    termsConditions: termsConditions ?? undefined,
                    age: age ? parseInt(age) : undefined,
                    isActive: isActive !== undefined ? Boolean(isActive) : undefined,
                }
            })
        ]);
        res.json({ message: 'Trainer updated' });
    } catch (err) {
        console.error('Update trainer error:', err);
        res.status(500).json({ message: 'Failed to update trainer' });
    }
});

// ─── PATCH Toggle Trainer Active ─────────────────────────────────────────────
router.patch('/trainers/:id/toggle-active', async (req, res) => {
    try {
        const uid = parseInt(req.params.id);
        const trainer = await prisma.trainer.findUnique({ where: { userId: uid } });
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
        const updated = await prisma.trainer.update({
            where: { userId: uid },
            data: { isActive: !trainer.isActive }
        });
        res.json({ message: updated.isActive ? 'Trainer activated' : 'Trainer deactivated', isActive: updated.isActive });
    } catch (err) {
        res.status(500).json({ message: 'Failed to toggle trainer status' });
    }
});

// ─── DELETE Trainer ───────────────────────────────────────────────────────────
router.delete('/trainers/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Trainer deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete trainer' });
    }
});

// ─── Classes (Admin) ─────────────────────────────────────────────────────────
router.get('/classes', async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                trainer: { include: { user: { select: { id: true, name: true } } } },
                _count: { select: { attendance: true } }
            },
            orderBy: { scheduleTime: 'asc' }
        });
        res.json({ classes });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch classes' });
    }
});

router.post('/classes', async (req, res) => {
    try {
        const { className, trainerId, scheduleTime, capacity } = req.body;
        if (!className || !trainerId || !scheduleTime) return res.status(400).json({ message: 'className, trainerId, and scheduleTime are required' });
        const cls = await prisma.class.create({
            data: {
                className,
                trainerId: parseInt(trainerId),
                scheduleTime: new Date(scheduleTime),
                capacity: parseInt(capacity) || 20
            },
            include: {
                trainer: { include: { user: { select: { id: true, name: true } } } },
                _count: { select: { attendance: true } }
            }
        });
        res.status(201).json({ class: cls });
    } catch (err) {
        console.error('Create class error:', err);
        res.status(500).json({ message: 'Failed to create class' });
    }
});

router.delete('/classes/:id', async (req, res) => {
    try {
        await prisma.class.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Class deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete class' });
    }
});

// ─── Admin Profile ───────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) return res.status(404).json({ message: 'Admin not found' });
        const { password, ...clean } = user;
        res.json(clean);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch admin profile' });
    }
});

router.put('/profile', async (req, res) => {
    try {
        const { name, email } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, email }
        });
        const { password, ...clean } = updated;
        res.json({ message: 'Profile updated', user: clean });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update admin profile' });
    }
});

// ─── Attendance Management (Admin) ──────────────────────────────────────────
router.put('/attendance/:id', async (req, res) => {
    try {
        const { status, method } = req.body;
        const record = await prisma.attendance.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: status || undefined,
                method: method || 'MANUAL_ADMIN'
            },
            include: { user: { select: { name: true } } }
        });

        // Emit update
        const io = req.app.get('io');
        if (io) io.emit('attendance:update', { id: record.id, status: record.status });

        res.json({ message: 'Attendance record updated', record });
    } catch (err) {
        console.error('Admin attendance override error:', err);
        res.status(500).json({ message: 'Failed to update attendance record' });
    }
});

router.get('/attendance/stats', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [totalToday, absentees, byMethod] = await Promise.all([
            prisma.attendance.count({ where: { checkInTime: { gte: startOfDay }, status: 'PRESENT' } }),
            prisma.attendance.count({ where: { checkInTime: { gte: startOfDay }, status: 'ABSENT' } }),
            prisma.attendance.groupBy({
                by: ['method'],
                _count: true,
                where: { checkInTime: { gte: startOfDay } }
            })
        ]);

        res.json({ totalToday, absentees, byMethod });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attendance stats' });
    }
});

module.exports = router;
