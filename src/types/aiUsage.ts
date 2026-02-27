export interface AIUsageRecord {
    id: string;
    tenantId: string;
    userId: string;
    userName: string;
    userRole: 'nutritionist' | 'patient';
    action: 'meal_plan' | 'recipe' | 'anamnesis' | 'evolution';
    tokensUsed: number;
    cost: number;
    createdAt: string;
}

export interface AIUsageSummary {
    tenantId: string;
    dailyUsage: number;
    monthlyUsage: number;
    dailyQuota: number;
    monthlyQuota: number;
    lastResetDate: string;
}

export interface AIQuotaLimit {
    tenantId: string;
    plan: 'free' | 'basic' | 'premium';
    dailyLimit: number;
    monthlyLimit: number;
    overageAllowed: boolean;
    overageCostPerRequest: number;
}
