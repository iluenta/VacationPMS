-- Script para corregir los problemas de sincronización

-- 1. Verificar el estado actual
SELECT 
    'Current State' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users,
    (SELECT count(*) FROM public.users WHERE is_admin = true AND tenant_id IS NOT NULL) as admins_with_tenant_id;

-- 2. Crear usuarios faltantes en public.users
INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE((au.raw_user_meta_data ->> 'tenant_id')::uuid, NULL),
    COALESCE((au.raw_user_meta_data ->> 'is_admin')::boolean, false)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  tenant_id = EXCLUDED.tenant_id,
  is_admin = EXCLUDED.is_admin,
  updated_at = timezone('utc'::text, now());

-- 3. Corregir administradores que tienen tenant_id (deben tener tenant_id = NULL)
UPDATE public.users 
SET 
    tenant_id = NULL,
    updated_at = timezone('utc'::text, now())
WHERE is_admin = true 
AND tenant_id IS NOT NULL;

-- 4. Verificar el estado después de la corrección
SELECT 
    'After Fix' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users,
    (SELECT count(*) FROM public.users WHERE is_admin = true AND tenant_id IS NULL) as admins_without_tenant_id;

-- 5. Verificar usuarios administradores
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

-- 6. Verificar usuarios regulares
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

-- 7. Verificación final
SELECT 
    'Final Verification' as info,
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
