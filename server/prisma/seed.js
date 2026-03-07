const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Atlyss database...');

    // Clear existing data (order matters for FK constraints)
    await prisma.attendance.deleteMany();
    await prisma.workoutPlan.deleteMany();
    await prisma.class.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.member.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();

    // ─── Users ───────────────────────────────────────────────────────────────
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const trainerPass = await bcrypt.hash('Trainer@123', 12);
    const memberPass = await bcrypt.hash('Member@123', 12);

    // Admin
    const admin = await prisma.user.create({
        data: {
            name: 'Alex Admin',
            email: 'admin@atlyss.com',
            password: adminPass,
            role: 'admin',
        }
    });

    // Trainers
    const trainer1 = await prisma.user.create({
        data: {
            name: 'Jake Trainer',
            email: 'jake@atlyss.com',
            password: trainerPass,
            role: 'trainer',
            trainer: {
                create: { specialization: 'Strength & Conditioning', experience: 5 }
            }
        },
        include: { trainer: true }
    });

    const trainer2 = await prisma.user.create({
        data: {
            name: 'Sara Fitness',
            email: 'sara@atlyss.com',
            password: trainerPass,
            role: 'trainer',
            trainer: {
                create: { specialization: 'Yoga & Cardio', experience: 3 }
            }
        },
        include: { trainer: true }
    });

    // Members
    const membersData = [
        { name: 'John Doe', email: 'john@atlyss.com', age: 28, height: 178, weight: 85, fitnessGoal: 'weight_loss', membershipType: 'premium' },
        { name: 'Emily Rose', email: 'emily@atlyss.com', age: 24, height: 163, weight: 58, fitnessGoal: 'muscle_gain', membershipType: 'basic' },
        { name: 'Mike Stone', email: 'mike@atlyss.com', age: 32, height: 182, weight: 95, fitnessGoal: 'muscle_gain', membershipType: 'vip' },
        { name: 'Priya Patel', email: 'priya@atlyss.com', age: 26, height: 160, weight: 55, fitnessGoal: 'endurance', membershipType: 'basic' },
        { name: 'Carlos Gym', email: 'carlos@atlyss.com', age: 30, height: 175, weight: 78, fitnessGoal: 'weight_loss', membershipType: 'premium' },
    ];

    const createdMembers = [];
    for (const m of membersData) {
        const user = await prisma.user.create({
            data: {
                name: m.name,
                email: m.email,
                password: memberPass,
                role: 'member',
                member: {
                    create: {
                        age: m.age,
                        height: m.height,
                        weight: m.weight,
                        fitnessGoal: m.fitnessGoal,
                        membershipType: m.membershipType,
                        lastAttendance: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    }
                }
            },
            include: { member: true }
        });
        createdMembers.push(user);
    }

    console.log(`✅ Created ${createdMembers.length} members`);

    // ─── Exercises ────────────────────────────────────────────────────────────
    const exercises = await prisma.exercise.createMany({
        data: [
            // Cardio
            { name: 'Treadmill Run', muscleGroup: 'Cardio', difficulty: 'beginner', instructions: 'Run at moderate pace for 20 minutes. Start slow, increase speed gradually. Keep posture upright and breathe rhythmically.', videoUrl: 'https://www.youtube.com/watch?v=tVBE5vnLBfo' },
            { name: 'Jump Rope', muscleGroup: 'Cardio', difficulty: 'beginner', instructions: 'Jump rope continuously for 3 minutes. Keep elbows close to body and use wrists to rotate rope. Land softly on balls of feet.', videoUrl: 'https://www.youtube.com/watch?v=ASKopPvToOI' },
            { name: 'Burpees', muscleGroup: 'Full Body', difficulty: 'intermediate', instructions: 'From standing, drop to squat, kick feet back to plank, do a push-up, jump feet forward, then jump up explosively. Repeat.', videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { name: 'Mountain Climbers', muscleGroup: 'Core', difficulty: 'intermediate', instructions: 'Start in plank position. Alternate driving knees toward chest rapidly. Keep hips low and core tight throughout.', videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { name: 'Box Jumps', muscleGroup: 'Cardio', difficulty: 'intermediate', instructions: 'Stand in front of box. Bend knees, swing arms, and jump onto box landing softly with bent knees. Step back down.', videoUrl: 'https://www.youtube.com/watch?v=52r-3ZCR9ZU' },
            // Chest
            { name: 'Bench Press', muscleGroup: 'Chest', difficulty: 'intermediate', instructions: 'Lie on bench, grip barbell slightly wider than shoulders. Lower bar to chest slowly, then press up explosively. Keep feet flat on floor.', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
            { name: 'Push-Ups', muscleGroup: 'Chest', difficulty: 'beginner', instructions: 'Place hands shoulder-width apart. Lower chest to floor keeping body straight, then push back up. Engage core throughout.', videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4' },
            { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', difficulty: 'intermediate', instructions: 'Set bench to 30-45 degrees. Press dumbbells up from chest level, fully extending arms at top. Lower slowly with control.', videoUrl: 'https://www.youtube.com/watch?v=7-PsiCbS_0A' },
            // Back
            { name: 'Pull-Ups', muscleGroup: 'Back', difficulty: 'advanced', instructions: 'Hang from bar with overhand grip. Pull body up until chin clears bar. Lower slowly. Engage back, not just arms.', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
            { name: 'Bent Over Row', muscleGroup: 'Back', difficulty: 'intermediate', instructions: 'Hinge at hips, back flat at 45 degrees. Row barbell to lower chest, leading with elbows. Squeeze shoulder blades at top.', videoUrl: 'https://www.youtube.com/watch?v=vT2GjY_Umpw' },
            { name: 'Lat Pulldown', muscleGroup: 'Back', difficulty: 'beginner', instructions: 'Grab cable bar slightly wider than shoulder width. Pull bar down to upper chest, leaning slightly back. Control the movement up.', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc' },
            // Legs
            { name: 'Barbell Squat', muscleGroup: 'Legs', difficulty: 'advanced', instructions: 'Bar on upper traps, feet shoulder-width apart. Squat down until thighs parallel to floor, chest up. Drive through heels to stand.', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8' },
            { name: 'Leg Press', muscleGroup: 'Legs', difficulty: 'beginner', instructions: 'Sit in leg press machine. Press weight up until legs nearly straight. Lower slowly. Do not lock knees at top.', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ' },
            { name: 'Romanian Deadlift', muscleGroup: 'Legs', difficulty: 'intermediate', instructions: 'Hold bar at hip height. Hinge at hips keeping back flat, lowering bar along legs until hamstrings stretch. Drive hips forward to return.', videoUrl: 'https://www.youtube.com/watch?v=7j-2ydKgd3k' },
            { name: 'Lunges', muscleGroup: 'Legs', difficulty: 'beginner', instructions: 'Step forward with one foot, lower back knee toward floor. Front knee stays above ankle. Push off front foot to return. Alternate legs.', videoUrl: 'https://www.youtube.com/watch?v=Z2n58m2i4jg' },
            // Shoulders
            { name: 'Overhead Press', muscleGroup: 'Shoulders', difficulty: 'intermediate', instructions: 'Hold barbell at shoulder height. Press overhead until arms fully extended. Lower slowly to starting position. Keep core tight.', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI' },
            { name: 'Lateral Raises', muscleGroup: 'Shoulders', difficulty: 'beginner', instructions: 'Hold dumbbells at sides. Raise arms laterally to shoulder height with slight elbow bend. Lower slowly. Avoid shrugging.', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
            // Arms
            { name: 'Barbell Curl', muscleGroup: 'Biceps', difficulty: 'beginner', instructions: 'Stand with barbell, palms up. Curl weight up keeping upper arms stationary. Squeeze at top, lower slowly. Do not swing back.', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
            { name: 'Tricep Dips', muscleGroup: 'Triceps', difficulty: 'intermediate', instructions: 'Use parallel bars or bench. Lower body by bending elbows to 90 degrees. Push back up fully extending arms. Lean slightly forward.', videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
            // Core
            { name: 'Plank', muscleGroup: 'Core', difficulty: 'beginner', instructions: 'Hold push-up position on forearms. Keep body straight from head to heels. Engage core and breathe steadily. Hold for 30-60 seconds.', videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c' },
        ]
    });

    console.log(`✅ Created 20 exercises`);

    // ─── Classes ──────────────────────────────────────────────────────────────
    const now = new Date();
    const classesData = [
        { className: 'Morning HIIT', trainerId: trainer1.trainer.id, scheduleTime: new Date(now.setHours(7, 0, 0, 0)), capacity: 15 },
        { className: 'Strength Basics', trainerId: trainer1.trainer.id, scheduleTime: new Date(new Date().setHours(10, 0, 0, 0)), capacity: 20 },
        { className: 'Yoga Flow', trainerId: trainer2.trainer.id, scheduleTime: new Date(new Date().setHours(8, 0, 0, 0)), capacity: 12 },
        { className: 'Cardio Blast', trainerId: trainer2.trainer.id, scheduleTime: new Date(new Date().setHours(18, 0, 0, 0)), capacity: 25 },
        { className: 'Evening Muscle Building', trainerId: trainer1.trainer.id, scheduleTime: new Date(new Date().setHours(19, 30, 0, 0)), capacity: 10 },
    ];

    const createdClasses = [];
    for (const c of classesData) {
        const cls = await prisma.class.create({ data: c });
        createdClasses.push(cls);
    }

    console.log(`✅ Created ${createdClasses.length} classes`);

    // ─── Sample Attendance ────────────────────────────────────────────────────
    const firstMember = createdMembers[0].member;
    await prisma.attendance.createMany({
        data: [
            { memberId: firstMember.id, classId: createdClasses[0].id, checkinTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { memberId: firstMember.id, classId: createdClasses[1].id, checkinTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { memberId: firstMember.id, classId: createdClasses[2].id, checkinTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        ]
    });

    console.log('✅ Sample attendance created');
    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin:   admin@atlyss.com     / Admin@123');
    console.log('   Trainer: jake@atlyss.com      / Trainer@123');
    console.log('   Member:  john@atlyss.com      / Member@123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
