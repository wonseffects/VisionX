import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const systemPromptPath = path.join(process.cwd(), 'prompts', 'system_prompt.txt');

export const generateDashboard = async (userPrompt, contextData) => {
    try {
        const systemPromptTemplate = fs.readFileSync(systemPromptPath, 'utf-8');
        const systemPrompt = systemPromptTemplate.replace('{context_data}', JSON.stringify(contextData, null, 2));

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Gere o dashboard para: "${userPrompt}"`
                }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error in groqService:', error);
        throw new Error('Falha ao gerar dashboard via Groq.');
    }
};
