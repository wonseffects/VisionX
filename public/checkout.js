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

    // --- Input Masks ---
    const maskCPF = (v) => {
        v = v.replace(/\D/g,"");
        v = v.replace(/(\d{3})(\d)/,"$1.$2");
        v = v.replace(/(\d{3})(\d)/,"$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
        return v;
    };
    const maskPhone = (v) => {
        v = v.replace(/\D/g,"");
        v = v.replace(/^(\d{2})(\d)/g,"($1) $2");
        v = v.replace(/(\d)(\d{4})$/,"$1-$2");
        return v;
    };
    const maskCard = (v) => {
        v = v.replace(/\D/g,"");
        v = v.replace(/(\d{4})(?=\d)/g,"$1 ");
        return v;
    };
    const maskExpiry = (v) => {
        v = v.replace(/\D/g,"");
        v = v.replace(/(\d{2})(?=\d)/,"$1/");
        return v;
    };

    document.getElementById('user-cpf')?.addEventListener('input', (e) => e.target.value = maskCPF(e.target.value));
    document.getElementById('user-phone')?.addEventListener('input', (e) => e.target.value = maskPhone(e.target.value));
    document.getElementById('card-number')?.addEventListener('input', (e) => e.target.value = maskCard(e.target.value));
    document.getElementById('card-expiry')?.addEventListener('input', (e) => e.target.value = maskExpiry(e.target.value));

    // --- Step Navigation ---
    const step1 = document.getElementById('step-1-dados');
    const step2 = document.getElementById('step-2-pagamento');
    const btnNextStep = document.getElementById('btn-next-step');
    const btnBackStep = document.getElementById('btn-back-step');

    btnNextStep?.addEventListener('click', () => {
        const name = document.getElementById('user-name').value;
        const cpf = document.getElementById('user-cpf').value;
        const phone = document.getElementById('user-phone').value;

        if (!name || cpf.length < 14 || phone.length < 14) {
            showMessagePay('Por favor, preencha todos os seus dados corretamente.', 'error');
            // Move message to Step 1 if it exists
            if (!document.getElementById('step1-msg')) {
               const msgEl = document.createElement('div');
               msgEl.id = 'step1-msg';
               msgEl.className = 'auth-message error';
               msgEl.style.marginBottom = '20px';
               step1.insertBefore(msgEl, step1.firstChild);
            }
            document.getElementById('step1-msg').innerText = 'Por favor, preencha nome, CPF e celular válidos.';
            document.getElementById('step1-msg').style.display = 'block';
            return;
        }
        if (document.getElementById('step1-msg')) document.getElementById('step1-msg').style.display = 'none';

        step1.style.display = 'none';
        step2.style.display = 'block';
        lucide.createIcons();
    });

    btnBackStep?.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
    });

    // Pix Generation
    const btnGenPix = document.getElementById('btn-generate-pix');
    const pixContainer = document.getElementById('pix-container');
    const pixImg = document.getElementById('pix-img');
    const pixCode = document.getElementById('pix-code');
    const btnCopyPix = document.getElementById('btn-copy-pix');
    const pixTimerDisplay = document.getElementById('pix-timer');
    const pixTimerSpan = pixTimerDisplay ? pixTimerDisplay.querySelector('span') : null;
    let pixPollingInterval = null;
    let pixCountdownInterval = null;

    btnGenPix.addEventListener('click', async () => {
        btnGenPix.innerText = 'Gerando...';
        btnGenPix.disabled = true;
        
        try {
            if(!guestUserId) throw new Error('Por favor, preencha seus dados primeiro.');
            
            const cpfVal = document.getElementById('user-cpf').value;
            if(!cpfVal) throw new Error('Por favor, informe o seu CPF.');

            const headers = { 'Content-Type': 'application/json' };
            if (guestToken) headers['Authorization'] = `Bearer ${guestToken}`;

            const res = await fetch('/api/payment/pix', {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                    plan, 
                    user_id: guestUserId, 
                    email: loggedUserEmail.innerText.split(' ')[0], 
                    name: document.getElementById('user-name').value,
                    document: cpfVal.replace(/\D/g, ''),
                    phone: document.getElementById('user-phone').value
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar Pix');
            
            pixImg.src = data.qr_code_url;
            pixCode.value = data.qr_code;
            
            btnGenPix.style.display = 'none';
            pixContainer.style.display = 'block';

            if (data.expires_at) {
                startPixTimer(data.expires_at);
            }
            
            startPixPolling(data.order_id);
        } catch (err) {
            showMessagePay(err.message, 'error');
            btnGenPix.innerText = 'Gerar QR Code Pix';
            btnGenPix.disabled = false;
        }
    });

    const startPixTimer = (expiresAtStr) => {
        if (pixCountdownInterval) clearInterval(pixCountdownInterval);
        if (!pixTimerDisplay || !pixTimerSpan) return;

        pixTimerDisplay.style.display = 'block';
        const expireTime = new Date(expiresAtStr).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = expireTime - now;

            if (distance < 0) {
                clearInterval(pixCountdownInterval);
                pixTimerSpan.innerText = 'Expirado';
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            pixTimerSpan.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        pixCountdownInterval = setInterval(updateTimer, 1000);
    };

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

            const cpfVal = document.getElementById('user-cpf').value;
            if(!cpfVal) throw new Error('Por favor, informe o seu CPF.');

            const headers = { 'Content-Type': 'application/json' };
            if (guestToken) headers['Authorization'] = `Bearer ${guestToken}`;

            const res = await fetch('/api/payment/card', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    plan,
                    user_id: guestUserId,
                    email: loggedUserEmail.innerText.split(' ')[0],
                    name: document.getElementById('user-name').value,
                    document: cpfVal.replace(/\D/g, ''),
                    phone: document.getElementById('user-phone').value,
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
