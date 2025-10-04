-- Script para verificar que el usuario administrador está configurado correctamente

-- 1. Verificar el usuario administrador en auth.users
SELECT 
    'Admin user in auth.users' as info,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'pramsuarez@gmail.com';

-- 2. Verificar el usuario administrador en public.users
SELECT 
    'Admin user in public.users' as info,
    id,
    email,
    created_at,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE email = 'pramsuarez@gmail.com';

-- 3. Verificar todos los usuarios y sus roles
SELECT 
    'All users with roles' as info,
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    u.is_admin,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.is_admin DESC, u.created_at DESC;

-- 4. Verificar que los administradores no tienen tenant_id (esto es correcto)
SELECT 
    'Admin users without tenant_id' as info,
    id,
    email,
    full_name,
    is_admin,
    tenant_id
FROM public.users
WHERE is_admin = true;

-- 5. Verificar que los usuarios normales sí tienen tenant_id
SELECT 
    'Regular users with tenant_id' as info,
    id,
    email,
    full_name,
    is_admin,
    tenant_id
FROM public.users
WHERE is_admin = false;
