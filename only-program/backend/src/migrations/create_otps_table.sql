-- Create temp_otps table for custom auth flow
CREATE TABLE IF NOT EXISTS public.temp_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    usage TEXT NOT NULL, -- 'register', 'login', 'reset'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_temp_otps_email_code ON public.temp_otps(email, code);

-- RLS Policies (Only accessible via service role by default, but let's be explicit)
ALTER TABLE public.temp_otps ENABLE ROW LEVEL SECURITY;

-- No public access
DROP POLICY IF EXISTS "No public access" ON public.temp_otps;
CREATE POLICY "No public access" ON public.temp_otps FOR ALL USING (false);
