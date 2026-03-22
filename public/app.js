// VisionX App - v1.0.2 - Updated Delete Logic
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
    console.log('VisionX App Initialized');

    // Session Check
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'landing.html';
        return;
    }

    const userFullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário';
    const userProfileName = document.querySelector('.user-profile span');
    const userProfileAvatar = document.querySelector('.user-profile .avatar');
    
    if (userProfileName) userProfileName.innerText = userFullName;
    if (userProfileAvatar) userProfileAvatar.innerText = userFullName.charAt(0).toUpperCase();

    // Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const newChatBtn = document.getElementById('new-chat-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const settingsBtn = document.getElementById('settings-btn'); // Added settingsBtn element

    // Functions
    const addMessage = (role, content) => {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            ${role === 'system' ? '<div class="avatar-system" style="background: transparent; padding: 0;"><img src="logo.svg" style="width: 100%; height: 100%; border-radius: 50%;"></div>' : ''}
            <div class="message-bubble">${content}</div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    };

    const displayDashboard = (html, date) => {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = 'message system';
        div.innerHTML = `
            <div class="avatar-system" style="background: transparent; padding: 0;"><img src="logo.svg" style="width: 100%; height: 100%; border-radius: 50%;"></div>
            <div class="message-bubble" style="width: 100%;">
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
                    Analytics — ${new Date(date).toLocaleString()}
                </p>
                <iframe class="dashboard-preview" srcdoc="${html.replace(/"/g, '&quot;')}" sandbox="allow-scripts allow-popups"></iframe>
                <div class="dashboard-actions" style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;" onclick="downloadDashboardHtml(this)">
                        <i data-lucide="download" style="width:14px; height:14px; margin-right:5px;"></i> Baixar Dashboard (.html)
                    </button>
                </div>
            </div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const loadHistory = async () => {
        try {
            const { data: history } = await supabaseClient
                .from('chats')
                .select('*')
                .order('created_at', { ascending: false });

            const historyList = document.getElementById('chat-history-list');
            if (historyList) {
                if (history && history.length > 0) {
                    historyList.innerHTML = '';
                    console.log(`Rendering ${history.length} history items...`);
                    history.forEach(chat => {
                        const li = document.createElement('li');
                        li.className = 'history-item';
                        li.innerHTML = `
                            <span class="chat-prompt" title="${chat.prompt}">${chat.prompt}</span>
                            <button class="delete-btn" title="Apagar conversa" data-id="${chat.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        `;

                        // Handle Prompt Click
                        const promptSpan = li.querySelector('.chat-prompt');
                        promptSpan.onclick = () => {
                            console.log('Loading chat:', chat.id);
                            chatMessages.innerHTML = '';
                            addMessage('user', chat.prompt);
                            displayDashboard(chat.dashboard_html, chat.created_at);
                        };

                        // Handle Delete Click
                        const delBtn = li.querySelector('.delete-btn');
                        delBtn.onclick = (e) => {
                            e.stopPropagation();
                            const deleteModal = document.getElementById('delete-confirm-modal');
                            const confirmBtn = document.getElementById('confirm-delete-btn');
                            const cancelBtn = document.getElementById('cancel-delete-btn');
                            const closeBtn = deleteModal.querySelector('.close-delete-modal');

                            if (deleteModal) {
                                deleteModal.style.display = 'flex';

                                // One-time handlers for this deletion instance
                                const cleanup = () => {
                                    deleteModal.style.display = 'none';
                                    confirmBtn.onclick = null;
                                    cancelBtn.onclick = null;
                                    closeBtn.onclick = null;
                                };

                                confirmBtn.onclick = async () => {
                                    try {
                                        console.log('Deleting chat:', chat.id);
                                        const { error } = await supabaseClient
                                            .from('chats')
                                            .delete()
                                            .eq('id', chat.id);

                                        if (error) throw error;
                                        cleanup();
                                        loadHistory();
                                    } catch (err) {
                                        console.error('Error deleting chat:', err);
                                        alert('Erro ao apagar conversa: ' + err.message);
                                        cleanup();
                                    }
                                };

                                cancelBtn.onclick = cleanup;
                                closeBtn.onclick = cleanup;
                            }
                        };

                        historyList.appendChild(li);
                    });

                    // Final lucide render
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                } else {
                    historyList.innerHTML = '<li class="empty-history">Sem histórico recente</li>';
                }
            }
        } catch (err) {
            console.warn('History error:', err);
        }
    };

    const handleSend = async (forcedPrompt = null) => {
        const prompt = forcedPrompt || userInput.value.trim();
        if (!prompt) return;

        if (!forcedPrompt) {
            userInput.value = '';
            userInput.style.height = 'auto';
        }

        addMessage('user', prompt);
        const loading = addMessage('system', '<i>Analisando dados e gerando visualização...</i>');

        try {
            const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentSession.access_token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (loading && loading.parentNode) chatMessages.removeChild(loading);

            if (data.success) {
                displayDashboard(data.dashboardHtml, new Date());

                // Save to Supabase from frontend to respect RLS
                const { error: saveError } = await supabaseClient
                    .from('chats')
                    .insert([{
                        user_id: currentSession.user.id,
                        prompt: prompt,
                        dashboard_html: data.dashboardHtml
                    }]);

                if (saveError) console.error('Error saving chat:', saveError);
                loadHistory(); // Refresh history list
            } else {
                if (res.status === 403 || data.needsSubscription) {
                    addMessage('system', `
                        <div style="padding: 10px 0;">
                            <h3 style="color: #ef4444; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="alert-circle"></i> Teste Grátis Expirado
                            </h3>
                            <p style="margin-bottom: 20px;">Seu período de teste grátis chegou ao fim. Para continuar gerando dashboards incríveis, por favor, faça o upgrade para o plano Premium.</p>
                            <button onclick="document.getElementById('upgrade-modal').style.display='flex';" class="btn-primary" style="background: var(--gradient-main); width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <i data-lucide="zap"></i> Fazer Upgrade Agora
                            </button>
                        </div>
                    `);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                } else {
                    addMessage('system', `Erro: ${data.error || 'Falha na geração'}`);
                }
            }
        } catch (err) {
            if (loading && loading.parentNode) chatMessages.removeChild(loading);
            addMessage('system', 'Erro de conexão com o servidor.');
            console.error(err);
        }
    };

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.textContent.replace(/^"|"$/g, '');
            handleSend(prompt);
        });
    });

    // Events
    if (sendBtn) sendBtn.addEventListener('click', () => handleSend());
    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'landing.html';
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = themeToggle.querySelector('i');
            if (icon) {
                const isLight = document.body.classList.contains('light-theme');
                themeToggle.innerHTML = `<i data-lucide="${isLight ? 'sun' : 'moon'}"></i>`;
                lucide.createIcons();
            }
        });
    }

    if (newChatBtn) newChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = `
            <div class="message system">
                <div class="avatar-system" style="background: transparent; padding: 0;"><img src="logo.svg" style="width: 100%; height: 100%; border-radius: 50%;"></div>
                <div class="message-bubble">
                    <h2>Olá! Eu sou o Vision X.</h2>
                    <p>Transforme suas perguntas em dashboards profissionais. Tente algo como:</p>
                    <div class="suggestions">
                        <button class="suggestion-chip">"Compare o PIB do Brasil vs China nos últimos 10 anos"</button>
                        <button class="suggestion-chip">"Quais foram as linguagens de programação mais usadas em 2024?"</button>
                        <button class="suggestion-chip">"Evolução das ações da Tech corp no último semestre"</button>
                    </div>
                </div>
            </div>
        `;
        // Re-bind suggestions
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.textContent.replace(/^"|"$/g, '');
                handleSend(prompt);
            });
        });
    });

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.app-container').classList.toggle('sidebar-open');
        });
    }

    // Close sidebar on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar') && !e.target.closest('#mobile-menu-btn')) {
            document.querySelector('.app-container').classList.remove('sidebar-open');
        }
    });

    loadHistory();
});

// Global for inline onclick
window.downloadDashboardHtml = (btn) => {
    const iframe = btn.closest('.message-bubble').querySelector('iframe');
    const blob = new Blob([iframe.srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VisionX_Insight_${Date.now()}.html`;
    a.click();
};
