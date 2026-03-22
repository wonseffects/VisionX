import express from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Helper for Base64 Auth
const getPagarmeAuth = () => {
    const key = process.env.PAGARME_SECRET_KEY || '';
    if (!key) console.warn("Atenção: PAGARME_SECRET_KEY não está configurada no .env");
    return `Basic ${Buffer.from(key + ':').toString('base64')}`;
};

// Helper for Phone Parsing
const parsePhone = (phoneStr) => {
    if (!phoneStr) return null;
    const justNumbers = phoneStr.replace(/\D/g, '');
    if (justNumbers.length >= 10) {
        return {
            country_code: '55',
            area_code: justNumbers.substring(0, 2),
            number: justNumbers.substring(2)
        };
    }
    return null;
};

// 1. Generate PIX Payment
router.post('/pix', async (req, res) => {
    try {
        const { plan, user_id, email, name, document, phone } = req.body;
        
        const amount = plan === 'annual' ? 93000 : 4990;
        const itemName = plan === 'annual' ? "Assinatura Anual - VisionX Premium" : "Assinatura Mensal - VisionX Premium";
        
        const payload = {
            items: [{ amount: amount, description: itemName, quantity: 1, code: "visionx_premium" }],
            customer: {
                name: name || 'Usuário VisionX',
                email: email || 'usuario@visionx.com',
                type: 'individual',
                document: document,
                phones: {
                    mobile_phone: parsePhone(phone)
                }
            },
            payments: [{
                payment_method: "pix",
                pix: { expires_in: 3600 }
            }],
            metadata: { user_id: user_id }
        };

        const response = await axios.post(`${PAGARME_API_URL}/orders`, payload, {
            headers: {
                'Authorization': getPagarmeAuth(),
                'Content-Type': 'application/json'
            }
        });

        const order = response.data;
        const pixData = order.charges?.[0]?.last_transaction?.qr_code_url 
                        ? order.charges[0].last_transaction 
                        : null;

        if (!pixData) {
            const chargeError = order.charges?.[0]?.last_transaction?.gateway_response?.errors?.[0]?.message;
            console.error("Ordem Pix com falha:", JSON.stringify(order));
            throw new Error(chargeError || "O Pagar.me criou a ordem, mas recusou gerar o QR Code. (Normalmente por CPF inválido).");
        }

        res.json({
            success: true,
            order_id: order.id,
            qr_code: pixData.qr_code,
            qr_code_url: pixData.qr_code_url,
            expires_at: pixData.expires_at
        });
    } catch (error) {
        const pagarmeError = error.response?.data;
        console.error('Pix generation error:', pagarmeError || error.message);
        const errorMessage = pagarmeError?.message || pagarmeError?.errors?.[0]?.message || error.message;
        res.status(500).json({ error: `Erro ao conectar ao Pagar.me: ${errorMessage}` });
    }
});

// 2. Process Credit Card
router.post('/card', async (req, res) => {
    try {
        const { plan, user_id, email, name, card_name, card_number, card_expiry, card_cvv, document, phone } = req.body;
        
        const amount = plan === 'annual' ? 93000 : 4990;
        const itemName = plan === 'annual' ? "Assinatura Anual - VisionX Premium" : "Assinatura Mensal - VisionX Premium";

        const [exp_month, exp_year] = card_expiry.split('/');

        // Payload using token or data structure for v5
        const payload = {
            items: [{ amount: amount, description: itemName, quantity: 1, code: "visionx_premium" }],
            customer: {
                name: name || 'Usuário VisionX',
                email: email || 'usuario@visionx.com',
                type: 'individual',
                document: document,
                phones: {
                    mobile_phone: parsePhone(phone)
                }
            },
            payments: [{
                payment_method: "credit_card",
                credit_card: {
                    installments: 1,
                    statement_descriptor: "VisionX",
                    card: {
                        number: card_number,
                        holder_name: card_name,
                        exp_month: parseInt(exp_month),
                        exp_year: parseInt(exp_year.length === 2 ? `20${exp_year}` : exp_year),
                        cvv: card_cvv
                    }
                }
            }],
            metadata: { user_id: user_id }
        };

        const response = await axios.post(`${PAGARME_API_URL}/orders`, payload, {
            headers: {
                'Authorization': getPagarmeAuth(),
                'Content-Type': 'application/json'
            }
        });

        const order = response.data;
        
        // Pagar.me handles authorization immediately for credit cards (synchronous or async)
        if (order.status === 'paid' || order.status === 'processing') {
             // Mock update if processing is fast
             if(order.status === 'paid' && user_id) {
                 await supabase.from('profiles').update({ subscription_status: 'premium' }).eq('id', user_id);
             }
             res.json({ success: true, status: order.status });
        } else {
             res.status(400).json({ error: 'Pagamento não aprovado pelo cartão.' });
        }
    } catch (error) {
        const pagarmeError = error.response?.data;
        console.error('Card processing error:', pagarmeError || error.message);
        const errorMessage = pagarmeError?.message || pagarmeError?.errors?.[0]?.message || error.message;
        res.status(500).json({ error: `Erro ao processar cartão: ${errorMessage}` });
    }
});

// 3. Poll Order Status (For Pix)
router.get('/status/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const response = await axios.get(`${PAGARME_API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': getPagarmeAuth() }
        });

        const order = response.data;
        
        if (order.status === 'paid') {
            const userId = order.metadata?.user_id;
            if (userId) {
                // Fulfill order
                await supabase.from('profiles').update({ subscription_status: 'premium' }).eq('id', userId);
            }
        }
        res.json({ status: order.status });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar status' });
    }
});

export default router;
