-- Script para probar acceso directo a la base de datos
-- Simula exactamente lo que hace la API

-- =====================================================
-- 1. VERIFICAR ESTADO ACTUAL
-- =====================================================

-- Verificar RLS status
SELECT 
    'Current RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- =====================================================
-- 2. PROBAR QUERY EXACTA DE LA API
-- =====================================================

-- Esta es exactamente la query que hace la API en la línea 17-21
SELECT 
    'API Query Simulation' as test,
    tenant_id, 
    is_admin
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 3. PROBAR QUERY DE CONFIGURACIONES
-- =====================================================

-- Esta es la query que hace la API para obtener configuraciones
SELECT 
    'Configurations Query Test' as test,
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    ct.is_active,
    ct.sort_order,
    ct.created_at,
    ct.updated_at,
    ct.tenant_id,
    t.name as tenant_name
FROM public.configuration_types ct
LEFT JOIN public.tenants t ON ct.tenant_id = t.id
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
ORDER BY ct.sort_order, ct.name;

-- =====================================================
-- 4. VERIFICAR DATOS DE CONFIGURACIÓN
-- =====================================================

-- Verificar que existen configuraciones
SELECT 
    'Configuration Count' as test,
    COUNT(*) as count
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000';

-- =====================================================
-- 5. VERIFICAR TENANT
-- =====================================================

-- Verificar que el tenant existe
SELECT 
    'Tenant Verification' as test,
    id,
    name,
    slug
FROM public.tenants
WHERE id = '00000001-0000-4000-8000-000000000000';

SELECT 'Pruebas de acceso completadas!' as status;
