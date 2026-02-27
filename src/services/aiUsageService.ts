import { AIUsageRecord, AIUsageSummary } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { nutritionistService } from './nutritionistService';

class AIUsageService {
    /**
     * Record AI usage
     */
    async recordUsage(action: 'meal_plan' | 'recipe' | 'anamnesis' | 'evolution', tokensUsed: number = 1): Promise<AIUsageRecord> {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            // Fetch profile to get tenant_id and name
            const { data: profile } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('id', userData.user.id)
                .single();

            if (!profile?.tenant_id) throw new Error('Usuário sem tenant associado');

            // Use the RPC to check quota safely without RLS issues
            const { data: summaryData, error: summaryError } = await (supabase as any).rpc('get_tenant_ai_summary', { p_tenant_id: profile.tenant_id });

            if (summaryError || !summaryData || summaryData.error) {
                console.error('Error fetching quota via RPC:', summaryError || summaryData?.error);
            } else {
                if (summaryData.dailyUsage >= summaryData.dailyQuota || summaryData.monthlyUsage >= summaryData.monthlyQuota) {
                    throw new Error('Cota de IA excedida. Faça upgrade do plano ou aguarde o reset diário/mensal.');
                }
            }

            const { data, error } = await (supabase as any).rpc('record_ai_usage_rpc', {
                p_tenant_id: profile.tenant_id,
                p_user_id: profile.id,
                p_user_name: profile.name,
                p_user_role: profile.role === 'nutritionist' ? 'nutritionist' : 'patient',
                p_action: action,
                p_tokens: tokensUsed,
                p_cost: tokensUsed * 0.01
            });

            if (error || !data) throw error || new Error('Falha ao registrar uso de IA');

            return {
                id: data, // Return ID directly emitted from RPC
                tenantId: profile.tenant_id,
                userId: profile.id,
                userName: profile.name,
                userRole: profile.role,
                action: action,
                tokensUsed: tokensUsed,
                cost: tokensUsed * 0.01,
                createdAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Record Usage error', error);
            return handleSupabaseError(error);
        }
    }

