document.addEventListener('DOMContentLoaded', async () => {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not found!');
        return;
    }

    const supabaseUrl = 'https://xptxqezitpdtdbxlamxr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdHhxZXppdHBkdGRieGxhbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzkzMzYsImV4cCI6MjA4NzgxNTMzNn0.6193IO9JbJBD-xGvjAMB14MqjCkgGWbUSN6dt6nB8n0';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Session Check
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'landing.html';
        return;
    }

    const user = session.user;
    const settingsForm = document.getElementById('settings-form');
    const settingsMessage = document.getElementById('settings-message');
    const nameInput = document.getElementById('setName');
    const emailInput = document.getElementById('setEmail');
    const passInput = document.getElementById('setPass');

    const showMessage = (msg, type = 'error') => {
        if (!settingsMessage) return;
        settingsMessage.innerText = msg;
        settingsMessage.className = `auth-message ${type}`;
        settingsMessage.style.display = 'block';
    };

    // Load current data
    nameInput.value = user.user_metadata?.full_name || '';
    emailInput.value = user.email || '';

    // Load current plan
    const loadPlan = async () => {
        try {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('subscription_status, trial_start')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            const planTitle = document.getElementById('plan-title');
            const planDesc = document.getElementById('plan-desc');
            const planBox = document.getElementById('plan-status-box');
            
            if (profile.subscription_status === 'premium') {
                planTitle.innerHTML = '<i data-lucide="check-circle"></i> Plano Premium';
                planTitle.style.color = '#22c55e'; // green
                planDesc.innerText = 'Acesso ilimitado a todas as análises e recursos.';
                const upgradeBtn = planBox.querySelector('button');
                if (upgradeBtn) upgradeBtn.style.display = 'none';
            } else {
                planTitle.innerHTML = '<i data-lucide="clock"></i> Plano Free (Teste)';
                planTitle.style.color = 'var(--text-white)';
                
                const trialStart = new Date(profile.trial_start).getTime();
                const now = new Date().getTime();
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                const timeDiff = (trialStart + threeDaysMs) - now;
                
                if (timeDiff > 0) {
                    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    planDesc.innerText = `Seu período de teste grátis expira em ${daysRemaining} dia(s).`;
                } else {
                    planTitle.innerHTML = '<i data-lucide="alert-circle"></i> Teste Expirado';
                    planTitle.style.color = '#ef4444'; // red
                    planDesc.innerText = 'Seu teste grátis expirou. Faça upgrade para continuar.';
                }
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch(err) {
            console.warn('Erro ao carregar plano:', err);
            const planTitle = document.getElementById('plan-title');
            if(planTitle) planTitle.innerText = 'Erro ao carregar plano';
        }
    };
    
    loadPlan();

    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = settingsForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Salvando...';
            submitBtn.disabled = true;

            const newName = nameInput.value;
            const newEmail = emailInput.value;
            const newPass = passInput.value;

            try {
                const updates = {
                    data: { full_name: newName }
                };

                if (newEmail !== user.email) updates.email = newEmail;
                if (newPass) updates.password = newPass;

                const { error } = await supabaseClient.auth.updateUser(updates);

                if (error) throw error;

                // Also update the profile table if it exists
                const { error: profileError } = await supabaseClient
                    .from('profiles')
                    .update({ full_name: newName })
                    .eq('id', user.id);

                if (profileError) console.warn('Error updating profiles table:', profileError);

                showMessage('Alterações salvas com sucesso!', 'success');
                passInput.value = ''; // Clear password field
            } catch (err) {
                showMessage(err.message, 'error');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
