/**
 * Workout Plan Generator Algorithm
 * Generates a personalized weekly workout plan based on:
 * - fitnessGoal: 'weight_loss' | 'muscle_gain' | 'endurance'
 * - experienceLevel: 'beginner' | 'intermediate' | 'advanced'
 * - availableExercises: array from DB
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getIntensity(experienceLevel) {
    const levels = {
        beginner: { sets: 2, reps: 10 },
        intermediate: { sets: 3, reps: 12 },
        advanced: { sets: 4, reps: 15 },
    };
    return levels[experienceLevel] || levels.intermediate;
}

function filterExercisesByGoal(exercises, fitnessGoal) {
    if (fitnessGoal === 'weight_loss') {
        // Cardio + HIIT + Full body
        const priority = ['cardio', 'full body', 'core'];
        const cardio = exercises.filter(e => priority.some(p => e.muscleGroup.toLowerCase().includes(p)));
        const others = exercises.filter(e => !priority.some(p => e.muscleGroup.toLowerCase().includes(p)));
        return [...cardio, ...others];
    }
    if (fitnessGoal === 'muscle_gain') {
        // Strength-focused: chest, back, legs, shoulders, arms
        const priority = ['chest', 'back', 'legs', 'shoulders', 'arms', 'biceps', 'triceps'];
        const strength = exercises.filter(e => priority.some(p => e.muscleGroup.toLowerCase().includes(p)));
        const others = exercises.filter(e => !priority.some(p => e.muscleGroup.toLowerCase().includes(p)));
        return [...strength, ...others];
    }
    if (fitnessGoal === 'endurance') {
        // Mixed: cardio + strength at moderate intensity
        return [...exercises].sort(() => 0.5 - Math.random());
    }
    return exercises;
}

function generateWeeklyPlan(fitnessGoal, experienceLevel, availableExercises) {
    const intensity = getIntensity(experienceLevel);
    const sorted = filterExercisesByGoal(availableExercises, fitnessGoal);

    // Distribute exercises across days (3-4 exercises per day)
    const exercisesPerDay = fitnessGoal === 'muscle_gain' ? 4 : 3;
    const plan = {};

    DAYS.forEach((day, index) => {
        const startIdx = (index * exercisesPerDay) % sorted.length;
        const dayExercises = [];

        for (let i = 0; i < exercisesPerDay; i++) {
            const ex = sorted[(startIdx + i) % sorted.length];
            dayExercises.push({
                exerciseId: ex.id,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: intensity.sets,
                reps: intensity.reps,
                instructions: ex.instructions,
                videoUrl: ex.videoUrl,
                day,
            });
        }

        plan[day] = dayExercises;
    });

    // Sunday = Rest
    plan['Sunday'] = [];

    return plan;
}

module.exports = { generateWeeklyPlan };
