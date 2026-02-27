
import { AuthUser, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

class AuthService {
    public supabase = supabase;

    /**
     * Map database profile to AuthUser
     */
    private mapToAuthUser(profile: any, status: 'active' | 'inactive' = 'active'): AuthUser {
        return {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            tenantId: profile.tenant_id,
            status: status,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            profile: {
                userId: profile.id,
                name: profile.name,
                phone: profile.phone || undefined,
                avatar: profile.avatar || undefined,
                crn: profile.crn || undefined,
                nutriCode: profile.nutri_code || undefined,
                linkedNutriId: profile.linked_nutri_id || undefined,
            },
        };
    }

    /**
     * Login with email and password using Supabase Auth
     */
    async login(email: string, password: string): Promise<AuthUser> {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw new Error('Credenciais inválidas');
            if (!authData.user) throw new Error('Erro ao fazer login');

            return await this.fetchUserProfile(authData.user.id);
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Erro ao fazer login');
        }
    }

    /**
     * Fetch user profile and status
     */
    async fetchUserProfile(userId: string): Promise<AuthUser> {
        // Try fetching with tenant status (for nutritionists/patients)
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*') // Removed automatic join to avoid RLS lookup failure
            .eq('id', userId)
            .single();

        if (error || !profile) {
            console.error('AuthService: Erro ao buscar perfil:', error);
            // If profile is missing but user is logged in, try to create it or handle gracefully
            if (!profile && userId) {
                // Should potentially trigger profile creation here, but for now throw
            }
            throw new Error('Erro ao carregar perfil do usuário.');
        }

        let tenantData = null;
        const p = profile as any;
        // Only fetch tenant if user is a nutritionist or has a tenant_id
        if (p.role === 'nutritionist' || p.tenant_id) {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('status, id')
                .eq('id', p.tenant_id || p.id) // tenant_id for patient, id for nutri
                .single();
            tenantData = tenant;
        }

        // Manually construct the response to match expected format
        const profileWithTenant = {
            ...p,
            tenants: tenantData ? [tenantData] : []
        };

        // Use the manually constructed object instead of the raw query result
        const typedProfile = profileWithTenant as any;

        // Auto-generate nutri_code if missing (healing logic)
        if (typedProfile.role === 'nutritionist' && !typedProfile.nutri_code) {
            const newCode = 'NUTRI' + Math.floor(1000 + Math.random() * 9000);
            const { error: updateError } = await (supabase
                .from('profiles') as any)
                .update({ nutri_code: newCode })
                .eq('id', userId);

            if (!updateError) {
                typedProfile.nutri_code = newCode; // Update local object to reflect change
            }
        }

        // status is usually in the first element of tenants array due to join
        // For admin, tenants might be empty or null
        const tenant = typedProfile.tenants?.[0] || typedProfile.tenants;
        const status = tenant?.status || 'active';

        return this.mapToAuthUser(typedProfile, status);
    }

    /**
     * Register new nutritionist or admin
     */
    async registerUser(email: string, password: string, name: string, role: 'nutritionist' | 'admin' = 'nutritionist'): Promise<AuthUser> {
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: role,
                    },
                },
            });

            if (authError) throw new Error(authError.message);
            if (!authData.user) throw new Error('Erro ao criar conta');

            return await this.fetchUserProfile(authData.user.id);
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Erro ao criar conta');
        }
    }

    /**
     * Legacy method for nutritionist registration
     */
    async registerNutritionist(email: string, password: string, name: string): Promise<AuthUser> {
        return this.registerUser(email, password, name, 'nutritionist');
    }

    /**
     * Register new patient with Supabase Auth
     */
    async register(email: string, password: string, name: string, nutri_code: string): Promise<AuthUser> {
        try {
            // 1. Fetch nutritionist by code using RPC (Bypasses RLS for public access)
            const { data: rpcData, error: rpcError } = await (supabase as any)
                .rpc('get_nutritionist_by_code', { code: nutri_code })
                .single();

            let nutritionist = rpcData;

            // Fallback for direct query (only works if RLS allows public read)
            if (rpcError || !nutritionist) {
                console.warn('RPC lookup failed, trying direct select (might fail due to RLS):', rpcError);
                // Try selecting directly
                const { data: directData, error: directError } = await (supabase
                    .from('profiles') as any)
                    .select('id, tenant_id')
                    .eq('nutri_code', nutri_code)
                    .eq('role', 'nutritionist')
                    .single();

                if (directError || !directData) {
                    throw new Error('Código de nutricionista inválido ou não encontrado.');
                }
                nutritionist = directData;
            }

            // At this point nutritionist is guaranteed to be defined because of the throw above

            // 2. Fetch or verify tenant
            // In the new schema, nutritionist.tenant_id IS the tenant for the nutritionist (their own id usually)
            // But we should double check if a tenant record exists for this nutritionist
            // NOTE: This query might also fail due to RLS if not public. However, we have tenant_id from RPC usually.
            let realTenantId = nutritionist.tenant_id || nutritionist.id;

            // Try to fetch tenant only if we suspect ID might be wrong, but usually RPC gives correct one.
            // Skipping extra query to avoid RLS issues if possible.

            if (!realTenantId) throw new Error('O nutricionista ainda não possui um consultório configurado. Contate o suporte.');

            // 3. Auth SignUp with Metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'patient',
                        tenant_id: realTenantId,
                        linked_nutri_id: nutritionist.id,
                    },
                },
            });

            if (authError) throw new Error(authError.message);
            if (!authData.user) throw new Error('Erro ao criar conta de autenticação');

            // Link patient securely via RPC (Bypassing RLS)
            const { error: linkError } = await (supabase as any).rpc('link_patient_to_user_rpc', {
                p_user_id: authData.user.id,
                p_email: email,
                p_tenant_id: realTenantId,
                p_name: name
            });

            if (linkError) {
                console.error("Falha ao vincular paciente com o RPC:", linkError);
                throw new Error("Erro interno ao vincular conta de paciente.");
            }

            // FORCE UPDATE PROFILE: Ensure role is patient and tenant is set
            // This fixes the issue where the trigger might default to incorrect role
            await (supabase.from('profiles') as any)
                .update({
                    role: 'patient',
                    tenant_id: realTenantId,
                    linked_nutri_id: nutritionist.id,
                    name: name
                })
                .eq('id', authData.user.id);

            return await this.fetchUserProfile(authData.user.id);
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Erro ao criar conta');
        }
    }

    async logout(): Promise<void> {
        await supabase.auth.signOut();
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            return await this.fetchUserProfile(session.user.id);
        } catch {
            return null;
        }
    }

    async isAuthenticated(): Promise<boolean> {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }

    async updateProfile(updates: Partial<UserProfile>): Promise<AuthUser> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');

            const { error } = await (supabase
                .from('profiles') as any)
                .update({
                    name: updates.name,
                    phone: updates.phone,
                    avatar: updates.avatar,
                    crn: updates.crn,
                    nutri_code: updates.nutriCode,
                })
                .eq('id', user.id);

            if (error) throw new Error('Erro ao atualizar perfil');

            return await this.fetchUserProfile(user.id);
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao atualizar perfil');
        }
    }

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error('Erro ao enviar e-mail de recuperação');
    }

    async changePassword(newPassword: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error('Erro ao alterar senha');
    }

    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const user = await this.getCurrentUser();
                callback(user);
            } else {
                callback(null);
            }
        });
    }
}

export const authService = new AuthService();
