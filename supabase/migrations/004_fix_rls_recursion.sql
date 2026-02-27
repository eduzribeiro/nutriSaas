-- ============================================
-- NUTRISAAS - FIX RLS RECURSION
-- Fixing infinite recursion in profiles and other tables
-- ============================================

-- 1. REDEFINE HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- These functions run with the privileges of the creator (bypass RLS)
-- ensuring they don't cause recursion when checking roles.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_nutritionist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'nutritionist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. FIX PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Nutritionists can view own and patients profiles" ON profiles;
DROP POLICY IF EXISTS "Patients can view own profile" ON profiles;

-- Everyone can view their own profile (this is safe)
CREATE POLICY "Profiles - View own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admins can view everything
CREATE POLICY "Profiles - Admins view all"
  ON profiles FOR SELECT
  USING (is_admin());

-- Nutritionists can view their associated profiles (patients in their tenant)
CREATE POLICY "Profiles - Nutritionists view associated"
  ON profiles FOR SELECT
  USING (
    is_nutritionist() AND tenant_id = auth.uid()
  );


-- 3. FIX TENANTS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can update all tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

CREATE POLICY "Tenants - Admins view all"
  ON tenants FOR SELECT
  USING (is_admin());

CREATE POLICY "Tenants - Admins full access"
  ON tenants FOR ALL
  USING (is_admin());


-- 4. FIX TENANT SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view all tenant settings" ON tenant_settings;

CREATE POLICY "Tenant Settings - Admins view all"
  ON tenant_settings FOR SELECT
  USING (is_admin());

-- 5. FIX PATIENTS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;

CREATE POLICY "Patients - Admins view all"
  ON patients FOR SELECT
  USING (is_admin());

-- 6. FIX OTHER TABLES
DROP POLICY IF EXISTS "Admins can view all measurements" ON patient_measurements;
DROP POLICY IF EXISTS "Admins can view all history" ON patient_history;
DROP POLICY IF EXISTS "Admins can view all meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admins can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Admins can view all ai usage" ON ai_usage;

CREATE POLICY "Measurements - Admins view all" ON patient_measurements FOR SELECT USING (is_admin());
CREATE POLICY "History - Admins view all" ON patient_history FOR SELECT USING (is_admin());
CREATE POLICY "Meal Plans - Admins view all" ON meal_plans FOR SELECT USING (is_admin());
CREATE POLICY "Recipes - Admins view all" ON recipes FOR SELECT USING (is_admin());
CREATE POLICY "AI Usage - Admins view all" ON ai_usage FOR SELECT USING (is_admin());
