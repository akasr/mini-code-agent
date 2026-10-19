import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error(
        "GEMINI_API_KEY is missing. Configure it in your .env file.",
    );
}

const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

const ai = new GoogleGenAI({ apiKey });

export async function generateText(prompt: string): Promise<string> {
    const response = await ai.interactions.create({
        model,
        input: prompt,
    });
    
    const text = response.output_text;

    if (!text) {
        throw new Error("Gemini returned no text in its response");
    }

    return text;
}