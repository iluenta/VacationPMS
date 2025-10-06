-- Script para diagnosticar el estado actual de la tabla users
-- Ayuda a entender por qué persiste el error 42501

-- =====================================================
-- 1. VERIFICAR ESTADO DE RLS
-- =====================================================

SELECT 
    'RLS Status Check' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- =====================================================
-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- =====================================================

SELECT
    'Existing Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- 3. VERIFICAR PERMISOS DE LA TABLA
-- =====================================================

SELECT 
    'Table Permissions' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- =====================================================
-- 4. VERIFICAR USUARIO ACTUAL
-- =====================================================

SELECT 
    'Current User Info' as info,
    current_user as current_user,
    session_user as session_user,
    auth.uid() as auth_uid;

-- =====================================================
-- 5. VERIFICAR USUARIO ESPECÍFICO EN AUTH.USERS
-- =====================================================

SELECT 
    'Auth User Check' as info,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 6. VERIFICAR USUARIO ESPECÍFICO EN PUBLIC.USERS
-- =====================================================

SELECT 
    'Public User Check' as info,
    id,
    tenant_id,
    is_admin,
    full_name,
    email,
    created_at
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 7. PROBAR ACCESO DIRECTO
-- =====================================================

-- Intentar acceso directo
SELECT 
    'Direct Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- =====================================================
-- 8. VERIFICAR FUNCIONES AUXILIARES
-- =====================================================

-- Verificar si existe la función is_admin
SELECT 
    'Function Check' as info,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';

SELECT 'Diagnóstico completado!' as status;
