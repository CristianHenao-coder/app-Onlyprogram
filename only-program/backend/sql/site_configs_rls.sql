-- ============================================================
-- site_configs: tabla de configuraciones del sitio
-- Permite al admin modificar precios y ajustes globales
-- ============================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.site_configs (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "public_read_site_configs"   ON public.site_configs;
DROP POLICY IF EXISTS "admin_write_site_configs"   ON public.site_configs;
DROP POLICY IF EXISTS "admin_insert_site_configs"  ON public.site_configs;
DROP POLICY IF EXISTS "admin_update_site_configs"  ON public.site_configs;

-- ① Lectura pública: cualquier persona puede leer configuraciones
CREATE POLICY "public_read_site_configs"
  ON public.site_configs
  FOR SELECT
  USING (true);

-- ② Escritura solo admin (INSERT, UPDATE, DELETE)
--    Verifica rol 'admin' en la tabla profiles
CREATE POLICY "admin_write_site_configs"
  ON public.site_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Insertar configuración de precios por defecto si no existe
INSERT INTO public.site_configs (key, value)
VALUES (
  'product_pricing',
  '{
    "currency": "USD",
    "link": {
      "standard": 2.99,
      "rotator": 5.99,
      "telegramAddon": 5.00
    },
    "domain": {
      "connect": 54.99,
      "buy": 74.99
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
