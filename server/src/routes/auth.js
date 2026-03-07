const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, age, height, weight, fitnessGoal, membershipType, specialization, experience } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with admin role (public registration is only for admins)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'admin',
            }
        });

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPass } = user;
        res.status(201).json({ token, user: userWithoutPass });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                member: true,
                trainer: true,
            }
        });


        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPass } = user;
        res.json({ token, user: userWithoutPass });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                member: true,
                trainer: true,
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const { password: _, ...userWithoutPass } = user;
        res.json({ user: userWithoutPass });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
