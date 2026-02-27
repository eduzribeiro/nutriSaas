
import { supabase } from '../lib/supabase';

export interface PlatformStats {
    totalNutritionists: number;
    totalPatients: number;
    totalAIUsage: number;
    growthRate: string;
}

export interface Activity {
    text: string;
    time: string;
}

export interface NutriDetail {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    nutriCode: string;
    status: string;
    patientsCount: number;
}

export interface IAUsageRecord {
    name: string;
    type: string;
    daily: number;
    monthly: number;
}

export interface GeneralSettings {
    platform_name: string;
    support_email: string;
    allow_new_registrations: boolean;
}

export interface IAQuotas {
    nutri_daily_limit: number;
    patient_monthly_limit: number;
}

class AdminService {
    /**
     * Get real stats for the admin dashboard
     */
    async getPlatformStats(): Promise<PlatformStats> {
        const [nutris, patients, aiUsage] = await Promise.all([
            supabase.from('tenants').select('*', { count: 'exact', head: true }),
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('ai_usage').select('*', { count: 'exact', head: true }),
        ]);

        return {
            totalNutritionists: nutris.count || 0,
            totalPatients: patients.count || 0,
            totalAIUsage: aiUsage.count || 0,
            growthRate: '+0%',
        };
    }

    /**
     * Get all nutritionists with patient counts
     */
    async getNutritionists(): Promise<NutriDetail[]> {
        try {
            console.log('AdminService: Buscando nutricionistas...');
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    name, 
                    email, 
                    nutri_code,
                    tenants!tenants_nutritionist_id_fkey (id, status)
                `)
                .eq('role', 'nutritionist');

            if (error) {
                console.error('AdminService Error:', error);
                throw error;
            }

            const profiles = data as any[];
            console.log(`AdminService: ${profiles.length} nutricionistas encontrados.`);

            // Fetch patient counts for each tenant
            const nutrisWithCounts = await Promise.all(profiles.map(async (n: any) => {
                // Supabase joins can return an array or object
                const tenantData = Array.isArray(n.tenants) ? n.tenants[0] : n.tenants;
                const tenantId = tenantData?.id;

                let patientsCount = 0;
                if (tenantId) {
                    const { count } = await supabase
                        .from('patients')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenantId);
                    patientsCount = count || 0;
                }

                return {
                    id: n.id,
                    tenantId: tenantId || '',
                    name: n.name,
                    email: n.email,
                    nutriCode: n.nutri_code || '-',
                    status: tenantData?.status || 'inactive',
                    patientsCount
                };
            }));

            return nutrisWithCounts;
        } catch (error) {
            console.error('Falha crítica ao buscar nutricionistas:', error);
            return [];
        }
    }

    /**
     * Get AI usage breakdown
     */
    async getIAUsage(): Promise<IAUsageRecord[]> {
        const { data, error } = await supabase
            .from('ai_usage')
            .select('user_name, user_role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const records = data as any[];

        // Group by user
        const usageMap: Record<string, { role: string, daily: number, monthly: number }> = {};
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        records.forEach(item => {
            if (!usageMap[item.user_name]) {
                usageMap[item.user_name] = { role: item.user_role, daily: 0, monthly: 0 };
            }
            if (item.created_at.startsWith(today)) usageMap[item.user_name].daily++;
            if (item.created_at.startsWith(thisMonth)) usageMap[item.user_name].monthly++;
        });

        return Object.entries(usageMap).map(([name, stats]) => ({
            name,
            type: stats.role === 'nutritionist' ? 'Nutri' : 'Paciente',
            daily: stats.daily,
            monthly: stats.monthly
        }));
    }

    /**
     * Get recent platform activity
     */
    async getRecentActivity(): Promise<Activity[]> {
        const { data } = await supabase
            .from('ai_usage')
            .select('user_name, action, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        const records = data as any[] || [];

        return records.map(item => ({
            text: `${item.user_name} realizou ${item.action}`,
            time: this.formatTimeAgo(item.created_at),
        }));
    }

    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Agora mesmo';
        if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;
        return date.toLocaleDateString();
    }

    /**
     * Get platform settings by key
     */
    async getSettings<T>(key: string): Promise<T | null> {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error(`Error fetching settings for ${key}:`, error);
            return null;
        }
        return (data as any)?.value as T;
    }

    /**
     * Update platform settings and propagate if needed
     */
    async updateSettings(key: string, value: any): Promise<void> {
        const { error } = await supabase
            .from('platform_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() } as any);

        if (error) throw error;

        // AUTO-PROPAGATION: If updating IA quotas, refresh ALL existing tenants immediately
        if (key === 'ia_quotas') {
            const quotas = value as IAQuotas;
            const { error: propError } = await (supabase
                .from('tenants') as any)
                .update({
                    ai_quota_daily: quotas.nutri_daily_limit,
                    ai_quota_monthly: quotas.nutri_daily_limit * 25 // Buffer safety
                })
                .not('id', 'is', null); // Update all records

            if (propError) console.error('Error propagating quotas to tenants:', propError);
        }
    }
}

export const adminService = new AdminService();
