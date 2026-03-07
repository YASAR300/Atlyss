const { generateWorkout } = require("./src/lib/workoutGenerator");

async function simulate() {
    console.log("--- AI Generation Simulation ---");
    const mockRequest = {
        fitnessGoal: "Muscle Gain",
        experienceLevel: "Intermediate",
        planDuration: 7,
        targetFocus: "Hypertrophy",
        daysPerWeek: 4,
        sessionTime: 60,
        equipment: ["Full Gym", "Dumbbells"],
        intensity: "High",
        recoveryOption: "Active Recovery",
        injuries: "Lumbago (Lower back pain)"
    };

    const mockMember = {
        id: "mock-123",
        age: 28,
        weight: 75,
        height: 180
    };

    try {
        const plan = await generateWorkout(mockRequest, mockMember);
        console.log("--- SUCCESS! PLAN GENERATED ---");
        console.log("Plan Name:", plan.name);
        console.log("Exercise Count:", plan.exercises.length);
        console.log("First Exercise:", plan.exercises[0]?.name);
    } catch (err) {
        console.error("--- FAILURE! ---");
        console.error(err.message);
    }
}

simulate();
