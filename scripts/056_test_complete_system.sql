-- Script de prueba completa del sistema

-- 1. Verificar estado general del sistema
SELECT 
    'System Overview' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users,
    (SELECT count(*) FROM public.tenants) as tenants,
    (SELECT count(*) FROM public.users WHERE is_admin = true) as admins,
    (SELECT count(*) FROM public.users WHERE is_admin = false) as regular_users;

-- 2. Verificar usuarios administradores (deben tener tenant_id = NULL)
SELECT 
    'Admin Users (should have tenant_id = NULL)' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id,
    CASE 
        WHEN u.tenant_id IS NULL THEN '✅ CORRECT'
        ELSE '❌ ERROR - Admin should not have tenant_id'
    END as status
FROM public.users u
WHERE u.is_admin = true;

-- 3. Verificar usuarios regulares (deben tener tenant_id)
SELECT 
    'Regular Users (should have tenant_id)' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id,
    t.name as tenant_name,
    CASE 
        WHEN u.tenant_id IS NOT NULL THEN '✅ CORRECT'
        ELSE '❌ ERROR - Regular user should have tenant_id'
    END as status
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.is_admin = false;

-- 4. Verificar que todos los usuarios tienen perfiles válidos
SELECT 
    'User Profile Validation' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id,
    CASE 
        WHEN u.email IS NOT NULL AND u.full_name IS NOT NULL THEN '✅ VALID'
        ELSE '❌ INVALID'
    END as profile_status
FROM public.users u
ORDER BY u.is_admin DESC, u.created_at DESC;

-- 5. Verificar tenants disponibles
SELECT 
    'Available Tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC;

-- 6. Verificar que el trigger está activo
SELECT 
    'Trigger Status' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    '✅ ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Verificar políticas RLS
SELECT 
    'RLS Policies Status' as info,
    tablename,
    count(*) as policy_count,
    '✅ ACTIVE' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'tenants')
GROUP BY tablename
ORDER BY tablename;

-- 8. Resumen final
SELECT 
    'Final Status' as info,
    CASE 
        WHEN (SELECT count(*) FROM auth.users) = (SELECT count(*) FROM public.users) 
        THEN '✅ Users synchronized'
        ELSE '❌ Users not synchronized'
    END as user_sync,
    CASE 
        WHEN (SELECT count(*) FROM public.users WHERE is_admin = true AND tenant_id IS NULL) = (SELECT count(*) FROM public.users WHERE is_admin = true)
        THEN '✅ Admins configured correctly'
        ELSE '❌ Admins configuration error'
    END as admin_config,
    CASE 
        WHEN (SELECT count(*) FROM public.users WHERE is_admin = false AND tenant_id IS NOT NULL) = (SELECT count(*) FROM public.users WHERE is_admin = false)
        THEN '✅ Regular users configured correctly'
        ELSE '❌ Regular users configuration error'
    END as regular_config;
