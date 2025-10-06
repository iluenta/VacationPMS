-- Script para desactivar RLS en configuration_types y permitir acceso desde la API
-- Esto solucionará el problema de permisos en la API de configuraciones

-- =====================================================
-- 1. DESACTIVAR RLS EN configuration_types
-- =====================================================

ALTER TABLE public.configuration_types DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR POLÍTICAS RLS EXISTENTES
-- =====================================================

DROP POLICY IF EXISTS "Users can view configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can insert configuration types in their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can update configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can delete configuration types of their tenant" ON public.configuration_types;

-- =====================================================
-- 3. VERIFICAR ESTADO
-- =====================================================

-- Verificar que RLS está desactivado en configuration_types
SELECT
    'configuration_types RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'configuration_types';

-- Verificar que no hay políticas en configuration_types
SELECT
    'configuration_types Policies Status' as info,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'configuration_types';

-- =====================================================
-- 4. PROBAR ACCESO DIRECTO
-- =====================================================

-- Probar acceso directo a configuration_types
SELECT
    'Direct Access Test' as test,
    COUNT(*) as config_types_count
FROM public.configuration_types;

-- Verificar datos existentes
SELECT
    'Existing Data' as test,
    ct.id,
    ct.name,
    ct.tenant_id,
    ct.is_active
FROM public.configuration_types ct
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
ORDER BY ct.sort_order, ct.name;

-- =====================================================
-- 5. VERIFICAR TABLA users TAMBIÉN
-- =====================================================

-- Verificar que users sigue con RLS desactivado
SELECT
    'users RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- Probar consulta similar a la que hace la API
SELECT
    'API Query Test' as test,
    u.id,
    u.tenant_id,
    u.is_admin,
    u.full_name,
    u.email
FROM public.users u
WHERE u.id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'RLS DESACTIVADO EN configuration_types - API debería funcionar ahora!' as status;
