import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const researchData = async (userPrompt) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Você é um pesquisador e analista de dados avançado. A data atual é 2026.
Sua tarefa é retornar um JSON estruturado com dados reais ou estimativas precisas e atualizadas sobre o tema solicitado.

REGRAS ABSOLUTAS:
1. Retorne APENAS um objeto JSON válido, sem nenhum texto extra.
2. A data atual é 2026. Se o ano não for especificado, use 2026. NUNCA assuma 2014.
3. Se o assunto for histórico, use a data real, caso contrário traga para os dias de hoje (2025/2026).
4. BUG CRÍTICO DE ARRAYS (PROIBIÇÃO):
   - NUNCA junte ou concatene números de uma série temporal em um só valor.
   - ERRADO: "data": [6861] (Isso é proibido!)
   - CORRETO: "data": [68, 61] (Cada número deve ser um item separado no array).
   - Se os dados forem, por exemplo, 10, 20 e 30, o resultado deve ser [10, 20, 30]. NUNCA [102030].
5. Todo o conteúdo gerado (textos, títulos) deve estar em português (PT-BR).

ESTRUTURA DO JSON OBRIGATÓRIA (Siga o formato, mas use dados Reais do prompt):
{
    "title": "Título do Dashboard",
    "date": "Mês/Ano",
    "kpis": [
        {"label": "KPI 1", "value": "Valor"},
        {"label": "KPI 2", "value": "Valor"},
        {"label": "KPI 3", "value": "Valor"},
        {"label": "KPI 4", "value": "Valor"}
    ],
    "charts": [
        {
            "id": "chart1",
            "type": "bar",
            "title": "Título do Gráfico",
            "labels": ["Etiqueta 1", "Etiqueta 2", "Etiqueta 3"],
            "datasets": [
                { "label": "Série A", "data": [10, 20, 30] } // USE VÍRGULAS ENTRE CADA NÚMERO
            ]
        },
        {
            "id": "chart2",
            "type": "line",
            "title": "Título do Gráfico",
            "labels": ["Jan", "Fev", "Mar"],
            "datasets": [
                { "label": "Série B", "data": [100, 250, 400] } 
            ]
        },
        {
            "id": "chart3",
            "type": "doughnut",
            "title": "Título do Gráfico",
            "labels": ["Categoria A", "Categoria B"],
            "datasets": [
                { "label": "Série C", "data": [60, 40] }
            ]
        }
    ],
    "table_data": {
        "headers": ["Cabeçalho 1", "Cabeçalho 2"],
        "rows": [
            ["Dado 1", "Dado 2"],
            ["Dado 3", "Dado 4"]
        ]
    },
    "insights": [
        "Insight 1 (mínimo 3)",
        "Insight 2",
        "Insight 3"
    ],
    "source": "Fonte real consultada (Ex: Statista, Bloomberg, etc)",
    "confidence_score": 0.95
}`
                },
                {
                    role: 'user',
                    content: `Gere os dados reais para o tema: "${userPrompt}"`
                }
            ],
            model: 'openai/gpt-oss-120b',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error in groqResearch:', error);
        throw new Error('Falha ao pesquisar dados via Groq.');
    }
};
