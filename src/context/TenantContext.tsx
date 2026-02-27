import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantSettings, TenantUsage } from '../types';
import { nutritionistService } from '../services';
import { useAuth } from './AuthContext';

interface TenantContextValue {
    tenant: Tenant | null;
    tenantSettings: TenantSettings | null;
    tenantUsage: TenantUsage | null;
    loading: boolean;
    refreshTenant: () => Promise<void>;
    refreshUsage: () => Promise<void>;
    updateSettings: (settings: Partial<TenantSettings>) => Promise<void>;
    canUseAI: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
    children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
    const [tenantUsage, setTenantUsage] = useState<TenantUsage | null>(null);
    const [loading, setLoading] = useState(false);

    // Load tenant data when user changes
    useEffect(() => {
        if (isAuthenticated && user?.tenantId) {
            loadTenantData(user.tenantId);
        } else {
            setTenant(null);
            setTenantSettings(null);
            setTenantUsage(null);
        }
    }, [isAuthenticated, user?.tenantId]);

    const loadTenantData = async (tenantId: string) => {
        setLoading(true);
        try {
            const [tenantData, settings, usage] = await Promise.all([
                nutritionistService.getNutritionistById(tenantId),
                nutritionistService.getTenantSettings(tenantId),
                nutritionistService.getTenantUsage(tenantId),
            ]);

            setTenant(tenantData);
            setTenantSettings(settings);
            setTenantUsage(usage);
        } catch (error) {
            console.error('Error loading tenant data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshTenant = async () => {
        if (!user?.tenantId) return;

        try {
            const tenantData = await nutritionistService.getNutritionistById(user.tenantId);
            setTenant(tenantData);
        } catch (error) {
            console.error('Error refreshing tenant:', error);
        }
    };

    const refreshUsage = async () => {
        if (!user?.tenantId) return;

        try {
            const usage = await nutritionistService.getTenantUsage(user.tenantId);
            setTenantUsage(usage);
        } catch (error) {
            console.error('Error refreshing usage:', error);
        }
    };

    const updateSettings = async (settings: Partial<TenantSettings>) => {
        if (!user?.tenantId) {
            throw new Error('No tenant ID');
        }

        try {
            const updated = await nutritionistService.updateTenantSettings(user.tenantId, settings);
            setTenantSettings(updated);
        } catch (error) {
            throw error;
        }
    };

    // Check if tenant can use AI based on quotas
    const canUseAI = React.useMemo(() => {
        if (!tenant || !tenantUsage) return false;

        return (
            tenantUsage.aiUsageDaily < tenant.aiQuotaDaily &&
            tenantUsage.aiUsageMonthly < tenant.aiQuotaMonthly
        );
    }, [tenant, tenantUsage]);

    const value: TenantContextValue = {
        tenant,
        tenantSettings,
        tenantUsage,
        loading,
        refreshTenant,
        refreshUsage,
        updateSettings,
        canUseAI,
    };

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextValue => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
