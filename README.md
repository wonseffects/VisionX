# 📊 DataViz AI — Gerador Inteligente de Dashboards com IA

> Transforme qualquer pergunta em um dashboard profissional com gráficos, comparações e análises de dados em tempo real — tudo via chat.

---

## 🧠 Visão Geral do Projeto

**Vision X** é um chatbot especialista em análise de dados que, ao invés de responder com texto, **gera páginas HTML interativas completas** com gráficos, comparações visuais e insights. O usuário digita um prompt como em um chat convencional, e a IA busca dados na internet, processa e entrega um dashboard profissional pronto para uso.

### Exemplo de uso:
> **Usuário:** *"Compare os produtos mais vendidos na Shopee e no Mercado Livre em 2025 vs 2026"*
>
> **Vision X:** Gera automaticamente uma página com gráfico de pizza, barras comparativas, tabelas e insights — tudo com download disponível.

---

## ✨ Funcionalidades

### Core
- 💬 **Interface de chat** simples e intuitiva para entrada de prompts
- 🌐 **Busca automática de dados** na internet via web scraping / APIs públicas
- 📊 **Geração de gráficos** interativos (pizza, barras, linhas, área, radar)
- 🔄 **Comparações lado a lado** entre períodos, marcas, plataformas ou categorias
- 📥 **Download dos dashboards** como HTML, PNG ou PDF
- 💾 **Histórico de conversas** com dashboards salvos por sessão

### Tipos de Análise Suportados
- 📈 Tendências de mercado (e-commerce, finanças, tecnologia)
- 🛒 Comparação de plataformas (Shopee vs Mercado Livre, Amazon, etc.)
- 📉 Evolução temporal (mensal, anual, trimestral)
- 🏆 Rankings e top produtos/serviços
- 🌍 Dados geográficos e regionais
- 🔢 Qualquer dataset público disponível online

