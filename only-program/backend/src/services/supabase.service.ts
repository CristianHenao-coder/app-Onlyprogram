import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

// Cliente con privilegios de administrador (service_role)
// Úsalo solo en el backend para operaciones privilegiadas
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cliente anónimo (opcional, si necesitas simular acceso público)
export const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
