-- ============================================================================
-- Script: 091_fix_null_tenant_ids.sql
-- Descripción: Corregir registros con tenant_id como string "null" en lugar de NULL
-- Fecha: 2025-01-07
-- ============================================================================

-- Verificar registros problemáticos (tenant_id como string "null")
SELECT 
    id, 
    name, 
    tenant_id, 
    created_at 
FROM configuration_types 
WHERE tenant_id::text = 'null' OR tenant_id::text = 'NULL';

-- Verificar registros con tenant_id NULL válido
SELECT 
    id, 
    name, 
    tenant_id, 
    created_at 
FROM configuration_types 
WHERE tenant_id IS NULL;

-- Corregir registros con tenant_id como string "null"
UPDATE configuration_types 
SET tenant_id = NULL 
WHERE tenant_id::text = 'null' OR tenant_id::text = 'NULL';

-- Verificar que la corrección se aplicó correctamente
SELECT 
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_tenant,
    COUNT(*) - COUNT(tenant_id) as records_without_tenant
FROM configuration_types;

-- Verificar que no hay más registros problemáticos
SELECT 
    id, 
    name, 
    tenant_id, 
    created_at 
FROM configuration_types 
WHERE tenant_id::text = 'null' OR tenant_id::text = 'NULL';

-- ============================================================================
-- NOTAS:
-- - Este script corrige registros donde tenant_id es el string "null" 
--   en lugar del valor NULL de PostgreSQL
-- - Los registros con tenant_id NULL son válidos para usuarios admin
-- - Después de ejecutar este script, el endpoint /api/configurations 
--   debería funcionar correctamente
-- ============================================================================
