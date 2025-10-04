-- Script para verificar el estado del trigger y solucionar el problema

-- 1. Verificar si el trigger existe y está activo
SELECT 
    'Trigger status' as check_item,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar si la función existe
SELECT 
    'Function status' as check_item,
    proname as function_name,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar usuarios recientes en auth.users
SELECT 
    'Recent auth.users' as check_item,
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar usuarios en public.users
SELECT 
    'Recent public.users' as check_item,
    id,
    email,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar si hay usuarios en auth.users que no están en public.users
SELECT 
    'Missing users' as check_item,
    count(*) as missing_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
