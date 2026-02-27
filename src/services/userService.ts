import { AuthUser, UserProfile } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<AuthUser | null> {
        try {
            const { data: profile, error } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            if (!profile) return null;

            return {
                id: profile.id,
                email: profile.email,
                role: profile.role || 'patient',
                tenantId: profile.tenant_id,
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
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const { data: profile, error } = await (supabase
                .from('profiles') as any)
                .update({
                    name: updates.name,
                    phone: updates.phone,
                    avatar: updates.avatar,
                    crn: updates.crn,
                    nutri_code: updates.nutriCode,
                    nutri_id: (updates as any).linkedNutriId // Legacy support if needed
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            if (!profile) throw new Error('Falha ao atualizar perfil');

            return {
                userId: profile.id,
                name: profile.name,
                phone: profile.phone || undefined,
                avatar: profile.avatar || undefined,
                crn: profile.crn || undefined,
                nutriCode: profile.nutri_code || undefined,
                linkedNutriId: profile.linked_nutri_id || undefined,
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get users by tenant
     */
    async getUsersByTenant(tenantId: string): Promise<AuthUser[]> {
        try {
            const { data: profiles, error } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('tenant_id', tenantId);

            if (error) throw error;

            return (profiles || []).map((profile: any) => ({
                id: profile.id,
                email: profile.email,
                role: profile.role || 'patient',
                tenantId: profile.tenant_id,
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
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Search users (admin only)
     */
    async searchUsers(query: string, role?: string): Promise<AuthUser[]> {
        try {
            let supabaseQuery = (supabase
                .from('profiles') as any)
                .select('*')
                .or(`name.ilike.%${query}%,email.ilike.%${query}%`);

            if (role) {
                supabaseQuery = supabaseQuery.eq('role', role);
            }

            const { data: profiles, error } = await supabaseQuery;

            if (error) throw error;

            return (profiles || []).map((profile: any) => ({
                id: profile.id,
                email: profile.email,
                role: profile.role || 'patient',
                tenantId: profile.tenant_id,
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
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Delete user (admin only)
     */
    async deleteUser(userId: string): Promise<void> {
        try {
            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) throw error;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Upload user avatar using Supabase Storage
     */
    async uploadAvatar(userId: string, file: File): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('nutrisaas-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('nutrisaas-assets')
                .getPublicUrl(filePath);

            await this.updateUserProfile(userId, { avatar: publicUrl });

            return publicUrl;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }
}

export const userService = new UserService();
