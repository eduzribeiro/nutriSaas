import { supabase, handleSupabaseError } from '../lib/supabase';
import { saveAs } from 'file-saver';
export const backupService = {
    exportData: async (tenantId: string) => {
        try {
            const { data, error } = await (supabase as any).rpc('admin_export_tenant_data', {
                p_tenant_id: tenantId
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Create downloadable file
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const dateStr = new Date().toISOString().split('T')[0];

            saveAs(blob, `NutriSaaS-Backup_${dateStr}.json`);

            return true;
        } catch (error: any) {
            console.error('Backup Export Error:', error);
            throw new Error(error.message || 'Falha ao exportar backup');
        }
    },

    importData: async (tenantId: string, payload: any) => {
        try {
            if (!payload || typeof payload !== 'object') {
                throw new Error('Formato de arquivo inválido. Selecione um arquivo de backup do NutriSaaS.');
            }

            if (payload.tenant_id && payload.tenant_id !== tenantId) {
                throw new Error('Este backup pertence a outro consultório/nutricionista.');
            }

            // Realiza upsert (Insert/Update) sequencial para manter integridade referencial
            if (payload.patients && payload.patients.length > 0) {
                const { error } = await supabase.from('patients').upsert(payload.patients);
                if (error) console.error('Erro ao importar pacientes', error);
            }
            if (payload.patient_measurements && payload.patient_measurements.length > 0) {
                const { error } = await supabase.from('patient_measurements').upsert(payload.patient_measurements);
                if (error) console.error('Erro ao importar avaliações', error);
            }
            if (payload.patient_history && payload.patient_history.length > 0) {
                const { error } = await supabase.from('patient_history').upsert(payload.patient_history);
                if (error) console.error('Erro ao importar histórico', error);
            }
            if (payload.meal_plans && payload.meal_plans.length > 0) {
                const { error } = await supabase.from('meal_plans').upsert(payload.meal_plans);
                if (error) console.error('Erro ao importar planos', error);
            }
            if (payload.prescriptions && payload.prescriptions.length > 0) {
                const { error } = await supabase.from('prescriptions').upsert(payload.prescriptions);
                if (error) console.error('Erro ao importar prescrições', error);
            }

            return true;
        } catch (error: any) {
            console.error('Backup Import Error:', error);
            throw new Error(error.message || 'Falha ao importar backup');
        }
    }
};
