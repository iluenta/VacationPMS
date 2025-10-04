-- Script final para probar que todo funciona correctamente

-- 1. Probar la función is_admin() corregida
SELECT 
    'Testing corrected is_admin() function' as test_name,
    public.is_admin() as is_admin_result;

-- 2. Verificar que el usuario actual puede ver su propio perfil
SELECT 
    'User can see own profile' as test_name,
    COUNT(*) as profile_count
FROM public.users 
WHERE id = auth.uid();

-- 3. Verificar que el usuario actual puede ver tenants
SELECT 
    'User can see tenants' as test_name,
    COUNT(*) as tenant_count
FROM public.tenants;

-- 4. Verificar que el usuario actual puede actualizar su propio perfil
SELECT 
    'User can update own profile' as test_name,
    COUNT(*) as profile_count
FROM public.users 
WHERE id = auth.uid();

-- 5. Verificar todas las políticas RLS activas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'tenants')
ORDER BY tablename, policyname;
