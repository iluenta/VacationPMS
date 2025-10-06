-- Script para desactivar temporalmente RLS en users
-- Úsalo si el script anterior no funciona

-- =====================================================
-- 1. DESACTIVAR RLS TEMPORALMENTE
-- =====================================================

-- Desactivar RLS en users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS
-- =====================================================

-- Eliminar todas las políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- =====================================================
-- 3. VERIFICAR ESTADO
-- =====================================================

-- Verificar que RLS está desactivado
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar que no hay políticas
SELECT
    'Policies Status' as info,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- =====================================================
-- 4. PROBAR ACCESO
-- =====================================================

-- Probar acceso directo
SELECT 
    'Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- Verificar usuario específico
SELECT 
    'User Check' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'RLS desactivado temporalmente en tabla users!' as status;

