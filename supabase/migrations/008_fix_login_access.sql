-- 008_FIX_LOGIN_ACCESS.SQL
-- CRITICAL FIX: Restores access for all users by allowing them to read their own profile.
-- Previous polices might have caused a lockout by preventing the initial "Who am I?" check.

-- 1. Allow EVERY authenticated user to read their OWN profile
-- This enables the application to load the user's role and name upon login.
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 2. Update Admin Policy to be safer
-- We keep the admin check, but now it works because the policy above allows reading the own profile to check the role.
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (
  -- Trust JWT metadata first (fastest)
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  -- Or check DB, which is now allowed by the policy above
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
