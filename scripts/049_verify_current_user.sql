-- Script para verificar el usuario actual y su estado

-- 1. Verificar el último usuario creado
SELECT 
    'Latest user in auth.users' as info,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verificar el último usuario en public.users
SELECT 
    'Latest user in public.users' as info,
    id,
    email,
    created_at,
    full_name,
    tenant_id,
    is_admin
FROM public.users
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verificar si hay usuarios sin tenant_id
SELECT 
    'Users without tenant_id' as info,
    count(*) as count
FROM public.users
WHERE tenant_id IS NULL;

-- 4. Verificar tenants recientes
SELECT 
    'Recent tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 3;

-- 5. Verificar usuarios con sus tenants
SELECT 
    'Users with tenants' as info,
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC
LIMIT 5;
