-- =====================================================
-- ADMIN AUDIT LOGS SYSTEM
-- =====================================================
-- This creates a comprehensive audit logging system
-- to track all admin actions for security and debugging
-- =====================================================

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON admin_audit_logs(resource_type);

-- 3. Enable Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON admin_audit_logs;

-- 5. Allow admins to view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. Allow system to insert audit logs (any authenticated user can log their own actions)
CREATE POLICY "System can insert audit logs"
ON admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- =====================================================
-- HELPER FUNCTION: Log Admin Action
-- =====================================================
-- This function can be called from the frontend or backend
-- to log admin actions consistently

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    admin_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    v_admin_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================
-- From SQL:
-- SELECT log_admin_action('UPDATE', 'cms_config', 'hero', '{"field": "title", "old": "Old Title", "new": "New Title"}'::jsonb);

-- From TypeScript:
-- await supabase.rpc('log_admin_action', {
--   p_action: 'DELETE',
--   p_resource_type: 'coupon',
--   p_resource_id: couponId,
--   p_details: { code: 'SUMMER50', discount: 50 }
-- });

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- View recent logs:
-- SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 20;

-- View logs by admin:
-- SELECT * FROM admin_audit_logs WHERE admin_email = 'admin@example.com';

-- View logs by action:
-- SELECT * FROM admin_audit_logs WHERE action = 'DELETE';

-- View logs by resource type:
-- SELECT * FROM admin_audit_logs WHERE resource_type = 'user';
