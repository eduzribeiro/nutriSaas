
import { MealPlan, MealPlanTemplate, Recipe } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

class MealPlanService {
    /**
     * Get meal plans for a specific patient
     */
    async getPatientMealPlans(patientId: string): Promise<MealPlan[]> {
        try {
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(this.mapToMealPlan);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Create a new meal plan
     */
    async createMealPlan(plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealPlan> {
        try {
            const { data, error } = await (supabase
                .from('meal_plans') as any)
                .insert({
                    tenant_id: plan.tenantId,
                    patient_id: plan.patientId,
                    title: plan.title,
                    content: plan.content,
                    generated_by: plan.generatedBy,
                    status: plan.status,
                    created_by: plan.createdBy,
                })
                .select()
                .single();

            if (error) throw error;
            return this.mapToMealPlan(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Update an existing meal plan
     */
    async updateMealPlan(id: string, updates: Partial<MealPlan>): Promise<MealPlan> {
        try {
            const { data, error } = await (supabase
                .from('meal_plans') as any)
                .update({
                    title: updates.title,
                    content: updates.content,
                    status: updates.status,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return this.mapToMealPlan(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get templates for a tenant
     */
    async getTemplates(): Promise<MealPlanTemplate[]> {
        try {
            const { data, error } = await supabase
                .from('meal_plan_templates')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return (data || []).map((t: any) => ({
                id: t.id,
                tenantId: t.tenant_id,
                name: t.name,
                description: t.description,
                content: t.content,
                isDefault: t.is_default,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Recipes
     */
    async getRecipes(patientId?: string): Promise<Recipe[]> {
        try {
            let query: any = supabase.from('recipes').select('*');

            if (patientId) {
                query = query.or(`patient_id.eq.${patientId},patient_id.is.null`);
            } else {
                query = query.is('patient_id', null);
            }

            const { data, error } = await query.order('title', { ascending: true });

            if (error) throw error;
            return (data || []).map((r: any) => ({
                id: r.id,
                tenantId: r.tenant_id,
                patientId: r.patient_id,
                title: r.title,
                ingredients: r.ingredients,
                instructions: r.instructions,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fats: r.fats,
                generatedByAI: r.generated_by_ai,
                createdAt: r.created_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    private mapToMealPlan(data: any): MealPlan {
        if (!data) return {} as MealPlan;
        return {
            id: data.id,
            tenantId: data.tenant_id,
            patientId: data.patient_id,
            title: data.title,
            content: data.content,
            generatedBy: data.generated_by,
            status: data.status,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            is_released: data.is_released,
        };
    }
}

export const mealPlanService = new MealPlanService();
