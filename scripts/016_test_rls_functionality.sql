-- Script para probar la funcionalidad de las políticas RLS

-- 1. Probar la función is_admin() con el usuario actual
SELECT 
    'Testing is_admin() function' as test_name,
    public.is_admin() as is_admin_result;

-- 2. Verificar que el usuario actual puede ver su propio perfil
SELECT 
    'User can see own profile' as test_name,
    COUNT(*) as profile_count
FROM public.users 
WHERE id = auth.uid();

-- 3. Verificar que el usuario actual puede ver tenants (para signup)
SELECT 
    'User can see tenants' as test_name,
    COUNT(*) as tenant_count
FROM public.tenants;

-- 4. Verificar metadata del JWT del usuario actual
SELECT 
    'JWT metadata' as test_name,
    auth.jwt()::jsonb as jwt_data;
