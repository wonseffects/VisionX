import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';
import paymentRoutes from './routes/payment.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
import { authMiddleware } from './utils/authMiddleware.js';

// Serve landing page by default for the root
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'landing.html'));
});

// Protect chat routes
app.use('/api/chat', authMiddleware, chatRoutes);

// Protect payment routes (except webhook)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        let event = req.body;
        if (Buffer.isBuffer(event)) {
            event = JSON.parse(event.toString('utf8'));
        }

        if (event.type === 'order.paid' && event.data?.metadata?.user_id) {
            const userId = event.data.metadata.user_id;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ subscription_status: 'premium' })
                .eq('id', userId);
                
            if (updateError) console.error("Erro no Webhook Supabase:", updateError);
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});

app.use('/api/payment', paymentRoutes);

// Catch-all to serve index.html (the app) for other routes
app.use((req, res) => {
    // If it's a file request that doesn't exist, we could return 404, but for SPA we serve index.html
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
