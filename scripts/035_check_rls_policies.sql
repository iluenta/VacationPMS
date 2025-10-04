-- Script para verificar las políticas RLS y solucionar el error 406

-- 1. Verificar el estado de RLS en la tabla users
SELECT 
    'RLS status for users table' as info,
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'users';

-- 2. Listar todas las políticas RLS para la tabla users
SELECT
    'Current RLS policies for users' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- 3. Verificar si la función is_admin() existe y funciona
SELECT 
    'is_admin function check' as info,
    proname as function_name,
    prosrc
FROM pg_proc 
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Probar la función is_admin() con el usuario actual
SELECT 
    'is_admin() test' as info,
    public.is_admin() as is_admin_result;

-- 5. Verificar permisos en la tabla users
SELECT 
    'Table permissions' as info,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 6. Si hay problemas, recrear las políticas RLS
-- (Descomenta las siguientes líneas si es necesario)

/*
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- Recrear políticas
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());
*/
