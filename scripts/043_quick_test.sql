-- Script de prueba rápida para verificar que el usuario funciona

-- 1. Verificar que el usuario existe y es accesible
SELECT 
    'Usuario creado y accesible' as test,
    id,
    email,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 2. Verificar que el tenant es accesible
SELECT 
    'Tenant accesible' as test,
    id,
    name,
    slug
FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar que RLS está habilitado
SELECT 
    'RLS habilitado en users' as test,
    CASE 
        WHEN relrowsecurity THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_class
WHERE relname = 'users';

-- 4. Verificar políticas RLS básicas
SELECT 
    'Políticas RLS básicas' as test,
    count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname IN ('Users can view own profile', 'Users can update own profile', 'Users can insert own profile');

-- 5. Resumen final
SELECT 
    '=== RESUMEN FINAL ===' as info;

SELECT 
    'Usuario accesible' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

SELECT 
    'Tenant accesible' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 
    'RLS habilitado' as check_item,
    CASE 
        WHEN relrowsecurity THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM pg_class
WHERE relname = 'users';
