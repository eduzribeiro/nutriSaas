-- ============================================
-- 006_FIX_USAGE_AND_LINKAGE_V2.SQL
-- Fixes real-time usage tracking and patient linkage
-- CORRECTION: Handles dropping as VIEW instead of MATERIALIZED VIEW
-- ============================================

-- 1. DROP VIEW (Using CASCADE to remove any dependents)
-- The previous error indicated it is a standard VIEW, so we use DROP VIEW.
DROP VIEW IF EXISTS tenant_usage_summary CASCADE;
-- Just in case it WAS materialized in another environment, we can optionally try this, 
-- but SQL script might fail if we try both. We stick to the error hint.

-- 2. CREATE REAL-TIME VIEW
CREATE OR REPLACE VIEW tenant_usage_summary AS
SELECT 
  t.id AS tenant_id,
  (SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) AS patients_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM ai_usage ai 
    WHERE ai.tenant_id = t.id 
    AND ai.created_at >= CURRENT_DATE::timestamp
  ), 0) AS ai_usage_daily,
  COALESCE((
    SELECT COUNT(*) 
    FROM ai_usage ai 
    WHERE ai.tenant_id = t.id 
    AND ai.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS ai_usage_monthly,
  (SELECT MAX(created_at) FROM ai_usage WHERE tenant_id = t.id) AS last_ai_usage
FROM tenants t;

-- Grant permissions
GRANT SELECT ON tenant_usage_summary TO authenticated;
GRANT SELECT ON tenant_usage_summary TO service_role;

-- 3. UPDATE PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    name, 
    tenant_id,
    linked_nutri_id,
    nutri_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'nutritionist' THEN NEW.id
      WHEN NEW.raw_user_meta_data->>'role' = 'patient' THEN (NEW.raw_user_meta_data->>'tenant_id')::UUID
      ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'patient' THEN (NEW.raw_user_meta_data->>'linked_nutri_id')::UUID
      ELSE NULL
    END,
    CASE
       WHEN NEW.raw_user_meta_data->>'role' = 'nutritionist' THEN 
         'NUTRI' || floor(random() * 9000 + 1000)::text
       ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
