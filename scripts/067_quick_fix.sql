-- Script rápido para verificar y crear configuraciones
-- Solución al error 500 de la API

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =====================================================

SELECT 'Verificando tablas...' as info;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY table_name;

-- =====================================================
-- 2. CREAR CONFIGURACIÓN BÁSICA
-- =====================================================

SELECT 'Creando configuración básica...' as info;

-- Insertar configuración básica
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
VALUES (
    '00000001-0000-4000-8000-000000000000',
    'Tipo de Usuario',
    'Define los diferentes tipos de usuarios en el sistema',
    'users',
    '#3B82F6',
    1
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- =====================================================
-- 3. VERIFICAR RESULTADO
-- =====================================================

SELECT 'Verificando resultado...' as info;

SELECT 
    COUNT(*) as configuration_count
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000';

SELECT 'Configuración básica creada!' as status;
