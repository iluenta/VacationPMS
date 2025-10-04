-- Script de diagnóstico completo para identificar y solucionar problemas

-- 1. Verificar el estado general del sistema
SELECT 
    '=== DIAGNÓSTICO COMPLETO ===' as info;

-- 2. Verificar usuarios en auth.users vs public.users
SELECT 
    'Auth users count' as metric,
    count(*) as value
FROM auth.users;

SELECT 
    'Public users count' as metric,
    count(*) as value
FROM public.users;

-- 3. Verificar usuarios faltantes
SELECT 
    'Missing users in public.users' as issue,
    count(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 4. Verificar el trigger
SELECT 
    'Trigger exists' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Verificar la función
SELECT 
    'Function exists' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 6. Verificar RLS
SELECT 
    'RLS enabled on users' as check_item,
    CASE 
        WHEN relrowsecurity THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_class
WHERE relname = 'users';

-- 7. Verificar políticas RLS
SELECT 
    'RLS policies count' as check_item,
    count(*) as count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 8. Verificar función is_admin
SELECT 
    'is_admin function exists' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_proc 
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 9. Verificar el usuario específico que está fallando
SELECT 
    '=== USUARIO ESPECÍFICO ===' as info;

SELECT 
    'User in auth.users' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM auth.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

SELECT 
    'User in public.users' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 10. Mostrar detalles del usuario en auth.users
SELECT 
    'User details from auth.users' as info,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 11. Mostrar detalles del usuario en public.users (si existe)
SELECT 
    'User details from public.users' as info,
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 12. Verificar tenants
SELECT 
    '=== TENANTS ===' as info;

SELECT 
    'Tenants count' as metric,
    count(*) as value
FROM public.tenants;

SELECT 
    'RLS enabled on tenants' as check_item,
    CASE 
        WHEN relrowsecurity THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_class
WHERE relname = 'tenants';
