-- ============================================
-- NUTRISAAS - ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Data Isolation
-- ============================================

-- ============================================
-- 1. PROFILES TABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin can see all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can see their own profile and their patients' profiles
CREATE POLICY "Nutritionists can view own and patients profiles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'nutritionist'
      ) AND
      tenant_id = auth.uid()
    )
  );

-- Patients can only see their own profile
CREATE POLICY "Patients can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- 2. TENANTS TABLE RLS
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Admins can see all tenants
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can see their own tenant
CREATE POLICY "Nutritionists can view own tenant"
  ON tenants FOR SELECT
  USING (nutritionist_id = auth.uid());

-- Admins can update all tenants
CREATE POLICY "Admins can update all tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can update their own tenant
CREATE POLICY "Nutritionists can update own tenant"
  ON tenants FOR UPDATE
  USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

-- Admins can insert tenants
CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete tenants
CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. TENANT SETTINGS TABLE RLS
-- ============================================
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all tenant settings
CREATE POLICY "Admins can view all tenant settings"
  ON tenant_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view their own tenant settings
CREATE POLICY "Nutritionists can view own tenant settings"
  ON tenant_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can update their own tenant settings
CREATE POLICY "Nutritionists can update own tenant settings"
  ON tenant_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- ============================================
-- 4. PATIENTS TABLE RLS
-- ============================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Admins can view all patients
CREATE POLICY "Admins can view all patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view their own patients
CREATE POLICY "Nutritionists can view own patients"
  ON patients FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own data
CREATE POLICY "Patients can view own data"
  ON patients FOR SELECT
  USING (user_id = auth.uid());

-- Nutritionists can insert patients
CREATE POLICY "Nutritionists can insert patients"
  ON patients FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can update their own patients
CREATE POLICY "Nutritionists can update own patients"
  ON patients FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can delete their own patients
CREATE POLICY "Nutritionists can delete own patients"
  ON patients FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- ============================================
-- 5. PATIENT MEASUREMENTS TABLE RLS
-- ============================================
ALTER TABLE patient_measurements ENABLE ROW LEVEL SECURITY;

-- Admins can view all measurements
CREATE POLICY "Admins can view all measurements"
  ON patient_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view measurements of their patients
CREATE POLICY "Nutritionists can view own patients measurements"
  ON patient_measurements FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own measurements
CREATE POLICY "Patients can view own measurements"
  ON patient_measurements FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Nutritionists can insert measurements
CREATE POLICY "Nutritionists can insert measurements"
  ON patient_measurements FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can insert their own measurements
CREATE POLICY "Patients can insert own measurements"
  ON patient_measurements FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. PATIENT HISTORY TABLE RLS
-- ============================================
ALTER TABLE patient_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all history
CREATE POLICY "Admins can view all history"
  ON patient_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view history of their patients
CREATE POLICY "Nutritionists can view own patients history"
  ON patient_history FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own history
CREATE POLICY "Patients can view own history"
  ON patient_history FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Nutritionists can insert history
CREATE POLICY "Nutritionists can insert history"
  ON patient_history FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- ============================================
-- 7. MEAL PLANS TABLE RLS
-- ============================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Admins can view all meal plans
CREATE POLICY "Admins can view all meal plans"
  ON meal_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view their own meal plans
CREATE POLICY "Nutritionists can view own meal plans"
  ON meal_plans FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own meal plans
CREATE POLICY "Patients can view own meal plans"
  ON meal_plans FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Nutritionists can insert meal plans
CREATE POLICY "Nutritionists can insert meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can update their own meal plans
CREATE POLICY "Nutritionists can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can delete their own meal plans
CREATE POLICY "Nutritionists can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- ============================================
-- 8. MEAL PLAN TEMPLATES TABLE RLS
-- ============================================
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

-- Nutritionists can view their own templates
CREATE POLICY "Nutritionists can view own templates"
  ON meal_plan_templates FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can insert templates
CREATE POLICY "Nutritionists can insert templates"
  ON meal_plan_templates FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can update their own templates
CREATE POLICY "Nutritionists can update own templates"
  ON meal_plan_templates FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Nutritionists can delete their own templates
CREATE POLICY "Nutritionists can delete own templates"
  ON meal_plan_templates FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- ============================================
-- 9. RECIPES TABLE RLS
-- ============================================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Admins can view all recipes
CREATE POLICY "Admins can view all recipes"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view their own recipes
CREATE POLICY "Nutritionists can view own recipes"
  ON recipes FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own recipes or generic recipes from their tenant
CREATE POLICY "Patients can view own or tenant recipes"
  ON recipes FOR SELECT
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR
    (tenant_id = get_user_tenant_id() AND patient_id IS NULL)
  );

-- Nutritionists can insert recipes
CREATE POLICY "Nutritionists can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can insert their own recipes
CREATE POLICY "Patients can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 10. AI USAGE TABLE RLS
-- ============================================
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Admins can view all AI usage
CREATE POLICY "Admins can view all ai usage"
  ON ai_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nutritionists can view their tenant's AI usage
CREATE POLICY "Nutritionists can view own tenant ai usage"
  ON ai_usage FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can view their own AI usage
CREATE POLICY "Patients can view own ai usage"
  ON ai_usage FOR SELECT
  USING (user_id = auth.uid());

-- Nutritionists can insert AI usage for their tenant
CREATE POLICY "Nutritionists can insert ai usage"
  ON ai_usage FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

-- Patients can insert their own AI usage
CREATE POLICY "Patients can insert own ai usage"
  ON ai_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access tenant
CREATE OR REPLACE FUNCTION can_access_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    is_admin() OR
    get_user_tenant_id() = check_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
