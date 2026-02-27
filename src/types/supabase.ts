// This file is auto-generated from Supabase schema
// To regenerate: npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    role: 'admin' | 'nutritionist' | 'patient'
                    tenant_id: string | null
                    name: string
                    phone: string | null
                    avatar: string | null
                    crn: string | null
                    nutri_code: string | null
                    linked_nutri_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    role: 'admin' | 'nutritionist' | 'patient'
                    tenant_id?: string | null
                    name: string
                    phone?: string | null
                    avatar?: string | null
                    crn?: string | null
                    nutri_code?: string | null
                    linked_nutri_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'admin' | 'nutritionist' | 'patient'
                    tenant_id?: string | null
                    name?: string
                    phone?: string | null
                    avatar?: string | null
                    crn?: string | null
                    nutri_code?: string | null
                    linked_nutri_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tenants: {
                Row: {
                    id: string
                    nutritionist_id: string
                    business_name: string
                    status: 'active' | 'inactive' | 'suspended'
                    plan: 'free' | 'basic' | 'premium'
                    ai_quota_daily: number
                    ai_quota_monthly: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nutritionist_id: string
                    business_name: string
                    status?: 'active' | 'inactive' | 'suspended'
                    plan?: 'free' | 'basic' | 'premium'
                    ai_quota_daily?: number
                    ai_quota_monthly?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nutritionist_id?: string
                    business_name?: string
                    status?: 'active' | 'inactive' | 'suspended'
                    plan?: 'free' | 'basic' | 'premium'
                    ai_quota_daily?: number
                    ai_quota_monthly?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            tenant_settings: {
                Row: {
                    tenant_id: string
                    logo: string | null
                    primary_color: string | null
                    email_signature: string | null
                    allow_patient_registration: boolean
                    require_email_verification: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    tenant_id: string
                    logo?: string | null
                    primary_color?: string | null
                    email_signature?: string | null
                    allow_patient_registration?: boolean
                    require_email_verification?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    tenant_id?: string
                    logo?: string | null
                    primary_color?: string | null
                    email_signature?: string | null
                    allow_patient_registration?: boolean
                    require_email_verification?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            patients: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string | null
                    name: string
                    email: string
                    weight: number | null
                    height: number | null
                    objective: string | null
                    last_consultation: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id?: string | null
                    name: string
                    email: string
                    weight?: number | null
                    height?: number | null
                    objective?: string | null
                    last_consultation?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string | null
                    name?: string
                    email?: string
                    weight?: number | null
                    height?: number | null
                    objective?: string | null
                    last_consultation?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            patient_measurements: {
                Row: {
                    id: string
                    patient_id: string
                    tenant_id: string
                    weight: number
                    body_fat: number | null
                    muscle_mass: number | null
                    waist: number | null
                    hip: number | null
                    notes: string | null
                    measured_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    tenant_id: string
                    weight: number
                    body_fat?: number | null
                    muscle_mass?: number | null
                    waist?: number | null
                    hip?: number | null
                    notes?: string | null
                    measured_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    tenant_id?: string
                    weight?: number
                    body_fat?: number | null
                    muscle_mass?: number | null
                    waist?: number | null
                    hip?: number | null
                    notes?: string | null
                    measured_at?: string
                    created_at?: string
                }
            }
            patient_history: {
                Row: {
                    id: string
                    patient_id: string
                    tenant_id: string
                    type: 'consultation' | 'measurement' | 'plan_created' | 'note'
                    title: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    tenant_id: string
                    type: 'consultation' | 'measurement' | 'plan_created' | 'note'
                    title: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    tenant_id?: string
                    type?: 'consultation' | 'measurement' | 'plan_created' | 'note'
                    title?: string
                    description?: string | null
                    created_at?: string
                }
            }
            meal_plans: {
                Row: {
                    id: string
                    tenant_id: string
                    patient_id: string
                    title: string
                    content: string
                    generated_by: 'ai' | 'template' | 'manual' | null
                    status: 'draft' | 'active' | 'archived'
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    patient_id: string
                    title: string
                    content: string
                    generated_by?: 'ai' | 'template' | 'manual' | null
                    status?: 'draft' | 'active' | 'archived'
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    patient_id?: string
                    title?: string
                    content?: string
                    generated_by?: 'ai' | 'template' | 'manual' | null
                    status?: 'draft' | 'active' | 'archived'
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            meal_plan_templates: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    description: string | null
                    content: string
                    is_default: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    description?: string | null
                    content: string
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    description?: string | null
                    content?: string
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            recipes: {
                Row: {
                    id: string
                    tenant_id: string | null
                    patient_id: string | null
                    title: string
                    ingredients: Json
                    instructions: string
                    calories: number | null
                    protein: number | null
                    carbs: number | null
                    fats: number | null
                    generated_by_ai: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id?: string | null
                    patient_id?: string | null
                    title: string
                    ingredients: Json
                    instructions: string
                    calories?: number | null
                    protein?: number | null
                    carbs?: number | null
                    fats?: number | null
                    generated_by_ai?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string | null
                    patient_id?: string | null
                    title?: string
                    ingredients?: Json
                    instructions?: string
                    calories?: number | null
                    protein?: number | null
                    carbs?: number | null
                    fats?: number | null
                    generated_by_ai?: boolean
                    created_at?: string
                }
            }
            ai_usage: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string
                    user_name: string
                    user_role: 'nutritionist' | 'patient'
                    action: 'meal_plan' | 'recipe' | 'anamnesis' | 'evolution'
                    tokens_used: number
                    cost: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id: string
                    user_name: string
                    user_role: 'nutritionist' | 'patient'
                    action: 'meal_plan' | 'recipe' | 'anamnesis' | 'evolution'
                    tokens_used?: number
                    cost?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string
                    user_name?: string
                    user_role?: 'nutritionist' | 'patient'
                    action?: 'meal_plan' | 'recipe' | 'anamnesis' | 'evolution'
                    tokens_used?: number
                    cost?: number
                    created_at?: string
                }
            }
        }
        Views: {
            tenant_usage_summary: {
                Row: {
                    tenant_id: string
                    patients_count: number
                    ai_usage_daily: number
                    ai_usage_monthly: number
                    last_ai_usage: string | null
                }
            }
        }
        Functions: {
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            get_user_tenant_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            can_access_tenant: {
                Args: { check_tenant_id: string }
                Returns: boolean
            }
            refresh_tenant_usage_summary: {
                Args: Record<PropertyKey, never>
                Returns: void
            }
        }
    }
}
