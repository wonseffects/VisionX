import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

    // Check subscription / trial status
    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        // Migration: Create profile if it doesn't exist (for older users)
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, full_name: user.user_metadata?.full_name || 'Usuário' }])
            .select()
            .single();

        if (createError) {
            console.error('Profile Creation Error:', createError);
            return res.status(500).json({
                error: 'Erro ao criar perfil de usuário',
                details: createError.message,
                hint: 'Verifique se você executou o script SQL no Supabase'
            });
        }
        profile = newProfile;
    }

    req.user = user;
    req.profile = profile;

    // Trial enforcement (3 days = 259200000 ms)
    if (profile.subscription_status === 'trial') {
        const trialStart = new Date(profile.trial_start).getTime();
        const now = new Date().getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        if (now - trialStart > threeDaysMs) {
            return res.status(403).json({
                error: 'Teste grátis expirado',
                needsSubscription: true
            });
        }
    }

    next();
};
