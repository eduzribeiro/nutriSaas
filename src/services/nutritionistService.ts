
import { Tenant, TenantSettings, TenantUsage } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

class NutritionistService {
    /**
     * Get all nutritionists/tenants (admin only)
     */
    async getAllNutritionists(): Promise<Tenant[]> {
        try {
            const { data, error } = await (supabase
                .from('tenants') as any)
                .select('*')
                .order('business_name', { ascending: true });

            if (error) throw error;
            return (data || []).map(this.mapToTenant);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get nutritionist/tenant by ID
     */
    async getNutritionistById(nutritionistId: string): Promise<Tenant | null> {
        try {
            const { data, error } = await (supabase
                .from('tenants') as any)
                .select('*')
                .or(`id.eq.${nutritionistId},nutritionist_id.eq.${nutritionistId}`)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return this.mapToTenant(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Update nutritionist/tenant
     */
    async updateNutritionist(
        tenantId: string,
        updates: Partial<Pick<Tenant, 'businessName' | 'status' | 'plan'>>
    ): Promise<Tenant> {
        try {
            const payload: any = {
                business_name: updates.businessName,
                status: updates.status,
                plan: updates.plan,
            };

            if (updates.plan) {
                const quotas = this.getQuotasByPlan(updates.plan);
                payload.ai_quota_daily = quotas.daily;
                payload.ai_quota_monthly = quotas.monthly;
            }

            const { data, error } = await (supabase
                .from('tenants') as any)
                .update(payload)
                .eq('id', tenantId)
                .select()
                .single();

            if (error) throw error;
            return this.mapToTenant(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Update nutritionist status (Admin Only)
     */
    async updateStatus(tenantId: string, status: 'active' | 'inactive'): Promise<void> {
        try {
            const { error } = await (supabase
                .from('tenants') as any)
                .update({ status })
                .or(`id.eq.${tenantId},nutritionist_id.eq.${tenantId}`);

            if (error) throw error;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Delete nutritionist and all associated data (Admin Only) - 100% Wipe from auth.users
     */
    async deleteNutritionist(tenantId: string): Promise<void> {
        try {
            const { error } = await (supabase as any).rpc('admin_delete_user_completely_rpc', {
                p_tenant_id: tenantId
            });

            if (error) throw error;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get tenant usage statistics
     */
    async getTenantUsage(tenantId: string): Promise<TenantUsage> {
        try {
            const { data, error } = await (supabase
                .from('tenant_usage_summary') as any)
                .select('*')
                .eq('tenant_id', tenantId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        tenantId,
                        aiUsageDaily: 0,
                        aiUsageMonthly: 0,
                        patientsCount: 0,
                        lastResetDate: new Date().toISOString(),
                    };
                }
                throw error;
            }

            const record = data as any;
            return {
                tenantId: record.tenant_id,
                aiUsageDaily: record.ai_usage_daily,
                aiUsageMonthly: record.ai_usage_monthly,
                patientsCount: record.patients_count,
                lastResetDate: record.last_ai_usage || new Date().toISOString(),
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get tenant settings
     */
    async getTenantSettings(tenantId: string): Promise<TenantSettings> {
        try {
            const { data, error } = await (supabase
                .from('tenant_settings') as any)
                .select('*')
                .eq('tenant_id', tenantId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const { data: newSettings, error: createError } = await (supabase
                        .from('tenant_settings') as any)
                        .insert({ tenant_id: tenantId })
                        .select()
                        .single();

                    if (createError) throw createError;
                    return this.mapToSettings(newSettings);
                }
                throw error;
            }

            return this.mapToSettings(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Update tenant settings
     */
    async updateTenantSettings(
        tenantId: string,
        settings: Partial<TenantSettings>
    ): Promise<TenantSettings> {
        try {
            const { data, error } = await (supabase
                .from('tenant_settings') as any)
                .update({
                    logo: settings.logo,
                    primary_color: settings.primaryColor,
                    email_signature: settings.emailSignature,
                    allow_patient_registration: settings.allowPatientRegistration,
                    require_email_verification: settings.requireEmailVerification,
                })
                .eq('tenant_id', tenantId)
                .select()
                .single();

            if (error) throw error;
            return this.mapToSettings(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    private getQuotasByPlan(plan: 'free' | 'basic' | 'premium'): { daily: number; monthly: number } {
        const quotas = {
            free: { daily: 5, monthly: 100 },
            basic: { daily: 20, monthly: 500 },
            premium: { daily: 50, monthly: 1000 },
        };
        return quotas[plan];
    }

    async canUseAI(tenantId: string): Promise<boolean> {
        try {
            const usage = await this.getTenantUsage(tenantId);
            const tenant = await this.getNutritionistById(tenantId);

            if (!tenant) return false;

            return (
                usage.aiUsageDaily < tenant.aiQuotaDaily &&
                usage.aiUsageMonthly < tenant.aiQuotaMonthly
            );
        } catch {
            return false;
        }
    }

    private mapToTenant(data: any): Tenant {
        return {
            id: data.id,
            nutritionistId: data.nutritionist_id,
            businessName: data.business_name,
            status: data.status,
            plan: data.plan,
            aiQuotaDaily: data.ai_quota_daily,
            aiQuotaMonthly: data.ai_quota_monthly,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    private mapToSettings(data: any): TenantSettings {
        return {
            tenantId: data.tenant_id,
            logo: data.logo || undefined,
            primaryColor: data.primary_color || undefined,
            emailSignature: data.email_signature || undefined,
            allowPatientRegistration: data.allow_patient_registration,
            requireEmailVerification: data.require_email_verification,
        };
    }
}

export const nutritionistService = new NutritionistService();
