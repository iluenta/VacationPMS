-- Script para corregir el usuario que no tiene tenant_id

-- 1. Verificar el estado actual del usuario problemático
SELECT 
    'Current state' as info,
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    u.is_admin,
    u.created_at
FROM public.users u
WHERE u.email = 'pramsuarez@gmail.com';

-- 2. Verificar si hay un tenant reciente que debería estar asignado
SELECT 
    'Recent tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 3;

-- 3. Asignar el tenant más reciente al usuario (si existe)
-- NOTA: Esto es una corrección manual. En un flujo normal, el tenant_id debería venir del metadata
UPDATE public.users 
SET 
    tenant_id = (
        SELECT id 
        FROM public.tenants 
        ORDER BY created_at DESC 
        LIMIT 1
    ),
    updated_at = timezone('utc'::text, now())
WHERE email = 'pramsuarez@gmail.com'
AND tenant_id IS NULL;

-- 4. Verificar la corrección
SELECT 
    'After fix' as info,
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'pramsuarez@gmail.com';

-- 5. Verificar que todos los usuarios tienen tenant_id
SELECT 
    'All users with tenants' as info,
    u.id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;
