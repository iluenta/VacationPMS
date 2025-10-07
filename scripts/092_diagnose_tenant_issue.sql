-- ============================================================================
-- Script: 092_diagnose_tenant_issue.sql
-- Descripción: Diagnosticar el problema con tenant_id en configuration_types
-- Fecha: 2025-01-07
-- ============================================================================

-- 1. Verificar la estructura de la tabla
\d configuration_types

-- 2. Verificar todos los registros y sus tenant_ids
SELECT 
    id, 
    name, 
    tenant_id,
    pg_typeof(tenant_id) as tenant_id_type,
    tenant_id IS NULL as is_null,
    tenant_id::text as tenant_id_text,
    created_at 
FROM configuration_types 
ORDER BY created_at DESC;

-- 3. Contar registros por tipo de tenant_id
SELECT 
    CASE 
        WHEN tenant_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as tenant_status,
    COUNT(*) as count
FROM configuration_types 
GROUP BY 
    CASE 
        WHEN tenant_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END;

-- 4. Verificar si hay registros con tenant_id inválido
SELECT 
    id, 
    name, 
    tenant_id,
    created_at 
FROM configuration_types 
WHERE tenant_id IS NOT NULL 
  AND tenant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 5. Verificar usuarios y sus tenant_ids
SELECT 
    u.id,
    u.email,
    u.tenant_id,
    pg_typeof(u.tenant_id) as tenant_id_type,
    u.tenant_id IS NULL as is_null,
    u.is_admin
FROM users u
ORDER BY u.created_at DESC;

-- ============================================================================
-- NOTAS:
-- - Este script ayuda a diagnosticar el problema real con tenant_id
-- - Ejecutar cada consulta por separado para identificar el problema
-- - El error sugiere que hay un valor "null" (string) en lugar de NULL
-- ============================================================================
