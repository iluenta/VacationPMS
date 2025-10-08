-- ============================================================================
-- SCRIPT 097: DIAGNÓSTICO DE CONFIGURATION_TYPES
-- ============================================================================
-- Descripción: Diagnostica la estructura de la tabla configuration_types
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') THEN
        RAISE EXCEPTION 'La tabla configuration_types no existe';
    END IF;
    
    RAISE NOTICE 'La tabla configuration_types existe';
END $$;

-- Mostrar la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'configuration_types'
ORDER BY ordinal_position;

-- Mostrar las restricciones
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'configuration_types'
ORDER BY tc.constraint_type, kcu.column_name;

-- Mostrar datos existentes
SELECT 
    id,
    name,
    tenant_id,
    is_active,
    created_at
FROM configuration_types
ORDER BY created_at
LIMIT 10;

-- Contar registros por tenant_id
SELECT 
    CASE 
        WHEN tenant_id IS NULL THEN 'NULL (Global)'
        ELSE tenant_id::TEXT
    END as tenant_status,
    COUNT(*) as count
FROM configuration_types
GROUP BY tenant_id
ORDER BY tenant_id;
