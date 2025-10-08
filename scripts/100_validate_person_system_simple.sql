-- ============================================================================
-- SCRIPT 100: VALIDACIÓN SIMPLE DEL SISTEMA DE PERSONAS
-- ============================================================================
-- Descripción: Valida que todo el sistema de personas esté listo
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- ============================================================================
-- VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================================================

-- Verificar tablas necesarias
SELECT 
    'tenants' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') 
         THEN '✅ Existe' 
         ELSE '❌ No existe' 
    END as estado;

SELECT 
    'configuration_types' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') 
         THEN '✅ Existe' 
         ELSE '❌ No existe' 
    END as estado;

SELECT 
    'persons' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'persons') 
         THEN '✅ Existe' 
         ELSE '⚠️ No existe - ejecuta scripts/094_create_person_tables.sql' 
    END as estado;

SELECT 
    'person_contact_infos' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_contact_infos') 
         THEN '✅ Existe' 
         ELSE '⚠️ No existe - ejecuta scripts/094_create_person_tables.sql' 
    END as estado;

SELECT 
    'person_fiscal_addresses' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_fiscal_addresses') 
         THEN '✅ Existe' 
         ELSE '⚠️ No existe - ejecuta scripts/094_create_person_tables.sql' 
    END as estado;

-- ============================================================================
-- VERIFICAR TENANTS
-- ============================================================================

-- Contar tenants
SELECT 
    'Tenants disponibles' as descripcion,
    COUNT(*)::TEXT as valor
FROM tenants;

-- Mostrar tenants
SELECT 
    id,
    name,
    slug,
    created_at
FROM tenants
ORDER BY created_at;

-- ============================================================================
-- VERIFICAR TIPOS DE PERSONAS
-- ============================================================================

-- Contar tipos de personas
SELECT 
    'Tipos de personas creados' as descripcion,
    COUNT(*)::TEXT as valor
FROM configuration_types
WHERE name IN (
    'Cliente Propiedad',
    'Cliente Herramienta', 
    'Plataforma Distribución',
    'Proveedor',
    'Usuario Plataforma'
);

-- Verificar tipos faltantes
SELECT 
    'Tipos faltantes' as descripcion,
    CASE 
        WHEN COUNT(*) < 5 THEN '⚠️ Faltan tipos - ejecuta scripts/096_create_person_types_final.sql'
        ELSE '✅ Todos los tipos están creados'
    END as valor
FROM configuration_types
WHERE name IN (
    'Cliente Propiedad',
    'Cliente Herramienta', 
    'Plataforma Distribución',
    'Proveedor',
    'Usuario Plataforma'
);

-- Mostrar tipos existentes
SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    t.name as tenant_name
FROM configuration_types ct
JOIN tenants t ON ct.tenant_id = t.id
WHERE ct.name IN (
    'Cliente Propiedad',
    'Cliente Herramienta', 
    'Plataforma Distribución',
    'Proveedor',
    'Usuario Plataforma'
)
ORDER BY ct.sort_order;

-- ============================================================================
-- VERIFICAR USUARIOS
-- ============================================================================

-- Contar usuarios totales
SELECT 
    'Usuarios totales' as descripcion,
    COUNT(*)::TEXT as valor
FROM users;

-- Verificar columna person_id
SELECT 
    'Columna person_id' as descripcion,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'person_id'
    ) THEN '✅ Existe' 
    ELSE '⚠️ No existe - ejecuta scripts/095_migrate_users_to_persons.sql' 
    END as valor;

-- Contar usuarios con person_id (si existe la columna)
SELECT 
    'Usuarios con person_id' as descripcion,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'person_id'
    ) THEN (
        SELECT COUNT(*)::TEXT 
        FROM users 
        WHERE person_id IS NOT NULL
    )
    ELSE 'N/A' 
    END as valor;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT 
    '=== RESUMEN DE VALIDACIÓN ===' as mensaje,
    '' as detalle;

SELECT 
    '1. Verifica que todas las tablas necesarias existan' as paso,
    'Ejecuta scripts/094_create_person_tables.sql si faltan tablas' as accion;

SELECT 
    '2. Verifica que haya al menos un tenant' as paso,
    'Los tenants ya están disponibles' as accion;

SELECT 
    '3. Verifica que los tipos de personas estén creados' as paso,
    'Ejecuta scripts/096_create_person_types_final.sql si faltan tipos' as accion;

SELECT 
    '4. Verifica el estado de migración de usuarios' as paso,
    'Ejecuta scripts/095_migrate_users_to_persons.sql si falta migración' as accion;

SELECT 
    'Una vez completado, el sistema de personas estará listo para usar.' as mensaje,
    '' as detalle;
