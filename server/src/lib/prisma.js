const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// Reconnect on connection drop (Neon serverless idle timeout)
prisma.$on('error', async (e) => {
    console.error('[Prisma] Connection error, reconnecting...', e.message);
    try { await prisma.$connect(); } catch (_) { }
});

// Warm up connection
prisma.$connect().catch(e => console.error('[Prisma] Initial connect failed:', e.message));

module.exports = prisma;
