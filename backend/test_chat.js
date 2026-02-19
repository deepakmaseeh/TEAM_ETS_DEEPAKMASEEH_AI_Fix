import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

dotenv.config();

process.on('uncaughtException', (err) => {
    fs.writeFileSync('chat_test_output.txt', `Uncaught: ${err.message}\n${err.stack}`);
});

async function testChat() {
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        fs.writeFileSync('chat_test_output.txt', 'Starting test with gemini-2.0-flash...\n');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent('Hello! This is a test.');
        const response = await result.response;
        const text = response.text();

        fs.appendFileSync('chat_test_output.txt', `Success: ${text}\n`);
    } catch (error) {
        fs.writeFileSync('chat_test_output.txt', `Error: ${error.message}\n${error.stack}`);
    }
}

testChat();
