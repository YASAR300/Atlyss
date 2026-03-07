const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const trainerRoutes = require('./src/routes/trainer');
const memberRoutes = require('./src/routes/member');
const workoutRoutes = require('./src/routes/workout');
const attendanceRoutes = require('./src/routes/attendance');

const app = express();
const httpServer = http.createServer(app);

// Allowed frontend origins (local + production) — strip trailing slashes
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CLIENT_URL,
].filter(Boolean).map(o => o.replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : origin;
    if (!normalizedOrigin || ALLOWED_ORIGINS.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Atlyss Server Running 🚀', timestamp: new Date() });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('checkin', (data) => {
    // Broadcast attendance update to all admin clients
    io.emit('attendance_update', {
      ...data,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Atlyss Server running on port ${PORT}`);
});
