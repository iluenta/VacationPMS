-- Script para probar el acceso del usuario después de la reparación

-- 1. Verificar que el usuario puede acceder a su propio perfil
-- (Esto simula lo que hace el AuthContext)
SELECT 
    'Test: User can access own profile' as test_name,
    id,
    email,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 2. Verificar que el tenant existe y es accesible
SELECT 
    'Test: Tenant is accessible' as test_name,
    t.id,
    t.name,
    t.slug
FROM public.tenants t
WHERE t.id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar que el usuario puede actualizar su propio perfil
-- (Simulación de lo que haría el AuthContext)
UPDATE public.users 
SET updated_at = timezone('utc'::text, now())
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 4. Verificar que la actualización funcionó
SELECT 
    'Test: User can update own profile' as test_name,
    CASE 
        WHEN updated_at > created_at THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status,
    updated_at
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 5. Verificar políticas RLS activas
SELECT 
    'Test: RLS policies active' as test_name,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 6. Verificar que el trigger está activo
SELECT 
    'Test: Trigger is active' as test_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Resumen de estado
SELECT 
    '=== RESUMEN DE PRUEBAS ===' as info;

SELECT 
    'Usuario accesible' as test,
    CASE 
        WHEN count(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

SELECT 
    'Tenant accesible' as test,
    CASE 
        WHEN count(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 
    'Trigger activo' as test,
    CASE 
        WHEN count(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    'RLS habilitado' as test,
    CASE 
        WHEN relrowsecurity THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM pg_class
WHERE relname = 'users';
