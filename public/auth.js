document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not found!');
        return;
    }

    const supabaseUrl = 'https://xptxqezitpdtdbxlamxr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdHhxZXppdHBkdGRieGxhbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzkzMzYsImV4cCI6MjA4NzgxNTMzNn0.6193IO9JbJBD-xGvjAMB14MqjCkgGWbUSN6dt6nB8n0';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    console.log('VisionX Auth Initialized');
    // DOM Elements
    const authModal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const heroStartBtn = document.getElementById('heroStartBtn');
    const closeModal = document.getElementById('closeModal');
    const authForm = document.getElementById('authForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const signupFields = document.getElementById('signupFields');

    let currentMode = 'login';

    const authMessage = document.getElementById('auth-message');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const fullNameInput = document.getElementById('fullName');

    const showMessage = (msg, type = 'error') => {
        if (!authMessage) return;
        authMessage.innerText = msg;
        authMessage.className = `auth-message ${type}`;
        authMessage.style.display = 'block';
    };

    const clearMessage = () => {
        if (!authMessage) return;
        authMessage.style.display = 'none';
        authMessage.innerText = '';
    };

    const updateTabs = () => {
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === currentMode) {
                btn.classList.add('active');
                btn.style.opacity = '1';
            } else {
                btn.classList.remove('active');
                btn.style.opacity = '0.5';
            }
        });
        if (signupFields) signupFields.style.display = currentMode === 'signup' ? 'block' : 'none';
        clearMessage();
    };

    const openModal = (mode = 'login') => {
        if (!authModal) return;
        currentMode = mode;
        authModal.style.display = 'flex';
        updateTabs();
    };

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => openModal('signup'));
    if (heroStartBtn) heroStartBtn.addEventListener('click', () => openModal('signup'));
    if (closeModal) closeModal.addEventListener('click', () => {
        authModal.style.display = 'none';
        clearMessage();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.getAttribute('data-tab');
            updateTabs();
        });
    });

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage();
            const submitBtn = authForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Processando...';
            submitBtn.disabled = true;

            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                if (currentMode === 'signup') {
                    const fullName = fullNameInput.value;

                    // Supabase signUp already returns an error if user exists and email confirmation is on,
                    // or it might auto-signin if confirmation is off. 
                    // To explicitly check if user exists BEFORE signup (as requested):
                    // Note: Supabase doesn't allow searching users by email for security unless using admin API.
                    // However, we can attempt signUp and handle the specific "User already registered" error.

                    const { data, error } = await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: { data: { full_name: fullName } }
                    });

                    if (error) {
                        if (error.status === 400 || error.message.includes('already registered')) {
                            throw new Error('Este e-mail já está cadastrado.');
                        }
                        throw error;
                    }

                    // If user is already registered but hasn't confirmed email, Supabase might return success but no user session.
                    if (data && data.user && data.user.identities && data.user.identities.length === 0) {
                        throw new Error('Este e-mail já está cadastrado.');
                    }

                    showMessage('Cadastro realizado! Por favor, confirme seu e-mail.', 'success');
                } else {
                    const { error } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) {
                        if (error.status === 400) throw new Error('E-mail ou senha inválidos.');
                        throw error;
                    }
                    window.location.href = 'index.html';
                }
            } catch (error) {
                showMessage(error.message, 'error');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Auth State Change
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && window.location.pathname.includes('landing.html')) {
            window.location.href = 'index.html';
        }
    });
});
