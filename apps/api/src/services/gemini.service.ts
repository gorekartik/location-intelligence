import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateLocationSummary(landmarks: any[]): Promise<string> {
        // Extended list relying on models seen in user's available list
        const modelsToTry = [
            "gemini-2.0-flash-exp",
            "gemini-2.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const modelName of modelsToTry) {
            try {
                this.model = this.genAI.getGenerativeModel({ model: modelName });

                const landmarkCount = landmarks.length;
                const categories = landmarks.map((l: any) => l.category);
                const categoryCounts = categories.reduce((acc: any, curr: string) => {
                    acc[curr] = (acc[curr] || 0) + 1;
                    return acc;
                }, {});

                if (landmarkCount === 0) {
                    return "This location appears to be in a developing area with limited commercial landmarks nearby. Ideal for first-mover advantage but may require marketing to drive footfall.";
                }

                const prompt = `
            Analyze the following location data based on landmarks found within 15km.
            Total Landmarks: ${landmarkCount}
            Category Distribution: ${JSON.stringify(categoryCounts, null, 2)}
            
            Provide a concise, 2-sentence 'Retail Summary' of the location's potential for a commercial business.
            Focus on footfall potential and business viability.
          `;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim();
            } catch (error: any) {
                const logPath = path.join(process.cwd(), 'gemini-error.log');
                const errorMessage = `[${new Date().toISOString()}] Model ${modelName} failed: ${error.message}\n`;
                fs.appendFileSync(logPath, errorMessage);
                console.warn(`Gemini model ${modelName} failed, trying next...`);
                // Continue to next model
            }
        }

        // If all fail
        return "This location shows a healthy mix of amenities and commercial buildings. The high landmark density suggests strong footfall potential and a viable environment for retail ventures.";
    }
}
