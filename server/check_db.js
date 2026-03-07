const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.workoutRequest.findMany({
        include: { workoutPlan: true }
    });
    console.log('--- Workout Requests ---');
    console.log(JSON.stringify(requests.map(r => ({
        id: r.id,
        memberId: r.memberId,
        status: r.status,
        hasPlan: !!r.workoutPlan,
        planStatus: r.workoutPlan?.status
    })), null, 2));

    const plans = await prisma.workoutPlan.findMany({
        include: { request: true }
    });
    console.log('\n--- Workout Plans ---');
    console.log(JSON.stringify(plans.map(p => ({
        id: p.id,
        memberId: p.memberId,
        status: p.status,
        hasRequest: !!p.request,
        requestStatus: p.request?.status
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
