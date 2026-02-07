-- ==========================================
-- Link Editor - Adapted Migration for Existing Schema
-- ==========================================

-- 1. Create link_profiles for page-level customization
CREATE TABLE IF NOT EXISTS link_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  smart_link_id UUID REFERENCES smart_links(id) ON DELETE CASCADE,
  
  -- Page Background
  background_type VARCHAR(20) DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color VARCHAR(7) DEFAULT '#0B0B0B',
  background_gradient_start VARCHAR(7),
  background_gradient_end VARCHAR(7),
  background_image_url TEXT,
  background_opacity INTEGER DEFAULT 100 CHECK (background_opacity >= 0 AND background_opacity <= 100),
  
  -- Typography
  font_family VARCHAR(50) DEFAULT 'Inter',
  font_size INTEGER DEFAULT 16 CHECK (font_size >= 12 AND font_size <= 24),
  
  -- Social Links (bottom icons)
  social_links JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend smart_links with new fields
ALTER TABLE smart_links ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT false;
ALTER TABLE smart_links ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]'::jsonb;

-- JSONB structure for smart_links.buttons:
-- [
--   {
--     "id": "btn_uuid",
--     "title": "Marketing artificial",
--     "url": "https://onlyfans.com/...",
--     "type": "custom",
--     "icon_type": "rocket_launch",
--     "icon_url": null,
--     "button_shape": "rounded",
--     "border_width": 1,
--     "shadow_intensity": 0,
--     "button_color": "#1DA1F2",
--     "text_color": "#FFFFFF",
--     "order": 0,
--     "active": true
--   }
-- ]

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_link_profiles_user_id ON link_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_link_profiles_smart_link_id ON link_profiles(smart_link_id);

-- 4. Enable RLS
ALTER TABLE link_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view their own link profile"
  ON link_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own link profile"
  ON link_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own link profile"
  ON link_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own link profile"
  ON link_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_link_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_link_profiles_updated_at
  BEFORE UPDATE ON link_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_link_profiles_updated_at();

-- 7. Storage bucket (create manually in Supabase Dashboard)
-- Bucket name: link-assets
-- Public: Yes
-- File size limit: 5MB

COMMENT ON TABLE link_profiles IS 'Page-level customization for smart links (backgrounds, typography)';
COMMENT ON COLUMN smart_links.verified_badge IS 'Shows verified checkmark next to profile name';
COMMENT ON COLUMN smart_links.buttons IS 'Array of button configurations in JSONB format';
