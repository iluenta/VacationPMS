-- Script final para corregir las políticas RLS
-- Basado en el diagnóstico: auth.uid() devuelve null desde el dashboard

-- =====================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- =====================================================
-- 2. CREAR NUEVA FUNCIÓN is_admin MEJORADA
-- =====================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS public.is_admin();

-- Crear nueva función que funcione correctamente
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin')::boolean,
    false
  );
$$;

-- =====================================================
-- 3. CREAR POLÍTICAS MÁS PERMISIVAS
-- =====================================================

-- Política 1: Cualquier usuario autenticado puede ver cualquier usuario
-- (Esto es necesario para que la API funcione)
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política 2: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 4: Admins pueden actualizar cualquier usuario
CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- 4. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que RLS está activado
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar políticas creadas
SELECT
    'New Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- 5. PROBAR LA FUNCIÓN is_admin
-- =====================================================

-- Probar la función is_admin
SELECT 
    'Testing is_admin function' as test,
    public.is_admin() as is_admin_result,
    auth.uid() as current_user_id,
    (auth.jwt() ->> 'user_metadata')::jsonb as user_metadata;

-- =====================================================
-- 6. VERIFICAR USUARIO ESPECÍFICO
-- =====================================================

-- Verificar el usuario específico
SELECT 
    'User Verification' as test,
    u.id,
    u.tenant_id,
    u.is_admin,
    u.full_name,
    u.email,
    au.raw_user_meta_data->>'is_admin' as auth_is_admin
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'Políticas RLS corregidas exitosamente!' as status;
