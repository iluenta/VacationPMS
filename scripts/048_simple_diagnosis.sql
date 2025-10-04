-- Script simple para diagnosticar el problema del trigger

-- 1. Verificar si el trigger existe
SELECT 
    'Trigger exists' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar si la función existe
SELECT 
    'Function exists' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar usuarios en auth.users vs public.users
SELECT 
    'Users comparison' as check_item,
    (SELECT count(*) FROM auth.users) as auth_count,
    (SELECT count(*) FROM public.users) as public_count,
    CASE 
        WHEN (SELECT count(*) FROM auth.users) = (SELECT count(*) FROM public.users) 
        THEN 'SYNCED'
        ELSE 'OUT OF SYNC'
    END as sync_status;

-- 4. Mostrar usuarios faltantes
SELECT 
    'Missing users' as check_item,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 5. Verificar permisos en la tabla auth.users
SELECT 
    'Auth.users permissions' as check_item,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY grantee, privilege_type;
