-- Script para corregir permisos RLS de la tabla users
-- El problema es que la función is_admin() no funciona correctamente

-- =====================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- Eliminar función is_admin si existe
DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================
-- 2. CREAR NUEVA FUNCIÓN is_admin MEJORADA
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
  );
$$;

-- =====================================================
-- 3. CREAR POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

-- Política 1: Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Usuarios autenticados pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 4: Admins pueden ver todos los usuarios
CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Política 5: Admins pueden actualizar cualquier usuario
CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- 4. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que RLS está activado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar políticas creadas
SELECT
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

-- Probar la función is_admin (esto debería funcionar para usuarios autenticados)
SELECT 
    'Testing is_admin function' as test,
    public.is_admin() as is_admin_result,
    auth.uid() as current_user_id;

-- =====================================================
-- 6. VERIFICAR USUARIO ESPECÍFICO
-- =====================================================

-- Verificar el usuario específico que está teniendo problemas
SELECT 
    'User verification' as test,
    u.id,
    u.tenant_id,
    u.is_admin,
    u.full_name,
    u.email,
    au.raw_user_meta_data->>'is_admin' as auth_is_admin
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'Políticas RLS de users corregidas exitosamente!' as status;
