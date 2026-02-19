-- Add custom_domain column to smart_links table
ALTER TABLE smart_links 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add index for faster lookup by domain
CREATE INDEX IF NOT EXISTS idx_smart_links_custom_domain ON smart_links(custom_domain);

-- Comment to explain column usage
COMMENT ON COLUMN smart_links.custom_domain IS 'Custom domain associated with this link (e.g. mybrand.com)';