### UX/UI
- 🌙 Tema escuro/claro
- 📱 Interface responsiva (mobile-friendly)
- ⚡ Streaming da resposta em tempo real (efeito de digitação)
- 🖼️ Preview inline do dashboard dentro do chat
- 🔗 Link para abrir o dashboard em tela cheia

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 | Estrutura e estilo da interface de chat |
| JavaScript (Vanilla) | Lógica do frontend sem frameworks pesados |
| [Chart.js](https://www.chartjs.org/) | Renderização de gráficos interativos |
| [html2canvas](https://html2canvas.hertzen.com/) | Export de gráficos como imagem |
| [jsPDF](https://github.com/parallax/jsPDF) | Export de dashboards como PDF |

### Backend
| Tecnologia | Uso |
|---|---|
| Node.js + Express | Servidor e rotas da API |
| [Groq SDK](https://console.groq.com/) | IA generativa — pesquisa de dados E geração de HTML |
| [Axios](https://axios-http.com/) | Requisições HTTP para a API do Groq |


### IA
| Modelo | Descrição |
|---|---|
| `openai/gpt-oss-120b` | Modelo principal para análise e geração de código |
| `openai/gpt-oss-20b` | Alternativa para contextos longos |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    USUÁRIO                          │
│         (digita prompt no chat)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              FRONTEND (chat UI)                     │
│  - Envia prompt para o backend                      │
│  - Recebe HTML do dashboard                         │
│  - Renderiza preview + botão de download            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Node.js / Express)            │
│                                                     │
│  1. Recebe o prompt do usuário                      │
│  2. IA analisa o prompt e decide quais dados buscar │
│  3. Busca dados na internet (scraping / APIs)       │
│  4. Envia dados + prompt para o Groq                │
│  5. Groq gera HTML completo com gráficos (Chart.js) │
│  6. Retorna o HTML para o frontend                  │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────┐
│  GROQ API (IA)   │   │  GROQ — BUSCA DE DADOS       │
│  (gratuito)      │   │  - IA gera dados estimados   │
│                  │   │    baseados em conhecimento  │
│  Gera o HTML     │   │  - IA indica margem de erro  │
│  do dashboard    │   │  - Zero dependências externas│
└──────────────────┘   └──────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
dataviz-ai/
│
├── public/                        # Frontend estático
│   ├── index.html                 # Página principal (chat UI)
│   ├── style.css                  # Estilos da interface
│   └── app.js                     # Lógica do frontend
│
├── src/                           # Backend
│   ├── server.js                  # Entry point do Express
│   ├── routes/
│   │   └── chat.js                # Rota POST /api/chat
│   ├── services/
│   │   ├── groqService.js         # Integração com a API do Groq (geração de HTML)
│   │   ├── groqResearch.js        # Groq como pesquisador — extrai dados via LLM
│   │   └── promptBuilder.js      # Monta o prompt para a IA
│   └── utils/
│       └── sanitize.js            # Sanitiza HTML gerado
│
├── prompts/
│   └── system_prompt.txt          # System prompt da IA especialista
│
├── .env                           # Variáveis de ambiente
├── .env.example                   # Exemplo de variáveis
├── package.json
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Conta gratuita no [Groq Console](https://console.groq.com/) para obter a API Key

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/dataviz-ai.git
cd dataviz-ai
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
GROQ_API_KEY=sua_chave_aqui
PORT=3000
```

### 4. Inicie o servidor
```bash
npm run dev     # desenvolvimento (com nodemon)
npm start       # produção
```

### 5. Acesse no navegador
```
http://localhost:3000
```

---

## 🔑 Obtendo as APIs Gratuitas

### Groq (obrigatório — gratuito)
1. Acesse [console.groq.com](https://console.groq.com/)
2. Crie uma conta gratuita
3. Gere uma API Key em **API Keys**
4. Cole no `.env` como `GROQ_API_KEY`

> ✅ O plano gratuito do Groq oferece **centenas de requisições por dia** com modelos poderosos como LLaMA 3.3 70B.



---

## 🤖 O System Prompt da IA

O coração do projeto é o **system prompt** que transforma o Groq em um especialista em dashboards. Ele instrui a IA a:

1. **Analisar** o prompt do usuário e identificar quais dados são necessários
2. **Usar os dados fornecidos** pelo backend (já buscados na internet)
3. **Gerar um HTML completo** e autocontido com:
   - Gráfico de pizza / donut para proporções
   - Gráfico de barras para comparações
   - Gráfico de linha para tendências temporais
   - Tabela resumo com destaques
   - Seção de insights automáticos
4. **Incluir botão de download** dentro do próprio HTML gerado

```txt
Você é DataViz AI, um especialista em análise de dados e criação de dashboards HTML.

Ao receber um prompt de análise, você SEMPRE responde com um HTML completo e válido
que contém gráficos Chart.js interativos, análises comparativas e insights automáticos.

NUNCA responda com texto puro. SEMPRE gere um arquivo HTML autocontido com:
- CDN do Chart.js incluído
- Pelo menos 2 tipos de gráficos diferentes
- Paleta de cores profissional
- Seção de insights textuais
- Botão para download da página

Use os dados reais fornecidos no contexto. Se os dados forem estimados, indique isso visualmente.
```

---

## 📐 Fluxo Completo de uma Requisição

```
1. Usuário digita: "Compare produtos mais vendidos Shopee vs Mercado Livre 2025-2026"

2. Frontend envia POST /api/chat { prompt: "..." }

3. Backend → groqResearch.js (1ª chamada ao Groq):
   - Envia o prompt com instrução: "Retorne um JSON com dados estimados
     sobre este tema baseado no seu conhecimento, com intervalos de confiança"
   - Groq retorna JSON estruturado com os dados para o dashboard

4. Backend → promptBuilder.js:
   - Combina o prompt do usuário + JSON de dados retornado
   - Adiciona instruções de formatação HTML + Chart.js

5. Backend → groqService.js (2ª chamada ao Groq):
   - Envia para o Groq com o system prompt de dashboard
   - Recebe HTML completo como resposta

6. Backend → sanitize.js:
   - Remove scripts maliciosos do HTML gerado

7. Frontend recebe o HTML:
   - Exibe preview em iframe dentro do chat
   - Adiciona botão "⬇️ Baixar Dashboard"
   - Salva no histórico da conversa
```

---

## 🎨 Interface do Chat — Detalhes de UX

### Layout Principal
```
┌─────────────────────────────────────────────────────┐
│  🔷 DataViz AI                           [⚙️] [🌙]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Histórico de mensagens]                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👤 Você                                      │   │
│  │ Compare produtos Shopee vs ML 2025-2026      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 DataViz AI                                │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │  [iframe com o dashboard gerado]        │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  │  [⬇️ Baixar HTML] [🖼️ Exportar PNG] [📄 PDF]│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [💬 Digite sua análise aqui...]       [Enviar ➤]  │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Melhorias Futuras (Roadmap)

### v1.1
- [ ] Autenticação de usuários com histórico persistente
- [ ] Upload de CSV/Excel para análise de dados próprios
- [ ] Templates pré-prontos (análise financeira, vendas, RH)

### v1.2
- [ ] Edição inline dos gráficos após geração
- [ ] Compartilhamento via link único (slug)
- [ ] Exportação para Google Slides

### v2.0
- [ ] Integração com Google Analytics, Meta Ads, etc.
- [ ] Dashboard ao vivo com dados atualizando em tempo real
- [ ] Modo colaborativo (múltiplos usuários editando)

---

## ⚠️ Limitações Conhecidas

| Limitação | Causa | Solução |
|---|---|---|
| Dados baseados no conhecimento da IA, não tempo real | Groq não acessa a internet | Indicar visualmente que são estimativas e sugerir validação |
| Rate limit no plano gratuito do Groq | Limite de tokens por minuto | Implementar queue de requisições + cache de respostas |
| 2 chamadas ao Groq por prompt | Pesquisa + geração separadas | Otimizar com um único prompt bem estruturado em v1.1 |

---

## 📄 Licença

MIT License — use, modifique e distribua livremente.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

<div align="center">

**Feito com ❤️ para democratizar a análise de dados**

[⭐ Star no GitHub](#) · [🐛 Reportar Bug](#) · [💡 Sugerir Feature](#)

</div>