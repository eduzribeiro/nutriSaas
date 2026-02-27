import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authService } from '../services';

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (email: string, password: string, name: string, nutriCode: string) => Promise<AuthUser>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<AuthUser['profile']>) => Promise<void>;
    isAuthenticated: boolean;
    hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from Supabase session on mount
    useEffect(() => {
        let isMounted = true;

        const loadUser = async () => {
            console.log('AuthProvider: [1] Verificando sessão (getSession)...');
            try {
                // First get the raw session from Auth
                const { data: { session }, error: sessionError } = await authService.supabase.auth.getSession();

                if (sessionError) {
                    console.error('AuthProvider: [ERRO] Falha ao obter sessão:', sessionError);
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                    return;
                }

                if (!session) {
                    console.log('AuthProvider: [2] Nenhuma sessão ativa encontrada.');
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                    return;
                }

                console.log('AuthProvider: [3] Sessão encontrada para:', session.user.email);
                console.log('AuthProvider: [4] Buscando perfil na tabela profiles...');

                // Add a timeout for the profile fetch so we don't hang forever
                const profilePromise = authService.getCurrentUser();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout ao buscar perfil (10s)')), 10000)
                );

                const currentUser = await Promise.race([profilePromise, timeoutPromise]) as AuthUser | null;

                if (isMounted) {
                    console.log('AuthProvider: [5] Perfil carregado com sucesso:', currentUser?.email || 'Nenhum');
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('AuthProvider: [ERRO] Erro crítico no loadUser:', error);
                if (isMounted) setUser(null);
            } finally {
                if (isMounted) {
                    console.log('AuthProvider: [6] Finalizando estado de loading.');
                    setLoading(false);
                }
            }
        };

        loadUser();

        // Listen to auth state changes
        console.log('AuthProvider: Registrando listener onAuthStateChange...');
        const { data: { subscription } } = authService.onAuthStateChange((user) => {
            console.log('AuthProvider: Evento de Auth detectado p/:', user?.email || 'Nenhum');
            if (isMounted) {
                setUser(user);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const loggedInUser = await authService.login(email, password);
            setUser(loggedInUser);
            setLoading(false);
            return loggedInUser;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string, nutriCode: string) => {
        setLoading(true);
        try {
            const registeredUser = await authService.register(email, password, name, nutriCode);
            setUser(registeredUser);
            setLoading(false);
            return registeredUser;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<AuthUser['profile']>) => {
        if (!user) {
            throw new Error('No user logged in');
        }

        try {
            const updatedUser = await authService.updateProfile(updates);
            setUser(updatedUser);
        } catch (error) {
            throw error;
        }
    };

    const hasRole = (role: string | string[]): boolean => {
        if (!user) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(user.role);
    };

    const value: AuthContextValue = {
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: user !== null,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
