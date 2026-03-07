const { GoogleGenerativeAI } = require("@google/generative-ai");
const { QdrantClient } = require("@qdrant/js-client-rest");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-2.5-flash as strictly requested
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
    }
});

// Initialize Qdrant
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

/**
 * Generates a personalized workout plan using Gemini 2.5 Flash
 * supplemented by historical context from Qdrant Vector DB if available.
 */
const generateWorkout = async (request, member) => {
    console.log(`[AI Engine] Starting generation for member: ${member.id}`);

    try {
        const {
            fitnessGoal, experienceLevel, planDuration, targetFocus,
            daysPerWeek, sessionTime, equipment, intensity,
            recoveryOption, injuries
        } = request;

        // 1. Retrieve Historical Context from Qdrant (Safely)
        let historicalContext = "No specific historical benchmarks found. Proceeding with standard AI reasoning.";
        try {
            // Check if collection exists first
            const collections = await qdrant.getCollections();
            const hasCollection = collections.collections.some(c => c.name === "user_training_data");

            if (hasCollection) {
                const vector = await getEmbedding(`${fitnessGoal} ${experienceLevel} ${targetFocus}`);
                const searchResults = await qdrant.search("user_training_data", {
                    vector: vector,
                    limit: 3,
                    with_payload: true
                });

                if (searchResults && searchResults.length > 0) {
                    historicalContext = searchResults.map(r =>
                        `Prior Reference: ${r.payload.routine_summary || 'N/A'}. Success Indicator: ${r.payload.outcome || 'N/A'}`
                    ).join("\n");
                    console.log("[AI Engine] Successfully pulled context from Qdrant.");
                }
            } else {
                console.log("[AI Engine] Qdrant collection 'user_training_data' not found. Using zero-shot reasoning.");
            }
        } catch (qErr) {
            console.warn("[AI Engine] Vector search bypassed:", qErr.message);
        }

        // 2. Construct the Gemini Prompt
        const prompt = `
            You are Atlyss AI, a professional high-tier Fitness Trainer. 
            Generate a personalized workout plan for:
            - Age: ${member.age || 'N/A'}
            - Weight: ${member.weight || 'N/A'}kg
            - Height: ${member.height || 'N/A'}cm
            - Fitness Goal: ${fitnessGoal}
            - Experience Level: ${experienceLevel}
            - Equipment Available: ${Array.isArray(equipment) ? equipment.join(", ") : equipment}
            - Target Focus: ${targetFocus}
            - Training Days per Week: ${daysPerWeek}
            - Session Duration: ${sessionTime} min
            - Intensity Level: ${intensity}
            - Injuries/Restrictions: ${injuries || 'None'}
            
            VDB Historical Context:
            ${historicalContext}

            YOUR TASK:
            1. Return a JSON object with this exact structure:
               {
                 "name": "Smart-AI Optimized Plan",
                 "goal": "${fitnessGoal}",
                 "difficulty": "${experienceLevel}",
                 "duration": ${planDuration},
                 "exercises": [
                   {
                     "day": 1,
                     "dayTitle": "Chest & Triceps (Example)",
                     "name": "Bench Press",
                     "sets": 3,
                     "reps": "10-12",
                     "restTime": 60,
                     "instructions": "Full range of motion...",
                     "targetMuscle": "Chest",
                     "order": 0
                   }
                 ]
               }
            2. Logic: Ensure safety regarding injuries. Use ONLY specified equipment. Distribute work over ${daysPerWeek} distinct days within the ${planDuration} day cycle.
        `;

        // 3. Generate the Plan
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text();

        console.log("[AI Engine] Plan generation successful.");
        return JSON.parse(jsonText);
    } catch (err) {
        console.error("[AI Engine] Critical Failure:", err.message);
        throw new Error(`AI Workout Generation failed: ${err.message}`);
    }
};

/**
 * Helper to get embeddings for Qdrant search
 */
async function getEmbedding(text) {
    try {
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embedModel.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        // Fallback to a zero-vector if embedding fails (common if quotas are hit or model is restricted)
        console.warn("[AI Engine] Embedding failed, using fallback vector.");
        return new Array(768).fill(0); // Standard 768-dim if unknown, but Qdrant needs matching dims
    }
}

module.exports = { generateWorkout };
