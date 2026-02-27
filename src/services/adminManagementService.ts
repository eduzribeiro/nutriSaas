
import { createClient } from '@supabase/supabase-js';

// Cliente especial exclusivo para o admin criar outros usuários sem perder a própria sessão
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false // ESSENCIAL: Evita que o admin seja deslogado
    }
});

class AdminManagementService {
    /**
     * Create a new nutritionist manually from the admin panel
     */
    async createNutritionist(data: { name: string, email: string, password: string }) {
        try {
            // O trigger 'on_auth_user_created' no banco cuidará de:
            // 1. Criar o Perfil como 'nutritionist'
            // 2. Criar o Tenant como 'inactive'
            // 3. Gerar o nutri_code automaticamente
            const { data: result, error } = await adminAuthClient.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        role: 'nutritionist'
                    }
                }
            });

            if (error) throw error;
            return result;
        } catch (error: any) {
            console.error('Error creating nutritionist:', error);
            throw new Error(error.message || 'Erro ao criar nutricionista');
        }
    }
}

export const adminManagementService = new AdminManagementService();
