const { GoogleGenerativeAI } = require("@google/generative-ai");
const { QdrantClient } = require("@qdrant/js-client-rest");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function testEmbedding() {
    console.log("Testing embedding model: embedding-001...");
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent("test text");
        console.log("Embedding successful. Length:", result.embedding.values.length);
    } catch (err) {
        console.error("Embedding error:", err.message);
    }
}

async function testQdrant() {
    console.log("Testing Qdrant connectivity...");
    try {
        const collections = await qdrant.getCollections();
        console.log("Qdrant Collections:", collections.collections.map(c => c.name));
    } catch (err) {
        console.error("Qdrant error:", err.message);
    }
}

async function run() {
    await testEmbedding();
    await testQdrant();
}

run();
