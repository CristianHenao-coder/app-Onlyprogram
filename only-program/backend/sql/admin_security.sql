-- Create table for storing security verification codes
CREATE TABLE IF NOT EXISTS admin_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_id UUID,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view their own codes" 
    ON admin_verification_codes
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = admin_id);

CREATE POLICY "Service role has full access" 
    ON admin_verification_codes
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);
