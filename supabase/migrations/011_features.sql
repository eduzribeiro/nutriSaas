-- ============================================
-- NUTRISAAS - MIGRATION 011
-- Features: Platform Settings and Prescriptions
-- ============================================

-- 1. Create system-wide platform_settings table if not exists
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 2. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Auto-update trigger for prescriptions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_prescriptions_updated_at') THEN
    CREATE TRIGGER update_prescriptions_updated_at 
      BEFORE UPDATE ON prescriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable real-time
DO $$ 
BEGIN
  -- Tenta adicionar a tabela. Se a publication não existir, vai dar falha e não fazemos nada (assumimos manual)
  ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- RLS: platform_settings
DROP POLICY IF EXISTS "Settings visible to all authenticated" ON platform_settings;
CREATE POLICY "Settings visible to all authenticated"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert settings" ON platform_settings;
CREATE POLICY "Admins can insert settings"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update settings" ON platform_settings;
CREATE POLICY "Admins can update settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete settings" ON platform_settings;
CREATE POLICY "Admins can delete settings"
  ON platform_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: prescriptions
DROP POLICY IF EXISTS "Prescriptions visible to admin" ON prescriptions;
CREATE POLICY "Prescriptions visible to admin"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins full access prescriptions" ON prescriptions;
CREATE POLICY "Admins full access prescriptions"
  ON prescriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Nutri can manage their prescriptions" ON prescriptions;
CREATE POLICY "Nutri can manage their prescriptions"
  ON prescriptions FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE nutritionist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patient can view their prescriptions" ON prescriptions;
CREATE POLICY "Patient can view their prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );
