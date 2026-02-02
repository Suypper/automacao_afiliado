// Content script - roda dentro da página da Shopee
// Extrai dados do produto do DOM

function extractProductData() {
    try {
        // Nome do produto
        const nameEl = document.querySelector('[class*="VCxVoa"]') ||
            document.querySelector('[class*="product-name"]') ||
            document.querySelector('h1') ||
            document.querySelector('[data-sqe="name"]');
        const name = nameEl ? nameEl.textContent.trim() : '';

        // Preço
        const priceEl = document.querySelector('[class*="pqTWkA"]') ||
            document.querySelector('[class*="price"]') ||
            document.querySelector('[class*="Price"]');
        let price = priceEl ? priceEl.textContent.trim() : '';
        // Limpa o preço (remove R$, pontos, converte vírgula)
        const priceMatch = price.match(/[\d.,]+/);
        const priceNum = priceMatch ? parseFloat(priceMatch[0].replace(/\./g, '').replace(',', '.')) : null;

        // Descrição
        const descEl = document.querySelector('[class*="f7AU53"]') ||
            document.querySelector('[class*="product-detail"]') ||
            document.querySelector('[class*="description"]');
        const description = descEl ? descEl.textContent.trim().substring(0, 500) : '';

        // Imagem principal
        const imgEl = document.querySelector('[class*="IMAW4p"]') ||
            document.querySelector('[class*="product-image"] img') ||
            document.querySelector('img[class*="image"]');
        const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('src')) : '';

        // Rating
        const ratingEl = document.querySelector('[class*="rating"]') ||
            document.querySelector('[class*="Rating"]');
        let rating = ratingEl ? ratingEl.textContent.match(/[\d.]+/) : null;
        rating = rating ? parseFloat(rating[0]) : null;

        // Vendidos
        const soldEl = document.querySelector('[class*="e9sAi0"]') ||
            document.querySelector('[class*="sold"]');
        let sold = soldEl ? soldEl.textContent.match(/\d+/) : null;
        sold = sold ? parseInt(sold[0]) : null;

        // URL atual
        const url = window.location.href;

        return {
            url_produto: url,
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
        return {
            error: error.message,
            url_produto: window.location.href,
            status: 'error'
        };
    }
}

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        const data = extractProductData();
        sendResponse(data);
    }
    return true;
});

// Também expõe globalmente para debug
window.extractShopeeData = extractProductData;
