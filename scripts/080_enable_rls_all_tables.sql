-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS Y CONFIGURAR POLÍTICAS
-- ============================================================

-- Este script:
-- 1. Habilita RLS en todas las tablas
-- 2. Elimina políticas conflictivas
-- 3. Crea políticas correctas para cada tabla
-- 4. Usa el service role para operaciones desde el backend

-- ============================================================
-- FUNCIÓN HELPER: Obtener tenant_id del usuario actual
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Obtener tenant_id del usuario autenticado
  RETURN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- ============================================================
-- FUNCIÓN HELPER: Verificar si el usuario es administrador
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si el usuario autenticado es admin
  RETURN (
    SELECT COALESCE(is_admin, false)
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- ============================================================
-- TABLA: tenants
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admins pueden ver todos los tenants" ON public.tenants;
DROP POLICY IF EXISTS "Service role puede hacer todo" ON public.tenants;

-- Política para usuarios: solo pueden ver su tenant
CREATE POLICY "Users can view their own tenant"
ON public.tenants
FOR SELECT
USING (
  id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- Política para admins: pueden ver todos los tenants
CREATE POLICY "Admins can view all tenants"
ON public.tenants
FOR ALL
USING (public.is_user_admin() = true);

-- ============================================================
-- TABLA: users
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Los usuarios pueden ver y actualizar su propio perfil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Los admins pueden ver y actualizar todos los usuarios
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.is_user_admin() = true);

CREATE POLICY "Admins can manage all users"
ON public.users
FOR ALL
USING (public.is_user_admin() = true);

-- ============================================================
-- TABLA: configuration_types
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.configuration_types ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can insert configuration types in their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can update configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can delete configuration types of their tenant" ON public.configuration_types;

-- Políticas para configuration_types
CREATE POLICY "Users can view configuration types of their tenant"
ON public.configuration_types
FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

CREATE POLICY "Users can insert configuration types in their tenant"
ON public.configuration_types
FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

CREATE POLICY "Users can update configuration types of their tenant"
ON public.configuration_types
FOR UPDATE
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

CREATE POLICY "Users can delete configuration types of their tenant"
ON public.configuration_types
FOR DELETE
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- ============================================================
-- TABLA: configuration_values
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.configuration_values ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view configuration values of their tenant" ON public.configuration_values;
DROP POLICY IF EXISTS "Users can insert configuration values in their tenant" ON public.configuration_values;
DROP POLICY IF EXISTS "Users can update configuration values of their tenant" ON public.configuration_values;
DROP POLICY IF EXISTS "Users can delete configuration values of their tenant" ON public.configuration_values;

-- Políticas para configuration_values (basadas en el tenant del tipo de configuración)
CREATE POLICY "Users can view configuration values of their tenant"
ON public.configuration_values
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (ct.tenant_id = public.get_current_tenant_id() OR public.is_user_admin() = true)
  )
);

CREATE POLICY "Users can insert configuration values in their tenant"
ON public.configuration_values
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (ct.tenant_id = public.get_current_tenant_id() OR public.is_user_admin() = true)
  )
);

CREATE POLICY "Users can update configuration values of their tenant"
ON public.configuration_values
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (ct.tenant_id = public.get_current_tenant_id() OR public.is_user_admin() = true)
  )
);

CREATE POLICY "Users can delete configuration values of their tenant"
ON public.configuration_values
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (ct.tenant_id = public.get_current_tenant_id() OR public.is_user_admin() = true)
  )
);

-- ============================================================
-- TABLA: configuration_audit_log
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.configuration_audit_log ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view audit log of their tenant" ON public.configuration_audit_log;

-- Políticas para configuration_audit_log (solo lectura)
CREATE POLICY "Users can view audit log of their tenant"
ON public.configuration_audit_log
FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- Los admins pueden ver todo el audit log
CREATE POLICY "Admins can view all audit logs"
ON public.configuration_audit_log
FOR SELECT
USING (public.is_user_admin() = true);

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Ver estado de RLS en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants',
    'users',
    'configuration_types',
    'configuration_values',
    'configuration_audit_log'
  )
ORDER BY tablename;

-- Contar políticas por tabla
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================

/*
IMPORTANTE: Configuración del Backend (Next.js API Routes)

Para que las políticas RLS funcionen correctamente con el backend,
asegúrate de:

1. Usar SUPABASE_SERVICE_ROLE_KEY en el servidor:
   - El service role bypassa RLS por defecto
   - Pero aún respeta las políticas si se configura correctamente

2. En tu código del servidor (lib/supabase/server.ts):
   - Ya estás usando createClient() que usa el service role key
   - Esto permite que el backend acceda a todas las tablas

3. Las políticas RLS protegen:
   - Accesos directos desde el cliente (supabase-js en browser)
   - API REST de Supabase
   - PostgREST endpoints

4. El backend con service role puede:
   - Leer/escribir en cualquier tabla
   - Realizar operaciones en nombre de usuarios
   - Bypass RLS cuando sea necesario

SEGURIDAD:
✅ RLS habilitado en todas las tablas
✅ Políticas configuradas para usuarios regulares
✅ Políticas especiales para administradores
✅ Backend usa service role (bypass RLS)
✅ Cliente usa anon key (respeta RLS)
*/

