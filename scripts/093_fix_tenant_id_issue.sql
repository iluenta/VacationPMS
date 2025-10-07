-- ============================================================================
-- Script: 093_fix_tenant_id_issue.sql
-- Descripción: Corregir el problema con tenant_id de forma segura
-- Fecha: 2025-01-07
-- ============================================================================

-- PASO 1: Crear una copia de seguridad
CREATE TABLE IF NOT EXISTS configuration_types_backup AS 
SELECT * FROM configuration_types;

-- PASO 2: Verificar registros problemáticos
SELECT 
    'Registros problemáticos encontrados:' as message,
    COUNT(*) as count
FROM configuration_types 
WHERE tenant_id IS NOT NULL 
  AND tenant_id::text NOT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 3: Mostrar registros problemáticos (si los hay)
SELECT 
    id, 
    name, 
    tenant_id,
    tenant_id::text as tenant_id_as_text,
    created_at 
FROM configuration_types 
WHERE tenant_id IS NOT NULL 
  AND tenant_id::text NOT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 4: Corregir registros problemáticos (solo si existen)
-- IMPORTANTE: Descomenta la siguiente línea solo si hay registros problemáticos
-- UPDATE configuration_types 
-- SET tenant_id = NULL 
-- WHERE tenant_id IS NOT NULL 
--   AND tenant_id::text NOT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 5: Verificar que la corrección fue exitosa
SELECT 
    'Verificación post-corrección:' as message,
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_valid_tenant,
    COUNT(*) - COUNT(tenant_id) as records_with_null_tenant
FROM configuration_types;

-- PASO 6: Verificar usuarios sin tenant_id (que deberían ser admins)
SELECT 
    'Usuarios sin tenant_id:' as message,
    COUNT(*) as count
FROM users 
WHERE tenant_id IS NULL;

SELECT 
    u.id,
    u.email,
    u.tenant_id,
    u.is_admin,
    u.created_at
FROM users u
WHERE u.tenant_id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este script paso a paso
-- 2. Revisar los resultados de cada consulta
-- 3. Solo descomentar el UPDATE si hay registros problemáticos
-- 4. Verificar que los usuarios sin tenant_id son realmente admins
-- ============================================================================
