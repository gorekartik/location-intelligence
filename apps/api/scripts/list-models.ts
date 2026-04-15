
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key:", apiKey ? "DEFINED" : "UNDEFINED");

    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Note: listModels is a method on the GoogleGenerativeAI instance? 
        // No, it's on the ModelManager usually, but SDK might different.
        // Actually, checking docs: genAI.makeRequest? 
        // Wait, the error message said "Call ListModels".
        // In the Node SDK: 
        // Not directly available on genAI instance in v0.1.
        // But maybe I can use the model to get info?

        // Actually, let's try a simple generation with "gemini-pro" again but print full error.
        // Or better, let's use the REST API via fetch to list models if SDK doesn't support it easily.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        console.log("Available Models:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
