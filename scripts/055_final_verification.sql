-- Script de verificación final del sistema

-- 1. Verificar el estado completo del sistema
SELECT 
    'System Status' as info,
    (SELECT count(*) FROM auth.users) as total_auth_users,
    (SELECT count(*) FROM public.users) as total_public_users,
    (SELECT count(*) FROM public.tenants) as total_tenants,
    (SELECT count(*) FROM public.users WHERE is_admin = true) as admin_users,
    (SELECT count(*) FROM public.users WHERE is_admin = false) as regular_users;

-- 2. Verificar usuarios administradores
SELECT 
    'Admin Users' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id,
    'No tenant_id is correct for admins' as note
FROM public.users u
WHERE u.is_admin = true;

-- 3. Verificar usuarios regulares
SELECT 
    'Regular Users' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.is_admin = false;

-- 4. Verificar que todos los usuarios regulares tienen tenant_id
SELECT 
    'Users without tenant_id (should be only admins)' as info,
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.tenant_id
FROM public.users u
WHERE u.tenant_id IS NULL;

-- 5. Verificar tenants disponibles
SELECT 
    'Available Tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC;

-- 6. Verificar que el trigger está funcionando
SELECT 
    'Trigger Status' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Verificar políticas RLS
SELECT 
    'RLS Policies' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'tenants')
ORDER BY tablename, policyname;
