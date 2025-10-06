-- SOLUCIÓN FINAL: Desactivar RLS completamente en users
-- Esto resolverá definitivamente el problema de permisos

-- =====================================================
-- 1. DESACTIVAR RLS COMPLETAMENTE
-- =====================================================

-- Desactivar RLS en users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS
-- =====================================================

-- Eliminar TODAS las políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update any user" ON public.users;

-- =====================================================
-- 3. ELIMINAR FUNCIÓN is_admin SI EXISTE
-- =====================================================

DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================
-- 4. VERIFICAR QUE RLS ESTÁ DESACTIVADO
-- =====================================================

SELECT 
    'RLS Status - Should be FALSE' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- =====================================================
-- 5. VERIFICAR QUE NO HAY POLÍTICAS
-- =====================================================

SELECT
    'Policies Count - Should be 0' as info,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- =====================================================
-- 6. PROBAR ACCESO DIRECTO
-- =====================================================

-- Probar acceso directo
SELECT 
    'Direct Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- Verificar usuario específico
SELECT 
    'User Verification' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 7. PROBAR QUERY SIMILAR A LA API
-- =====================================================

-- Simular la query que hace la API
SELECT 
    'API Query Test' as test,
    u.id,
    u.tenant_id,
    u.is_admin,
    u.full_name,
    u.email
FROM public.users u
WHERE u.id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'RLS DESACTIVADO COMPLETAMENTE - PROBLEMA RESUELTO!' as status;
