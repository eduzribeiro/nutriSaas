-- 3. FIX ADMIN PERMISSIONS
-- Ensure Admins can view ALL data across ALL tables
-- This is critical for the Dashboard to function correctly.

-- Enable RLS on core tables (just to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Allow Admins to SELECT from ALL critical tables
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all tenants" ON tenants
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all patients" ON patients
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all ai_usage" ON ai_usage
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Also allow Nutris to see their own patients' usage (if not already covered)
CREATE POLICY "Nutris can view their usage" ON ai_usage
FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
  )
);

-- Allow Patients to see their own usage
CREATE POLICY "Patients can view own usage" ON ai_usage
FOR SELECT TO authenticated
USING (user_id = auth.uid());
