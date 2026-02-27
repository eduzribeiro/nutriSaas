-- ============================================
-- NUTRISAAS - INITIAL SCHEMA
-- Multi-Tenant SaaS Architecture
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Extends auth.users with application-specific data
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'nutritionist', 'patient')),
  tenant_id UUID, -- null for admin, own id for nutritionist, nutritionist id for patient
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  crn TEXT, -- For nutritionists
  nutri_code TEXT UNIQUE, -- For nutritionists - used for patient registration
  linked_nutri_id UUID, -- For patients - reference to their nutritionist
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_profiles_nutri_code ON profiles(nutri_code) WHERE nutri_code IS NOT NULL;
CREATE INDEX idx_profiles_linked_nutri_id ON profiles(linked_nutri_id) WHERE linked_nutri_id IS NOT NULL;

-- ============================================
-- 2. TENANTS TABLE
-- Each nutritionist is a tenant
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  ai_quota_daily INTEGER DEFAULT 5,
  ai_quota_monthly INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_tenants_nutritionist_id ON tenants(nutritionist_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================
-- 3. TENANT SETTINGS TABLE
-- ============================================
CREATE TABLE tenant_settings (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE PRIMARY KEY,
  logo TEXT,
  primary_color TEXT,
  email_signature TEXT,
  allow_patient_registration BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PATIENTS TABLE
-- Multi-tenant: patients belong to a tenant
-- ============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  objective TEXT,
  last_consultation DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for multi-tenant queries
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_email ON patients(email);

-- ============================================
-- 5. PATIENT MEASUREMENTS TABLE
-- ============================================
CREATE TABLE patient_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  body_fat DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  waist DECIMAL(5,2),
  hip DECIMAL(5,2),
  notes TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patient_measurements_patient_id ON patient_measurements(patient_id);
CREATE INDEX idx_patient_measurements_tenant_id ON patient_measurements(tenant_id);
CREATE INDEX idx_patient_measurements_measured_at ON patient_measurements(measured_at DESC);

-- ============================================
-- 6. PATIENT HISTORY TABLE
-- ============================================
CREATE TABLE patient_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'measurement', 'plan_created', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patient_history_patient_id ON patient_history(patient_id);
CREATE INDEX idx_patient_history_tenant_id ON patient_history(tenant_id);
CREATE INDEX idx_patient_history_created_at ON patient_history(created_at DESC);

-- ============================================
-- 7. MEAL PLANS TABLE
-- ============================================
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_by TEXT CHECK (generated_by IN ('ai', 'template', 'manual')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meal_plans_tenant_id ON meal_plans(tenant_id);
CREATE INDEX idx_meal_plans_patient_id ON meal_plans(patient_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);

-- ============================================
-- 8. MEAL PLAN TEMPLATES TABLE
-- ============================================
CREATE TABLE meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meal_plan_templates_tenant_id ON meal_plan_templates(tenant_id);

-- ============================================
-- 9. RECIPES TABLE
-- ============================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  instructions TEXT NOT NULL,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fats DECIMAL(5,2),
  generated_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id);
CREATE INDEX idx_recipes_patient_id ON recipes(patient_id);

-- ============================================
-- 10. AI USAGE TABLE
-- Track AI usage for billing and quota management
-- ============================================
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('nutritionist', 'patient')),
  action TEXT NOT NULL CHECK (action IN ('meal_plan', 'recipe', 'anamnesis', 'evolution')),
  tokens_used INTEGER DEFAULT 1,
  cost DECIMAL(10,4) DEFAULT 0.01,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quota queries
CREATE INDEX idx_ai_usage_tenant_id ON ai_usage(tenant_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);

-- ============================================
-- 11. TENANT USAGE SUMMARY (Materialized View)
-- For fast quota checks
-- ============================================
CREATE MATERIALIZED VIEW tenant_usage_summary AS
SELECT 
  t.id AS tenant_id,
  COUNT(DISTINCT p.id) AS patients_count,
  COALESCE(SUM(CASE 
    WHEN ai.created_at >= CURRENT_DATE THEN 1 
    ELSE 0 
  END), 0) AS ai_usage_daily,
  COALESCE(SUM(CASE 
    WHEN ai.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 
    ELSE 0 
  END), 0) AS ai_usage_monthly,
  MAX(ai.created_at) AS last_ai_usage
FROM tenants t
LEFT JOIN patients p ON p.tenant_id = t.id
LEFT JOIN ai_usage ai ON ai.tenant_id = t.id
GROUP BY t.id;

-- Index on materialized view
CREATE UNIQUE INDEX idx_tenant_usage_summary_tenant_id ON tenant_usage_summary(tenant_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_tenant_usage_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_usage_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_templates_updated_at BEFORE UPDATE ON meal_plan_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'nutritionist' THEN NEW.id
      WHEN NEW.raw_user_meta_data->>'role' = 'patient' THEN (NEW.raw_user_meta_data->>'tenant_id')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Auto-create tenant for nutritionists
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_nutritionist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'nutritionist' THEN
    INSERT INTO public.tenants (nutritionist_id, business_name, plan)
    VALUES (
      NEW.id,
      COALESCE(NEW.name || ' - Consultório', 'Consultório Nutricional'),
      'free'
    );
    
    -- Create default settings
    INSERT INTO public.tenant_settings (tenant_id)
    SELECT id FROM public.tenants WHERE nutritionist_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating tenant
CREATE TRIGGER on_nutritionist_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_nutritionist();

-- ============================================
-- SEED DATA: Create admin user
-- ============================================
-- Note: You need to create the admin user via Supabase Auth first,
-- then update the profile with this SQL:
-- UPDATE profiles SET role = 'admin', tenant_id = NULL WHERE email = 'admin@admin.com';
