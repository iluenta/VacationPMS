-- Script para probar el sistema de configuraciones
-- Verifica que las tablas, datos de ejemplo y políticas funcionen correctamente

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

SELECT 'Verificando estructura de tablas...' as info;

-- Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR DATOS DE EJEMPLO
-- =====================================================

SELECT 'Verificando datos de ejemplo...' as info;

-- Verificar tipos de configuración creados
SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    ct.is_active,
    ct.sort_order,
    t.name as tenant_name
FROM public.configuration_types ct
JOIN public.tenants t ON ct.tenant_id = t.id
ORDER BY ct.sort_order, ct.name;

-- Verificar valores de configuración creados
SELECT 
    cv.id,
    cv.value,
    cv.label,
    cv.description,
    cv.icon,
    cv.color,
    cv.is_active,
    cv.sort_order,
    ct.name as configuration_type_name
FROM public.configuration_values cv
JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
ORDER BY ct.name, cv.sort_order, cv.label;

-- =====================================================
-- 3. VERIFICAR FUNCIONES
-- =====================================================

SELECT 'Verificando funciones...' as info;

-- Verificar función de dependencias
SELECT 
    'check_configuration_type_dependencies' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'check_configuration_type_dependencies'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Verificar función de auditoría
SELECT 
    'audit_configuration_types' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'audit_configuration_types'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- =====================================================
-- 4. VERIFICAR TRIGGERS
-- =====================================================

SELECT 'Verificando triggers...' as info;

-- Verificar triggers de auditoría
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'trigger_audit_configuration_types',
    'trigger_audit_configuration_values',
    'trigger_update_configuration_types_updated_at',
    'trigger_update_configuration_values_updated_at'
)
ORDER BY trigger_name;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 'Verificando políticas RLS...' as info;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =====================================================

SELECT 'Verificando índices...' as info;

-- Verificar índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY tablename, indexname;

-- =====================================================
-- 7. PROBAR FUNCIÓN DE DEPENDENCIAS
-- =====================================================

SELECT 'Probando función de dependencias...' as info;

-- Probar función de dependencias con un tipo que tiene valores
SELECT 
    ct.name as configuration_type,
    dep.table_name,
    dep.record_count,
    dep.can_delete
FROM public.configuration_types ct
CROSS JOIN LATERAL public.check_configuration_type_dependencies(ct.id) dep
WHERE ct.name = 'Tipo de Usuario'
ORDER BY dep.table_name;

-- =====================================================
-- 8. VERIFICAR LOG DE AUDITORÍA
-- =====================================================

SELECT 'Verificando log de auditoría...' as info;

-- Verificar que se crearon registros de auditoría
SELECT 
    table_name,
    action,
    COUNT(*) as record_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM public.configuration_audit_log
GROUP BY table_name, action
ORDER BY table_name, action;

-- =====================================================
-- 9. RESUMEN FINAL
-- =====================================================

SELECT 'RESUMEN FINAL' as info;

-- Contar registros por tabla
SELECT 
    'configuration_types' as table_name,
    COUNT(*) as record_count
FROM public.configuration_types
UNION ALL
SELECT 
    'configuration_values' as table_name,
    COUNT(*) as record_count
FROM public.configuration_values
UNION ALL
SELECT 
    'configuration_audit_log' as table_name,
    COUNT(*) as record_count
FROM public.configuration_audit_log
ORDER BY table_name;

-- Verificar que hay al menos un tenant con configuraciones
SELECT 
    'Tenants con configuraciones' as info,
    COUNT(DISTINCT ct.tenant_id) as tenant_count
FROM public.configuration_types ct;

SELECT 'Sistema de configuraciones listo para usar!' as status;
