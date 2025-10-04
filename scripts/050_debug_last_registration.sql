-- Script para debuggear el último registro

-- 1. Verificar el estado completo del último usuario
WITH latest_auth_user AS (
    SELECT 
        id,
        email,
        created_at,
        email_confirmed_at,
        raw_user_meta_data
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1
),
latest_public_user AS (
    SELECT 
        id,
        email,
        created_at,
        full_name,
        tenant_id,
        is_admin
    FROM public.users
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'Auth user data' as source,
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.raw_user_meta_data
FROM latest_auth_user au
UNION ALL
SELECT 
    'Public user data' as source,
    pu.id,
    pu.email,
    pu.created_at,
    NULL as email_confirmed_at,
    jsonb_build_object(
        'full_name', pu.full_name,
        'tenant_id', pu.tenant_id,
        'is_admin', pu.is_admin
    ) as raw_user_meta_data
FROM latest_public_user pu;

-- 2. Verificar si el tenant del último usuario existe
SELECT 
    'Tenant verification' as info,
    u.id as user_id,
    u.email,
    u.tenant_id,
    t.id as tenant_exists,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC
LIMIT 1;

-- 3. Verificar logs del trigger (si están disponibles)
SELECT 
    'Trigger logs' as info,
    'No logs available in standard PostgreSQL' as message;

-- 4. Verificar si hay errores en la función
SELECT 
    'Function status' as info,
    proname as function_name,
    proisstrict as is_strict,
    prosecdef as security_definer,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Verificar el estado del trigger
SELECT 
    'Trigger status' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
