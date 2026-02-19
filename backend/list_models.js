import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        fs.writeFileSync('model_list.txt', 'No API Key');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const names = data.models.map(m => m.name).join('\n');
            fs.writeFileSync('model_list.txt', `Available Models:\n${names}`);
        } else {
            fs.writeFileSync('model_list.txt', `No models found. Response:\n${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        fs.writeFileSync('model_list.txt', `Fetch Error: ${error.message}`);
    }
}

listModels();
