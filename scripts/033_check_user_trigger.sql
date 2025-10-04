-- Script para verificar el estado del trigger de usuarios

-- 1. Verificar si el trigger existe
SELECT 
    'Trigger status' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar si la función existe
SELECT 
    'Function status' as info,
    proname as function_name,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar usuarios en auth.users vs public.users
SELECT 
    'Auth users count' as info,
    count(*) as count
FROM auth.users;

SELECT 
    'Public users count' as info,
    count(*) as count
FROM public.users;

-- 4. Verificar si hay usuarios en auth.users que no están en public.users
SELECT 
    'Missing users in public.users' as info,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 5. Verificar el usuario específico que está fallando
SELECT 
    'Specific user check' as info,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.raw_user_meta_data,
    pu.id as public_user_id,
    pu.email as public_user_email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.id = '07d0cadf-c0de-403c-af74-492214376512';
