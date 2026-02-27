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
            if (!payload || !payload.data) {
                throw new Error('Formato de arquivo inválido. Selecione um arquivo de backup do NutriSaaS.');
            }

            if (payload.tenant_id !== tenantId) {
                throw new Error('Este backup pertence a outro consultório/nutricionista.');
            }

            const { data, error } = await (supabase as any).rpc('admin_import_tenant_data', {
                p_tenant_id: tenantId,
                p_payload: payload
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            return true;
        } catch (error: any) {
            console.error('Backup Import Error:', error);
            throw new Error(error.message || 'Falha ao importar backup');
        }
    }
};
