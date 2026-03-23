import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

    // 1. Fetch or Create Profile
    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, full_name: user.user_metadata?.full_name || 'Usuário' }])
            .select()
            .single();

        if (createError) {
            console.error('Profile Creation Error:', createError);
            return res.status(500).json({ error: 'Erro ao criar perfil de usuário' });
        }
        profile = newProfile;
    }

    req.user = user;
    req.profile = profile;

    // 2. Subscription/Trial Enforcement
    if (profile.subscription_status === 'trial') {
        // A. Check 3-day duration
        const trialStart = new Date(profile.trial_start).getTime();
        const now = new Date().getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        if (now - trialStart > threeDaysMs) {
            return res.status(403).json({
                error: 'Seu período de 3 dias de teste grátis expirou.',
                needsSubscription: true,
                reason: 'trial_expired'
            });
        }

        // B. Check daily limit (3 chats per day)
        const { getTodayChatCount } = await import('../services/supabaseService.js');
        const dailyCount = await getTodayChatCount(user.id);

        if (dailyCount >= 3) {
            return res.status(403).json({
                error: 'Você atingiu o limite de 3 análises diárias do plano gratuito.',
                needsSubscription: true,
                reason: 'daily_limit'
            });
        }
    }

    next();
};
