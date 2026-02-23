-- Transaction to ensure atomic cleanup
BEGIN;

-- 1. Identify and delete duplicates from smart_link_buttons
-- We keep the newest one (highest created_at) for each link/type pair.
-- Only applies to social buttons where the rule is "only one per type".
DELETE FROM smart_link_buttons
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY smart_link_id, type 
                   ORDER BY is_active DESC, created_at DESC, id DESC
               ) as rn
        FROM smart_link_buttons
        WHERE type IN ('instagram', 'tiktok', 'telegram', 'onlyfans')
    ) t
    WHERE rn > 1
);

-- 2. Create a unique index to prevent future duplicates
-- This enforces the "one per type" rule at the database level.
-- Partial index: only applies to specific social types.
CREATE UNIQUE INDEX IF NOT EXISTS unique_social_buttons_idx 
ON smart_link_buttons (smart_link_id, type) 
WHERE (type IN ('instagram', 'tiktok', 'telegram', 'onlyfans'));

-- 3. Synchronize the 'buttons' JSONB field in 'smart_links'
-- This ensures that the redundant JSONB field reflects the deduplicated buttons.
UPDATE smart_links sl
SET buttons = COALESCE(
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', b.id,
                'type', b.type,
                'title', b.title,
                'subtitle', b.subtitle,
                'url', b.url,
                'color', b.color,
                'textColor', b.text_color,
                'font', b.font,
                'borderRadius', b.border_radius,
                'opacity', b.opacity,
                'isActive', b.is_active,
                'order', b.order,
                'rotatorActive', b.rotator_active,
                'rotatorLinks', b.rotator_links
            ) ORDER BY b.order ASC
        )
        FROM smart_link_buttons b
        WHERE b.smart_link_id = sl.id
    ),
    '[]'::jsonb
)
WHERE sl.id IN (SELECT DISTINCT smart_link_id FROM smart_link_buttons);

COMMIT;
