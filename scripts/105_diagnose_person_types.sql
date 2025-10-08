-- ============================================================================
-- SCRIPT 105: DIAGNÓSTICO DE TIPOS DE PERSONA POR TENANT
-- ============================================================================
-- Descripción: Diagnostica el estado de los tipos de persona para cada tenant
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- ============================================================================
-- LISTAR TODOS LOS TENANTS
-- ============================================================================

SELECT 
    'TENANTS EXISTENTES' as seccion,
    id,
    name,
    slug,
    created_at
FROM tenants 
ORDER BY name;

-- ============================================================================
-- LISTAR TIPOS DE PERSONA POR TENANT
-- ============================================================================

SELECT 
    'TIPOS DE PERSONA POR TENANT' as seccion,
    t.name as tenant_name,
    ct.name as tipo_persona,
    ct.description,
    ct.icon,
    ct.color,
    ct.is_active,
    ct.sort_order
FROM tenants t
LEFT JOIN configuration_types ct ON t.id = ct.tenant_id 
    AND ct.name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    )
ORDER BY t.name, ct.sort_order;

-- ============================================================================
-- RESUMEN POR TENANT
-- ============================================================================

SELECT 
    'RESUMEN POR TENANT' as seccion,
    t.name as tenant_name,
    COUNT(ct.id) as tipos_persona_count,
    CASE 
        WHEN COUNT(ct.id) = 5 THEN '✅ COMPLETO'
        WHEN COUNT(ct.id) = 0 THEN '❌ SIN TIPOS'
        ELSE '⚠️ INCOMPLETO'
    END as estado
FROM tenants t
LEFT JOIN configuration_types ct ON t.id = ct.tenant_id 
    AND ct.name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    )
GROUP BY t.id, t.name
ORDER BY t.name;

-- ============================================================================
-- TENANTS QUE NECESITAN TIPOS DE PERSONA
-- ============================================================================

SELECT 
    'TENANTS SIN TIPOS DE PERSONA' as seccion,
    t.id,
    t.name,
    t.slug
FROM tenants t
WHERE t.id NOT IN (
    SELECT DISTINCT tenant_id 
    FROM configuration_types 
    WHERE name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    )
    AND tenant_id IS NOT NULL
)
ORDER BY t.name;