    /**
     * Get AI usage summary for tenant
     */
    async getUsageSummary(tenantId: string): Promise<AIUsageSummary> {
        try {
            const { data, error } = await (supabase as any).rpc('get_tenant_ai_summary', { p_tenant_id: tenantId });

            if (error || data?.error) {
                console.error("error fetching summary", error || data?.error);
                throw new Error(data?.error || 'Erro ao consultar quotas via RPC');
            }

            return {
                tenantId,
                dailyUsage: data.dailyUsage,
                monthlyUsage: data.monthlyUsage,
                dailyQuota: data.dailyQuota,
                monthlyQuota: data.monthlyQuota,
                lastResetDate: new Date().toISOString(),
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get patient AI usage summary
     */
    async getPatientUsageSummary(userId: string, tenantId: string): Promise<AIUsageSummary> {
        try {
            const { data: settings } = await supabase.from('platform_settings').select('value').eq('key', 'ia_quotas').single();
            const patientMonthlyLimit = (settings as any)?.value?.patient_monthly_limit || 20;
            const patientDailyLimit = (settings as any)?.value?.patient_daily_limit || 2;

            const today = new Date().toISOString().slice(0, 10);
            const thisMonth = new Date().toISOString().slice(0, 7);

            const { count: dailyCount } = await supabase
                .from('ai_usage')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', today);

            const { count: monthlyCount } = await supabase
                .from('ai_usage')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', thisMonth + '-01');

            return {
                tenantId,
                dailyUsage: dailyCount || 0,
                monthlyUsage: monthlyCount || 0,
                dailyQuota: patientDailyLimit,
                monthlyQuota: patientMonthlyLimit,
                lastResetDate: new Date().toISOString()
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get detailed usage records for tenant
     */
    async getUsageRecords(tenantId: string, limit: number = 50): Promise<AIUsageRecord[]> {
        try {
            const { data, error } = await (supabase
                .from('ai_usage') as any)
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []).map((r: any) => ({
                id: r.id,
                tenantId: r.tenant_id,
                userId: r.user_id,
                userName: r.user_name,
                userRole: r.user_role as any,
                action: r.action as any,
                tokensUsed: r.tokens_used,
                cost: Number(r.cost),
                createdAt: r.created_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get usage records for all tenants (admin only)
     */
    async getAllUsageRecords(limit: number = 100): Promise<AIUsageRecord[]> {
        try {
            const { data, error } = await (supabase
                .from('ai_usage') as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []).map((r: any) => ({
                id: r.id,
                tenantId: r.tenant_id,
                userId: r.user_id,
                userName: r.user_name,
                userRole: r.user_role as any,
                action: r.action as any,
                tokensUsed: r.tokens_used,
                cost: Number(r.cost),
                createdAt: r.created_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get usage statistics by action type
     */
    async getUsageByAction(tenantId: string): Promise<Record<string, number>> {
        try {
            // In a real scenario, this would be an aggregation query
            const { data, error } = await (supabase
                .from('ai_usage') as any)
                .select('action')
                .eq('tenant_id', tenantId);

            if (error) throw error;

            const stats: Record<string, number> = {
                meal_plan: 0,
                recipe: 0,
                anamnesis: 0,
                evolution: 0,
            };

            (data || []).forEach((r: any) => {
                if (stats[r.action] !== undefined) {
                    stats[r.action]++;
                }
            });

            return stats;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Check if user can use AI feature
     */
    async canUseAI(): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return { allowed: false, reason: 'Não autenticado' };

            const { data: profile } = await (supabase
                .from('profiles') as any)
                .select('tenant_id, role')
                .eq('id', userData.user.id)
                .single();

            if (!profile?.tenant_id) return { allowed: false, reason: 'Usuário sem tenant associado' };

            const summary = await this.getUsageSummary(profile.tenant_id);

            // --- ROLE-BASED QUOTA LOGIC ---

            // 1. If Patient: Check against Global Patient Limit
            if (profile.role === 'patient') {
                const { data: settings } = await supabase.from('platform_settings').select('value').eq('key', 'ia_quotas').single();
                const patientMonthlyLimit = (settings as any)?.value?.patient_monthly_limit || 20;
                const patientDailyLimit = (settings as any)?.value?.patient_daily_limit || 2; // Hard limit of 2 per day

                // A. Check Daily Limit
                const today = new Date().toISOString().slice(0, 10);
                const { count: dailyCount } = await (supabase
                    .from('ai_usage') as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userData.user.id)
                    .gte('created_at', today);

                if ((dailyCount || 0) >= patientDailyLimit) {
                    return {
                        allowed: false,
                        reason: `Limite diário de paciente atingido (${dailyCount}/${patientDailyLimit}). Tente novamente amanhã.`,
                        remaining: 0
                    };
                }

                // B. Check Monthly Limit
                const thisMonth = new Date().toISOString().slice(0, 7);
                const { count: monthlyCount } = await (supabase
                    .from('ai_usage') as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userData.user.id)
                    .gte('created_at', thisMonth + '-01');

                if ((monthlyCount || 0) >= patientMonthlyLimit) {
                    return {
                        allowed: false,
                        reason: `Limite mensal de paciente atingido (${monthlyCount}/${patientMonthlyLimit}).`,
                        remaining: 0
                    };
                }

                // Fallthrough to also check tenant's daily quota (Double shield)
                // This ensures if the Nutritionist didn't pay, the patient can't use it either (cost control)
            }

            // 2. Nutri/Tenant Daily Check
            if (summary.dailyUsage >= summary.dailyQuota) {
                return { allowed: false, reason: 'Cota diária do consultório excedida. O nutricionista deve aguardar até amanhã.', remaining: 0 };
            }

            // 3. Nutri/Tenant Monthly Check
            if (summary.monthlyUsage >= summary.monthlyQuota) {
                return { allowed: false, reason: 'Cota mensal do consultório excedida.', remaining: 0 };
            }

            return {
                allowed: true,
                remaining: Math.min(
                    summary.dailyQuota - summary.dailyUsage,
                    summary.monthlyQuota - summary.monthlyUsage
                ),
            };
        } catch (error) {
            console.error('Error checking AI quota:', error);
            return { allowed: false, reason: 'Erro ao verificar disponibilidade de IA' };
        }
    }
}

export const aiUsageService = new AIUsageService();
