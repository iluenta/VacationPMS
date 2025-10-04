-- Verificar datos del usuario específico
-- Primero verificar si existe en auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    raw_user_meta_data::text as metadata,
    null as full_name,
    null as tenant_id,
    null as is_admin,
    created_at
FROM auth.users 
WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd'

UNION ALL

-- Verificar si existe en public.users
SELECT 
    'public.users' as table_name,
    id,
    email,
    null as metadata,
    full_name,
    tenant_id::text,
    is_admin::text,
    created_at
FROM public.users 
WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd';

-- Verificar todos los usuarios en public.users
SELECT 
    'All users in public.users' as info,
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users 
ORDER BY created_at DESC;
