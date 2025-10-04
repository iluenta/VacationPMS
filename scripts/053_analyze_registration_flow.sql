-- Script para analizar el flujo de registro y identificar problemas

-- 1. Verificar usuarios y sus metadata
SELECT 
    'User metadata analysis' as info,
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    pu.tenant_id as public_tenant_id,
    pu.full_name as public_full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 2. Verificar si hay usuarios con metadata pero sin tenant_id en public.users
SELECT 
    'Users with metadata but no tenant_id' as info,
    au.id,
    au.email,
    au.raw_user_meta_data->>'tenant_id' as auth_tenant_id,
    pu.tenant_id as public_tenant_id,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.raw_user_meta_data->>'tenant_id' IS NOT NULL
AND pu.tenant_id IS NULL;

-- 3. Verificar si hay usuarios sin metadata de tenant_id
SELECT 
    'Users without tenant_id in metadata' as info,
    au.id,
    au.email,
    au.raw_user_meta_data,
    pu.tenant_id as public_tenant_id,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.raw_user_meta_data->>'tenant_id' IS NULL;

-- 4. Verificar tenants creados recientemente
SELECT 
    'Recent tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar si hay tenants sin usuarios asignados
SELECT 
    'Tenants without users' as info,
    t.id,
    t.name,
    t.slug,
    t.created_at,
    COUNT(u.id) as user_count
FROM public.tenants t
LEFT JOIN public.users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at
HAVING COUNT(u.id) = 0
ORDER BY t.created_at DESC;
