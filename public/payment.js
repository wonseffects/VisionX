document.addEventListener('DOMContentLoaded', async () => {
    // Note: Depends on supabaseClient defined in app.js globally (or imported)
    // For simplicity, we assume we have tokens or we send requests to our backend which handles the token
    
    // UI Elements
    const upgradeModal = document.getElementById('upgrade-modal');
    const btnPayPix = document.getElementById('btn-pay-pix');
    const btnPayCard = document.getElementById('btn-pay-card');
    
    const pixForm = document.getElementById('pix-payment-form');
    const cardForm = document.getElementById('card-payment-form');
    
    const generatePixBtn = document.getElementById('generate-pix-btn');
    const pixQrContainer = document.getElementById('pix-qr-container');
    const pixQrImage = document.getElementById('pix-qr-image');
    const pixCopyPaste = document.getElementById('pix-copy-paste');
    const copyPixBtn = document.getElementById('copy-pix-btn');
    
    const msgError = document.getElementById('payment-error-msg');
    const msgSuccess = document.getElementById('payment-success-msg');

    let pixPollingInterval = null;

    // Check if URL has ?upgrade=true
    if (window.location.search.includes('upgrade=true') && upgradeModal) {
        upgradeModal.style.display = 'flex';
        // Clean url visually
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!upgradeModal) return;

    const showMessage = (msg, type = 'error') => {
        msgError.style.display = 'none';
        msgSuccess.style.display = 'none';
        if (type === 'error') {
            msgError.innerText = msg;
            msgError.style.display = 'block';
        } else {
            msgSuccess.innerText = msg;
            msgSuccess.style.display = 'block';
        }
    };

    // Tab switching
    btnPayPix.addEventListener('click', () => {
        btnPayPix.className = 'btn-primary';
        btnPayPix.style.background = '#10b981';
        btnPayCard.className = 'btn-secondary';
        
        pixForm.style.display = 'block';
        cardForm.style.display = 'none';
        msgError.style.display = 'none';
        msgSuccess.style.display = 'none';
    });

    btnPayCard.addEventListener('click', () => {
        btnPayCard.className = 'btn-primary';
        btnPayPix.className = 'btn-secondary';
        btnPayPix.style.background = '';
        
        cardForm.style.display = 'block';
        pixForm.style.display = 'none';
        msgError.style.display = 'none';
        msgSuccess.style.display = 'none';
    });

    const getToken = async () => {
        if (typeof supabase !== 'undefined') {
            const { data } = await supabase.auth.getSession();
            return data.session?.access_token;
        }
        return null;
    };

    // Pix Generation
    generatePixBtn.addEventListener('click', async () => {
        generatePixBtn.innerText = 'Gerando...';
        generatePixBtn.disabled = true;
        
        try {
            const token = await getToken();
            const res = await fetch('/api/payment/pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar Pix');
            
            // Assuming data contains qr_code_url and qr_code
            pixQrImage.src = data.qr_code_url;
            pixCopyPaste.value = data.qr_code;
            
            generatePixBtn.style.display = 'none';
            pixQrContainer.style.display = 'block';
            
            // Start polling order status
            startPixPolling(data.order_id);
            
        } catch (err) {
            showMessage(err.message, 'error');
            generatePixBtn.innerText = 'Gerar QR Code Pix';
            generatePixBtn.disabled = false;
        }
    });

    copyPixBtn.addEventListener('click', () => {
        pixCopyPaste.select();
        document.execCommand('copy');
        copyPixBtn.innerHTML = '<i data-lucide="check"></i> Copiado!';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            copyPixBtn.innerHTML = '<i data-lucide="copy"></i> Copiar Código Pix';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 2000);
    });

    const startPixPolling = (orderId) => {
        if (pixPollingInterval) clearInterval(pixPollingInterval);
        
        pixPollingInterval = setInterval(async () => {
            try {
                const token = await getToken();
                const res = await fetch(`/api/payment/status/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                if (data.status === 'paid') {
                    clearInterval(pixPollingInterval);
                    pixQrContainer.style.display = 'none';
                    showMessage('Pagamento recebido! Atualizando plano...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } catch (err) {
                console.warn('Erro checando status do pix', err);
            }
        }, 5000); // Check every 5s
    };

    // Credit Card Submission
    cardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('process-card-btn');
        btn.innerText = 'Processando...';
        btn.disabled = true;
        
        try {
            const token = await getToken();
            const res = await fetch('/api/payment/card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    card_name: document.getElementById('card-name').value,
                    card_number: document.getElementById('card-number').value.replace(/\s+/g, ''),
                    card_expiry: document.getElementById('card-expiry').value,
                    card_cvv: document.getElementById('card-cvv').value
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao processar cartão');
            
            showMessage('Pagamento aprovado! Seu plano foi atualizado.', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (err) {
            showMessage(err.message, 'error');
            btn.innerText = 'Pagar via Cartão';
            btn.disabled = false;
        }
    });

    // Clean up interval on close
    document.querySelector('.close-upgrade-modal').addEventListener('click', () => {
        if (pixPollingInterval) clearInterval(pixPollingInterval);
    });
});
