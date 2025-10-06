-- Verificación rápida del estado actual
-- Para confirmar si RLS está realmente desactivado

-- =====================================================
-- 1. VERIFICAR RLS STATUS
-- =====================================================

SELECT 
    'RLS Status Check' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- =====================================================
-- 2. VERIFICAR POLÍTICAS
-- =====================================================

SELECT
    'Policies Check' as info,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- =====================================================
-- 3. PROBAR ACCESO DIRECTO
-- =====================================================

SELECT 
    'Direct Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- =====================================================
-- 4. PROBAR QUERY ESPECÍFICA
-- =====================================================

SELECT 
    'Specific User Query' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'Verificación completada!' as status;

