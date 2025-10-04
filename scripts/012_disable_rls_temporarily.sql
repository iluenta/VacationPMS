-- Desactivar RLS temporalmente para la tabla users
-- Esto permitirá que la aplicación funcione mientras investigamos el problema

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

-- Verificar que no hay políticas activas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';
