-- Verificar que las políticas RLS están correctamente configuradas

-- 1. Verificar que RLS está habilitado
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('users', 'tenants')
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Listar todas las políticas RLS para la tabla users
SELECT
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

-- 3. Listar todas las políticas RLS para la tabla tenants
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tenants'
ORDER BY policyname;

-- 4. Verificar que la función is_admin() existe
SELECT
    proname AS function_name,
    proargtypes,
    prorettype,
    prosrc
FROM pg_proc
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
