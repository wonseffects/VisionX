document.addEventListener('DOMContentLoaded', async () => {
    // Supabase validation
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not found!');
        return;
    }
    const supabaseUrl = 'https://xptxqezitpdtdbxlamxr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdHhxZXppdHBkdGRieGxhbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzkzMzYsImV4cCI6MjA4NzgxNTMzNn0.6193IO9JbJBD-xGvjAMB14MqjCkgGWbUSN6dt6nB8n0';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Get Plan from URL
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'monthly';
    
    const planNameDisplay = document.getElementById('plan-name-display');
    const planPriceDisplay = document.getElementById('plan-price-display');
    const planDescDisplay = document.getElementById('plan-desc-display');

    if (plan === 'annual') {
        planNameDisplay.innerText = 'Pro Anual';
        planPriceDisplay.innerText = 'R$ 930,00/ano';
        planDescDisplay.innerText = 'Acesso ilimitado + 2 Meses Grátis + Acesso Antecipado';
    } else {
        planNameDisplay.innerText = 'Pro Mensal';
        planPriceDisplay.innerText = 'R$ 49,90/mês';
        planDescDisplay.innerText = 'Geração ilimitada, suporte 24/7 e exportação HTML.';
    }

    // Auth Overlay Logic
    const authOverlay = document.getElementById('checkout-auth-overlay');
    const authForm = document.getElementById('checkoutAuthForm');
    const userInfoDisplay = document.getElementById('user-info-display');
    const loggedUserEmail = document.getElementById('logged-user-email');
    const authMsg = document.getElementById('checkout-auth-msg');
    
    let guestUserId = null;
    let guestToken = null;

    const checkAuthStatus = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            guestUserId = session.user.id;
            guestToken = session.access_token;
            authOverlay.style.display = 'none';
            userInfoDisplay.style.display = 'block';
            loggedUserEmail.innerText = session.user.email;
        } else {
            authOverlay.style.display = 'flex';
            userInfoDisplay.style.display = 'none';
        }
    };

    await checkAuthStatus();

    window.logout = async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    };

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const btn = document.getElementById('authSubmitBtn');
        const defaultText = btn.innerText;
        btn.innerText = 'Processando...';
        btn.disabled = true;
        authMsg.style.display = 'none';

        try {
            // Tentar login primeiro
            let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error && (error.status === 400 || error.message.includes('Invalid login'))) {
                const signUpRes = await supabaseClient.auth.signUp({ 
                    email, 
                    password,
                    options: { data: { full_name: name } }
                });
                if (signUpRes.error) {
                    throw signUpRes.error;
                }
                
                if (signUpRes.data && signUpRes.data.user) {
                    guestUserId = signUpRes.data.user.id;
                    authOverlay.style.display = 'none';
                    userInfoDisplay.style.display = 'block';
                    loggedUserEmail.innerText = name + ' (' + email + ')';
                }
            } else if (error && error.message.includes('not confirmed')) {
                // If email is not confirmed, signIn fails but we don't have the user ID easily to link payment.
                throw new Error('Este e-mail já existe mas não foi confirmado. Confirme seu e-mail ou use outro.');
            } else if (error) {
                throw error;
            } else {
                await checkAuthStatus();
            }
        } catch (err) {
            showMessageAuth(err.message, 'error');
        } finally {
            btn.innerText = defaultText;
            btn.disabled = false;
        }
    });

    const showMessageAuth = (msg, type) => {
        authMsg.innerText = msg;
        authMsg.className = `auth-message ${type}`;
        authMsg.style.display = 'block';
    };

    // Payment UX Logic
    const tabPix = document.getElementById('tab-pix');
    const tabCard = document.getElementById('tab-card');
    const formPix = document.getElementById('form-pix');
    const formCard = document.getElementById('form-card');
    const msgPayment = document.getElementById('payment-msg');

    const showMessagePay = (msg, type) => {
        msgPayment.innerText = msg;
        msgPayment.className = `auth-message ${type}`;
        msgPayment.style.display = 'block';
    };

    tabPix.addEventListener('click', () => {
        tabPix.className = 'btn-pix';
        tabCard.className = 'btn-card inactive';
        formPix.style.display = 'block';
        formCard.style.display = 'none';
        msgPayment.style.display = 'none';
    });

    tabCard.addEventListener('click', () => {
        tabCard.className = 'btn-card';
        tabPix.className = 'btn-pix inactive';
        formCard.style.display = 'block';
        formPix.style.display = 'none';
        msgPayment.style.display = 'none';
    });

    // Pix Generation
    const btnGenPix = document.getElementById('btn-generate-pix');
    const pixContainer = document.getElementById('pix-container');
    const pixImg = document.getElementById('pix-img');
    const pixCode = document.getElementById('pix-code');
    const btnCopyPix = document.getElementById('btn-copy-pix');
    let pixPollingInterval = null;

    btnGenPix.addEventListener('click', async () => {
        btnGenPix.innerText = 'Gerando...';
        btnGenPix.disabled = true;
        
        try {
            if(!guestUserId) throw new Error('Por favor, preencha seus dados primeiro.');

            const headers = { 'Content-Type': 'application/json' };
            if (guestToken) headers['Authorization'] = `Bearer ${guestToken}`;

            const res = await fetch('/api/payment/pix', {
                method: 'POST',
                headers,
                body: JSON.stringify({ plan, user_id: guestUserId, email: loggedUserEmail.innerText.split(' ')[0] })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar Pix');
            
            pixImg.src = data.qr_code_url;
            pixCode.value = data.qr_code;
            
            btnGenPix.style.display = 'none';
            pixContainer.style.display = 'block';
            
            startPixPolling(data.order_id);
        } catch (err) {
            showMessagePay(err.message, 'error');
            btnGenPix.innerText = 'Gerar QR Code Pix';
            btnGenPix.disabled = false;
        }
    });

    btnCopyPix.addEventListener('click', () => {
        pixCode.select();
        document.execCommand('copy');
        btnCopyPix.innerHTML = '<i data-lucide="check"></i> Copiado!';
        lucide.createIcons();
        setTimeout(() => {
            btnCopyPix.innerHTML = '<i data-lucide="copy"></i> Copiar Código Pix';
            lucide.createIcons();
        }, 2000);
    });

    const startPixPolling = (orderId) => {
        if (pixPollingInterval) clearInterval(pixPollingInterval);
        pixPollingInterval = setInterval(async () => {
            try {
                const headers = {};
                if (guestToken) headers['Authorization'] = `Bearer ${guestToken}`;

                const res = await fetch(`/api/payment/status/${orderId}`, { headers });
                const data = await res.json();
                
                if (data.status === 'paid') {
                    clearInterval(pixPollingInterval);
                    pixContainer.style.display = 'none';
                    showMessagePay('Pagamento recebido! Redirecionando para o dashboard...', 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                }
            } catch (err) {}
        }, 5000);
    };

    // Card Payment
    formCard.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-pay-card');
        btn.innerText = 'Processando...';
        btn.disabled = true;
        
        try {
            if(!guestUserId) throw new Error('Por favor, preencha seus dados primeiro.');

            const headers = { 'Content-Type': 'application/json' };
            if (guestToken) headers['Authorization'] = `Bearer ${guestToken}`;

            const res = await fetch('/api/payment/card', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    plan,
                    user_id: guestUserId,
                    email: loggedUserEmail.innerText.split(' ')[0],
                    card_name: document.getElementById('card-name').value,
                    card_number: document.getElementById('card-number').value.replace(/\s+/g, ''),
                    card_expiry: document.getElementById('card-expiry').value,
                    card_cvv: document.getElementById('card-cvv').value
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao processar cartão');
            
            showMessagePay('Pagamento aprovado! Redirecionando para o dashboard...', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        } catch (err) {
            showMessagePay(err.message, 'error');
            btn.innerText = 'Finalizar Assinatura';
            btn.disabled = false;
        }
    });
});
