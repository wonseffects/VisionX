import express from 'express';
import { researchData } from '../services/groqResearch.js';
import { generateDashboard } from '../services/groqService.js';
import { saveChat } from '../services/supabaseService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.id; // From authMiddleware

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Step 1: Research data
        const contextData = await researchData(prompt);

        // Step 2: Generate Dashboard HTML
        const dashboardHtml = await generateDashboard(prompt, contextData);

        res.json({
            success: true,
            dashboardHtml,
            contextData
        });
    } catch (error) {
        console.error('Error in chat route:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação.' });
    }
});

export default router;
