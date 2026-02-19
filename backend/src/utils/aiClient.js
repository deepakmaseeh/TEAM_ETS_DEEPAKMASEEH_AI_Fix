import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

export function initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey ? (apiKey.substring(0, 5) + '...') : 'undefined');
    if (!apiKey) {
        console.warn('GEMINI_API_KEY not found in environment variables. AI features will be disabled.');
        return;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        console.log('Gemini AI initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error.message);
    }
}

export async function generateText(prompt) {
    if (!genAI) {
        initializeAI();
        if (!genAI) {
            throw new Error('AI client not initialized. Please check GEMINI_API_KEY.');
        }
    }

    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to generate text with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.warn(`Failed with ${modelName}:`, error.message);
            lastError = error;
            // If it's a safety block or other non-retriable error, we might want to stop? 
            // For now, continue to next model.
        }
    }

    console.error('All models failed.');
    throw new Error(`AI Generation Failed after trying models: ${modelsToTry.join(', ')}. Last error: ${lastError?.message}`);
}
