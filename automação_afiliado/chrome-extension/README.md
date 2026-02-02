# 🔥 Shopee Hunter - Chrome Extension

Extensão para capturar produtos da Shopee e enviar para n8n.

## 📦 Instalação

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o **Modo de desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `chrome-extension`
5. A extensão aparecerá na barra de ferramentas!

## 🚀 Como Usar

1. Abra um produto na Shopee: `https://shopee.com.br/...`
2. Clique no ícone 🔥 da extensão
3. Clique em **📸 Capturar Produto**
4. Verifique os dados no preview
5. Clique em **🚀 Enviar para n8n**

## ⚙️ Configuração do Webhook

A URL padrão é: `http://localhost:5678/webhook/shopee-hunter`

Se precisar mudar, edite no campo "Webhook URL" da extensão.

## 🔧 Troubleshooting

- **Dados não aparecem?** A Shopee pode ter atualizado o HTML. Os seletores CSS podem precisar de ajuste.
- **Erro de conexão?** Verifique se o n8n está rodando e o webhook está ativo.
