// Popup script - controla a interface da extensão

let extractedData = null;

// Elementos do DOM
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');
const captureBtn = document.getElementById('captureBtn');
const sendBtn = document.getElementById('sendBtn');
const webhookInput = document.getElementById('webhookUrl');

// Preview elements
const previewName = document.getElementById('preview-name');
const previewPrice = document.getElementById('preview-price');
const previewRating = document.getElementById('preview-rating');

// Carrega webhook URL salva
chrome.storage.local.get(['webhookUrl'], (result) => {
    if (result.webhookUrl) {
        webhookInput.value = result.webhookUrl;
    } else {
        // URL padrão
        webhookInput.value = 'http://localhost:5678/webhook/shopee-hunter';
    }
});

// Salva webhook URL quando alterada
webhookInput.addEventListener('change', () => {
    chrome.storage.local.set({ webhookUrl: webhookInput.value });
});

// Função para atualizar status
function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Função para mostrar preview
function showPreview(data) {
    previewName.textContent = data.nome_produto || 'Não encontrado';
    previewPrice.textContent = data.preco ? `R$ ${data.preco.toFixed(2)}` : 'Não encontrado';
    previewRating.textContent = data.rating ? `${data.rating} ⭐` : 'N/A';
    previewEl.style.display = 'block';
}

// Capturar dados
captureBtn.addEventListener('click', async () => {
    setStatus('Extraindo dados...', 'loading');
    captureBtn.disabled = true;

    try {
        // Pega a aba ativa
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Verifica se é página da Shopee
        if (!tab.url.includes('shopee.com.br')) {
            setStatus('❌ Abra uma página de produto da Shopee', 'error');
            captureBtn.disabled = false;
            return;
        }

        // Injeta o content script se necessário e extrai dados
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Extração inline para garantir que funcione
                try {
                    const nameEl = document.querySelector('[class*="VCxVoa"]') ||
                        document.querySelector('[class*="product-name"]') ||
                        document.querySelector('h1') ||
                        document.querySelector('[data-sqe="name"]');
                    const name = nameEl ? nameEl.textContent.trim() : '';

                    const priceEl = document.querySelector('[class*="pqTWkA"]') ||
                        document.querySelector('[class*="IZPeQz"]') ||
                        document.querySelector('[class*="price"][class*="current"]') ||
                        document.querySelector('.flex.items-center [class*="text-primary"]') ||
                        document.evaluate("//div[contains(text(),'R$')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    let price = priceEl ? priceEl.textContent.trim() : '';

                    // Fallback: busca qualquer elemento com R$ no texto
                    if (!price) {
                        const allElements = document.querySelectorAll('*');
                        for (const el of allElements) {
                            if (el.children.length === 0 && el.textContent.match(/R\$\s*\d+[,\.]\d{2}/)) {
                                price = el.textContent.trim();
                                break;
                            }
                        }
                    }

                    const priceMatch = price.match(/R?\$?\s*([\d.,]+)/);
                    const priceNum = priceMatch ? parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.')) : null;

                    const descEl = document.querySelector('[class*="f7AU53"]') ||
                        document.querySelector('[class*="product-detail"]');
                    const description = descEl ? descEl.textContent.trim().substring(0, 500) : '';

                    const imgEl = document.querySelector('[class*="IMAW4p"] img') ||
                        document.querySelector('img[class*="product"]') ||
                        document.querySelector('.product-image img');
                    const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('src')) : '';

                    const ratingEl = document.querySelector('[class*="rating"]');
                    let rating = ratingEl ? ratingEl.textContent.match(/[\d.]+/) : null;
                    rating = rating ? parseFloat(rating[0]) : null;

                    const soldEl = document.querySelector('[class*="e9sAi0"]');
                    let sold = soldEl ? soldEl.textContent.match(/\d+/) : null;
                    sold = sold ? parseInt(sold[0]) : null;

                    return {
                        url_produto: window.location.href,
                        nome_produto: name,
                        descricao_raw: description,
                        preco: priceNum,
                        imagens_urls: imageUrl,
                        rating: rating,
                        vendidos: sold,
                        status: 'scraped',
                        source: 'chrome_extension'
                    };
                } catch (error) {
                    return { error: error.message, status: 'error' };
                }
            }
        });

        extractedData = results[0].result;

        if (extractedData.error || !extractedData.nome_produto) {
            setStatus('⚠️ Alguns dados não encontrados', 'error');
        } else {
            setStatus('✅ Dados capturados!', 'success');
        }

        showPreview(extractedData);
        sendBtn.style.display = 'block';
        captureBtn.disabled = false;

    } catch (error) {
        setStatus(`❌ Erro: ${error.message}`, 'error');
        captureBtn.disabled = false;
    }
});

// Enviar para n8n
sendBtn.addEventListener('click', async () => {
    if (!extractedData) {
        setStatus('❌ Capture os dados primeiro', 'error');
        return;
    }

    const webhookUrl = webhookInput.value.trim();
    if (!webhookUrl) {
        setStatus('❌ Configure a URL do webhook', 'error');
        return;
    }

    setStatus('Enviando para n8n...', 'loading');
    sendBtn.disabled = true;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(extractedData)
        });

        if (response.ok) {
            setStatus('🚀 Enviado com sucesso!', 'success');
            // Reset após sucesso
            setTimeout(() => {
                extractedData = null;
                previewEl.style.display = 'none';
                sendBtn.style.display = 'none';
                setStatus('Pronto para capturar', 'ready');
            }, 2000);
        } else {
            setStatus(`❌ Erro HTTP: ${response.status}`, 'error');
        }
    } catch (error) {
        setStatus(`❌ Erro: ${error.message}`, 'error');
    }

    sendBtn.disabled = false;
});
