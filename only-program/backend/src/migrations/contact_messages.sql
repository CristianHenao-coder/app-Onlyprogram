-- Tabla para mensajes del formulario de contacto del landing
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  contacted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);

-- RLS: Solo el service role puede acceder (el backend usa service role key)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Sin políticas RLS para usuarios normales — solo el backend con service role puede leer/escribir
