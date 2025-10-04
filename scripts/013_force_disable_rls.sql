-- Forzar desactivación de RLS para la tabla users
-- Eliminar todas las políticas primero
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- Desactivar RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar que no hay políticas
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';
