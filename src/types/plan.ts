export interface MealPlan {
    id: string;
    tenantId: string;
    patientId: string;
    title: string;
    content: string;
    generatedBy: 'ai' | 'template' | 'manual';
    status: 'draft' | 'active' | 'archived';
    createdBy: string; // User ID of nutritionist
    createdAt: string;
    updatedAt: string;
    is_released?: boolean;
}

export interface MealPlanTemplate {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    content: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Recipe {
    id: string;
    tenantId: string | null; // null for global recipes
    patientId: string | null; // null for nutritionist recipes
    title: string;
    ingredients: string[];
    instructions: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    generatedByAI: boolean;
    createdAt: string;
}
