export interface Tenant {
    id: string;
    nutritionistId: string;
    businessName: string;
    status: 'active' | 'inactive' | 'suspended';
    plan: 'free' | 'basic' | 'premium';
    aiQuotaDaily: number;
    aiQuotaMonthly: number;
    createdAt: string;
    updatedAt: string;
}

export interface TenantSettings {
    tenantId: string;
    logo?: string;
    primaryColor?: string;
    emailSignature?: string;
    allowPatientRegistration: boolean;
    requireEmailVerification: boolean;
}

export interface TenantUsage {
    tenantId: string;
    aiUsageDaily: number;
    aiUsageMonthly: number;
    patientsCount: number;
    lastResetDate: string;
}
