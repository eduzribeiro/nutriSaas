-- 010_FIX_RECURSIVE_RLS.SQL
-- CRITICAL FIX for 500 ERROR (Infinite Recursion)
-- Previous policies on 'profiles' were causing infinite loops because they tried to SELECT from profiles
-- to check if the user is an admin, which triggered the policy again, ad infinitum.

-- 1. Create a SECURITY DEFINER function to bypass RLS when checking roles
-- This breaks the recursion loop. The function runs with owner privileges.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;
DROP POLICY IF EXISTS "Admins can view all ai_usage" ON ai_usage;

-- 3. Recreate policies using the safe function (or JWT)
-- Profiles: Users see own profile OR Admin sees all
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR 
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  (get_my_role() = 'admin')
);

-- Tenants: Admins see all, Authenticated see basic info (already fixed in 009 but reinforcing)
-- We keep the 009 policy "Authenticated users can view tenants" as it's simpler and covers everyone.

-- Patients: Users see own (via tenant/id) OR Admin sees all
CREATE POLICY "Admins can view all patients" ON patients
FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  (get_my_role() = 'admin')
);

-- AI Usage: Users see own OR Admin sees all
CREATE POLICY "Admins can view all ai_usage" ON ai_usage
FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  (get_my_role() = 'admin')
);
