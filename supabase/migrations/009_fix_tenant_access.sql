-- 009_FIX_TENANT_ACCESS.SQL
-- CRITICAL FIX: Allow all authenticated users to read tenants table.
-- The authService tries to join profiles with tenants. If a user cannot read tenants,
-- the entire query fails, blocking login.

-- 1. Grant SELECT on tenants to authenticated users
GRANT SELECT ON tenants TO authenticated;

-- 2. Create RLS Policy for tenants
-- Allow reading basic tenant info (needed for status checks and linking)
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;
CREATE POLICY "Authenticated users can view tenants" ON tenants
FOR SELECT TO authenticated
USING (true); 
-- Note: 'true' is safe here because tenants table contains public info like status/id.
-- Sensitive detailed data should be in a separate table if needed, or RLS can be tighter later.
-- For now, blocking read access to tenants breaks the app.
