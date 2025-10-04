-- Solución temporal: Desactivar RLS para la tabla users
-- Esto permitirá que los usuarios autenticados accedan a sus datos

-- Desactivar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar que no hay políticas activas
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';
