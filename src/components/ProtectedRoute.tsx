import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';
import { authService } from '../services';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
    requireTenant?: boolean;
}

/**
 * Protected route component that checks authentication and role permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    requireTenant = false,
}) => {
    const { user, isAuthenticated, loading } = useAuth();

    // Show nothing while loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Carregando...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h2>
                    <p className="text-slate-500 mb-6">
                        Você não tem permissão para acessar esta página.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // Check if account is active
    if (user.role !== 'admin' && user.status === 'inactive') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Suspenso</h2>
                    <p className="text-slate-500 mb-6">
                        Sua conta está aguardando liberação ou foi suspensa pelo administrador.
                    </p>
                    <button
                        onClick={() => authService.logout()}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Sair da Conta
                    </button>
                </div>
            </div>
        );
    }

    // Check tenant requirement
    if (requireTenant && !user.tenantId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Configuração Incompleta</h2>
                    <p className="text-slate-500 mb-6">
                        Sua conta não está associada a um tenant. Entre em contato com o suporte.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
