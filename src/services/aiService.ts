
import { mealPlanService } from './mealPlanService';
import { aiUsageService } from './aiUsageService';
import { Recipe, MealPlan } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instância oficial do Gemini com a chave fornecida
const genAI = new GoogleGenerativeAI('AIzaSyCZkwSJspnQ21ZXy4dPMPx_KdDDD8DQlpA');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

class AIService {
    /**
     * Generate a meal plan based on goals and observations
     */
    async generateMealPlan(data: { patientId: string, objective: string, observations?: string }): Promise<string> {
        try {
            // 1. Check quota
            const quota = await aiUsageService.canUseAI();
            if (!quota.allowed) {
                throw new Error(quota.reason || 'Cota de IA excedida');
            }

            // 2. Chamada Real para API Gemini
            const randomSeed = Math.floor(Math.random() * 1000000); // Seed de variabilidade
            const prompt = `Atue como um nutricionista clínico de elite e monte um plano alimentar estruturado, altamente personalizado e INÉDITO.
Semente de Variabilidade: ${randomSeed} (Garanta que a seleção de alimentos e a estrutura deste plano sejam completamente diferentes de qualquer plano gerado anteriormente).

OBJETIVO DO PACIENTE: ${data.objective}
OBSERVAÇÕES E RESTRIÇÕES OBRIGATÓRIAS: ${data.observations || 'Nenhuma restrição específica relatada. Seja criativo mas mantenha saúde e coerência.'}

REGRAS DE OURO (SIGA ESTRITAMENTE):
1. PERSONALIZAÇÃO ABSOLUTA: As observações/restrições ditadas acima SÃO A LEI DA DIETA. Nenhum alimento restrito pode aparecer.
2. FUJA DO PADRÃO: É PROIBIDO retornar templates robóticos, repetitivos ou genéricos. Use sua criatividade culinária-nutricional para trazer novos alimentos, sugestões de preparo variadas e opções que deem gosto do paciente seguir, sempre adequando ao Objetivo.
3. OPÇÕES: Retorne SEMPRE 2 ou 3 opções distintas de refeição para CADA horário (Café da Manhã, Lanche, Almoço, Lanche da Tarde, Jantar, Ceia).
4. MACROS: Inclua o valor calórico APROXIMADO e gramatura nas refeições (exemplo: Aprox. 300 kcal).
5. FORMATO: Seja direto através de Markdown elegante (## Refeições, **Alimentos**, listas). Sem introduções ou conclusões genéricas chatas.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.85, // Maior temperatura para garantir saídas não-determinísticas/criativas
                    topP: 0.9,
                }
            });
            const response = result.response.text();

            // 3. Record usage
            await aiUsageService.recordUsage('meal_plan');

            return response;
        } catch (error: any) {
            console.error('AI Meal Plan Generation Error:', error);
            throw new Error(error.message || 'Falha ao gerar plano alimentar na API Google Gemini.');
        }
    }

    /**
     * Generate an anamnesis summary/analysis
     */
    async analyzeAnamnesis(patientData: any): Promise<string> {
        try {
            await aiUsageService.recordUsage('anamnesis');

            const prompt = `Atue como um nutricionista clínico revisando uma ficha de anamnese.
Objetivo do paciente: ${patientData.objective || 'Não informado'}
Peso atual: ${patientData.weight || 'Não informado'}kg
Histórico/Sintomas: ${JSON.stringify(patientData)}

Forneça uma análise clínica breve (máximo 150 palavras) formatada em Markdown:
1. Resumo do perfil
2. Pontos de Atenção (bullet points)
3. Sugestão de Conduta inicial`;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            throw new Error('Falha na análise de anamnese via API Gemini');
        }
    }

    /**
     * Simulate AI recipe generation based on patient context
     */
    async generateRecipe(patientId: string, observations?: string): Promise<Recipe> {
        try {
            // 1. Check quota
            const quota = await aiUsageService.canUseAI();
            if (!quota.allowed) {
                throw new Error(quota.reason || 'Cota de IA excedida');
            }

            // 2. Fetch patient info for context
            const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single();

            // 2.5 Fetch latest meal plan
            const { data: latestPlan } = await supabase
                .from('meal_plans')
                .select('content')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let planContext = "";
            if ((latestPlan as any)?.content) {
                planContext = `\nAqui está o plano alimentar atual do paciente:\n${(latestPlan as any).content}\n\nA receita DEVE estar inteiramente alinhada com as recomendações deste plano alimentar (quantidade de calorias, restrições e distribuição de macronutrientes).`;
            }

            // 3. Chamada Real para API Gemini
            const prompt = `Atue como um chef de cozinha especializado em nutrição clínica.
Crie uma receita exclusiva e doce ou salgada (baseada nas observações se houver) para um paciente com o seguinte foco: ${(patient as any)?.objective || 'Equilíbrio e Saúde Geral'}.
${planContext}
${observations ? `\nOBSERVAÇÕES E PEDIDO ESPECÍFICO DO PACIENTE:\n"${observations}"\nLeve essa restrição/pedido em extrema consideração na criação da receita!\n` : ''}

RETORNE EXATAMENTE O SEGUINTE FORMATO JSON E NADA MAIS (nem markdown \`\`\`json):
{
  "title": "Nome da Receita",
  "ingredients": ["Ingrediente 1", "Ingrediente 2"],
  "instructions": "Passo a passo sucinto",
  "nutri": { "calories": 300, "protein": 20, "carbs": 30, "fats": 10 }
}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const selected = JSON.parse(responseText);

            // 4. Save the generated recipe to the database via safe RPC
            const { data: { session: _session } } = await supabase.auth.getSession();
            const authData = { user: _session?.user };
            if (!authData.user) throw new Error('Usuário não autenticado');

            const { data: profile } = await (supabase.from('profiles') as any)
                .select('tenant_id')
                .eq('id', authData.user.id)
                .single();

            const tenantId = (profile as any)?.tenant_id;

            const { data: newRecipe, error } = await (supabase as any).rpc('create_patient_recipe_rpc', {
                p_tenant_id: tenantId,
                p_patient_id: patientId,
                p_title: selected.title,
                p_ingredients: selected.ingredients,
                p_instructions: selected.instructions,
                p_calories: selected.nutri.calories,
                p_protein: selected.nutri.protein,
                p_carbs: selected.nutri.carbs,
                p_fats: selected.nutri.fats
            });

            if (error || !newRecipe) throw error || new Error('Falha ao criar receita no banco');

            // 5. Record usage
            await aiUsageService.recordUsage('recipe');

            return {
                id: newRecipe.id,
                tenantId: newRecipe.tenant_id,
                patientId: newRecipe.patient_id,
                title: newRecipe.title,
                ingredients: newRecipe.ingredients,
                instructions: newRecipe.instructions,
                calories: newRecipe.calories,
                protein: newRecipe.protein,
                carbs: newRecipe.carbs,
                fats: newRecipe.fats,
                generatedByAI: true,
                createdAt: newRecipe.created_at
            };
        } catch (error: any) {
            console.error('AI Generation Error:', error);
            throw new Error(error.message || 'Falha ao gerar conteúdo com IA');
        }
    }
}

export const aiService = new AIService();
