-- ============================================
-- NUTRISAAS - FIX REGISTRATION FLOW
-- Allow public access to verify nutritionist code
-- ============================================

-- Function to get nutritionist details by code (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_nutritionist_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Use privileges of the function creator (postgres), effectively bypassing RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.name
  FROM profiles p
  WHERE p.nutri_code = code
  AND p.role = 'nutritionist'
  LIMIT 1;
END;
$$;

-- Grant execution permission to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION get_nutritionist_by_code(TEXT) TO anon, authenticated, service_role;
