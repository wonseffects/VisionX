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
                    content: `Você é um pesquisador de dados. Sua tarefa é retornar um JSON estruturado com dados reais ou estimativas precisas sobre o tema solicitado.
                    
                    REGRAS:
                    1. Retorne APENAS um objeto JSON válido.
                    2. Se não tiver os dados exatos, forneça estimativas realistas baseadas no seu conhecimento até 2024.
                    3. Inclua 'confidence_score' para os dados fornecidos.
                    4. Organize os dados de forma que sejam fáceis de converter para gráficos (Ex: séries temporais, categorias, comparações).
                    
                    EXEMPLO DE RESPOSTA:
                    {
                        "topic": "Vendas Smartphones 2023",
                        "data": [
                            {"label": "Samsung", "value": 226, "unit": "milhões"},
                            {"label": "Apple", "value": 232, "unit": "milhões"}
                        ],
                        "source": "Estimativa baseada em tendências de mercado IDC 2023",
                        "confidence_score": 0.95
                    }`
                },
                {
                    role: 'user',
                    content: `Pesquise dados para o seguinte prompt: "${userPrompt}"`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error in groqResearch:', error);
        throw new Error('Falha ao pesquisar dados via Groq.');
    }
};
