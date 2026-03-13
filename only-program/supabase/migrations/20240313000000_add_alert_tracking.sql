-- Add granular alert tracking columns for smart_links table
ALTER TABLE public.smart_links
ADD COLUMN IF NOT EXISTS alert_5d_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_3d_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_1d_sent BOOLEAN DEFAULT false;

-- Reset existing single-alert tracking logic if we want to ensure clean state
-- We can leave expiry_alert_sent for legacy or drop it, but leaving it is safer for now.
