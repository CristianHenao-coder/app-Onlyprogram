-- SOLUCIÓN PERMISOS ADMIN
-- Este script soluciona el error P0001 redefiniendo la función de validación para permitir cambios a los administradores/postgres.

-- 1. Modificar la función check_profile_updates para permitir cambios a superusuarios (postgres)
CREATE OR REPLACE FUNCTION public.check_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir cualquier cambio si es el rol de servicio o el usuario postgres (SQL Editor)
  IF current_user IN ('postgres', 'supabase_admin') OR current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Lógica de seguridad para usuarios normales (desde la UI)
  -- No permitir que un usuario se cambie su propio rol o plan
  IF (NEW.role IS DISTINCT FROM OLD.role) 
     OR (NEW.plan_type IS DISTINCT FROM OLD.plan_type) 
     OR (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) THEN
      RAISE EXCEPTION 'No tienes permiso para cambiar tu rol, tipo de plan o estado de suspensión.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar el usuario a ADMIN (Reemplaza el ID si es necesario)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '1e8da830-3b31-47ce-91c2-ea1e41701be0';

-- 3. Asegurar funcion auxiliar is_admin (útil para políticas)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Actualizar políticas de seguridad para Admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = id  -- Ver su propio perfil
  OR 
  public.is_admin() -- O si es admin, ver todos
);

-- 5. Verificar resultado
SELECT id, full_name, role FROM public.profiles WHERE id = '1e8da830-3b31-47ce-91c2-ea1e41701be0';
