-- Script para verificar los detalles del último usuario registrado

-- 1. Verificar el usuario más reciente en auth.users
SELECT 
    'Latest auth user' as info,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'pramsuarez@gmail.com';

-- 2. Verificar el usuario en public.users
SELECT 
    'Latest public user' as info,
    id,
    email,
    created_at,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE email = 'pramsuarez@gmail.com';

-- 3. Verificar si hay tenants recientes sin usuario asignado
SELECT 
    'Recent tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar si hay usuarios sin tenant_id
SELECT 
    'Users without tenant' as info,
    id,
    email,
    full_name,
    tenant_id,
    created_at
FROM public.users
WHERE tenant_id IS NULL
ORDER BY created_at DESC;

-- 5. Verificar el proceso de registro - buscar tenants creados recientemente
SELECT 
    'Tenants created today' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
