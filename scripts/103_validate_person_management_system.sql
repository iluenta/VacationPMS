-- Script de validación completa del sistema de Person Management
-- Verifica que todas las tablas, relaciones, RLS y datos estén correctos

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUCTURA DE TABLAS ===';
END $$;

-- Verificar tabla persons
SELECT 
    'persons' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'persons') 
        THEN '✅ Existe' 
        ELSE '❌ No existe' 
    END as estado,
    (SELECT COUNT(*) FROM persons) as registros
UNION ALL
-- Verificar tabla person_contact_infos
SELECT 
    'person_contact_infos' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_contact_infos') 
        THEN '✅ Existe' 
        ELSE '❌ No existe' 
    END as estado,
    (SELECT COUNT(*) FROM person_contact_infos) as registros
UNION ALL
-- Verificar tabla person_fiscal_addresses
SELECT 
    'person_fiscal_addresses' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_fiscal_addresses') 
        THEN '✅ Existe' 
        ELSE '❌ No existe' 
    END as estado,
    (SELECT COUNT(*) FROM person_fiscal_addresses) as registros;

-- =====================================================
-- 2. VERIFICAR RLS (ROW LEVEL SECURITY)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO RLS ===';
END $$;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END as estado
FROM pg_tables 
WHERE tablename IN ('persons', 'person_contact_infos', 'person_fiscal_addresses')
ORDER BY tablename;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLÍTICAS RLS ===';
END $$;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('persons', 'person_contact_infos', 'person_fiscal_addresses')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR ÍNDICES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ÍNDICES ===';
END $$;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('persons', 'person_contact_infos', 'person_fiscal_addresses')
ORDER BY tablename, indexname;

-- =====================================================
-- 5. VERIFICAR TRIGGERS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO TRIGGERS ===';
END $$;

SELECT 
    event_object_table as tabla,
    trigger_name,
    event_manipulation as evento,
    action_timing as momento,
    action_statement as accion
FROM information_schema.triggers 
WHERE event_object_table IN ('persons', 'person_contact_infos', 'person_fiscal_addresses')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. VERIFICAR INTEGRIDAD DE DATOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO INTEGRIDAD DE DATOS ===';
END $$;

-- Verificar que todas las personas tienen tenant_id válido
SELECT 
    'Personas con tenant_id válido' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM persons) THEN '✅ Correcto'
        ELSE '❌ Hay personas sin tenant_id válido'
    END as estado
FROM persons p
INNER JOIN tenants t ON p.tenant_id = t.id;

-- Verificar que todas las personas tienen person_type_id válido
SELECT 
    'Personas con person_type_id válido' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM persons) THEN '✅ Correcto'
        ELSE '❌ Hay personas sin person_type_id válido'
    END as estado
FROM persons p
INNER JOIN configuration_types ct ON p.person_type_id = ct.id;

-- Verificar consistencia de categorías
SELECT 
    'Consistencia de categorías' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Correcto'
        ELSE '❌ Hay inconsistencias en categorías'
    END as estado
FROM persons 
WHERE (person_category = 'PHYSICAL' AND (first_name IS NULL OR last_name IS NULL OR business_name IS NOT NULL))
   OR (person_category = 'LEGAL' AND (business_name IS NULL OR first_name IS NOT NULL OR last_name IS NOT NULL));

-- =====================================================
-- 7. VERIFICAR RELACIONES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO RELACIONES ===';
END $$;

-- Verificar contactos de personas
SELECT 
    'Contactos con persona válida' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM person_contact_infos) THEN '✅ Correcto'
        ELSE '❌ Hay contactos sin persona válida'
    END as estado
FROM person_contact_infos pci
INNER JOIN persons p ON pci.person_id = p.id;

-- Verificar direcciones fiscales
SELECT 
    'Direcciones fiscales con persona válida' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM person_fiscal_addresses) THEN '✅ Correcto'
        ELSE '❌ Hay direcciones sin persona válida'
    END as estado
FROM person_fiscal_addresses pfa
INNER JOIN persons p ON pfa.person_id = p.id;

-- =====================================================
-- 8. VERIFICAR MIGRACIÓN DE USUARIOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO MIGRACIÓN DE USUARIOS ===';
END $$;

-- Verificar que todos los usuarios tienen person_id
SELECT 
    'Usuarios con person_id' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM users) THEN '✅ Correcto'
        ELSE '❌ Hay usuarios sin person_id'
    END as estado
FROM users 
WHERE person_id IS NOT NULL;

-- Verificar que todas las personas de usuarios existen
SELECT 
    'Personas de usuarios existen' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM users WHERE person_id IS NOT NULL) THEN '✅ Correcto'
        ELSE '❌ Hay usuarios con person_id inválido'
    END as estado
FROM users u
INNER JOIN persons p ON u.person_id = p.id;

-- =====================================================
-- 9. VERIFICAR TIPOS DE PERSONAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO TIPOS DE PERSONAS ===';
END $$;

-- Verificar que existen tipos de personas
SELECT 
    'Tipos de personas configurados' as verificacion,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Correcto'
        ELSE '❌ No hay tipos de personas configurados'
    END as estado
FROM configuration_types 
WHERE name LIKE '%Persona%' OR name LIKE '%Cliente%' OR name LIKE '%Proveedor%';

-- Mostrar tipos de personas disponibles
SELECT 
    id,
    name,
    description,
    is_active,
    tenant_id
FROM configuration_types 
WHERE name LIKE '%Persona%' OR name LIKE '%Cliente%' OR name LIKE '%Proveedor%'
ORDER BY name;

-- =====================================================
-- 10. RESUMEN FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN FINAL ===';
END $$;

SELECT 
    'RESUMEN DEL SISTEMA' as seccion,
    '' as detalle,
    '' as valor
UNION ALL
SELECT 
    'Total de personas',
    'Registros en tabla persons',
    COUNT(*)::text
FROM persons
UNION ALL
SELECT 
    'Total de contactos',
    'Registros en tabla person_contact_infos',
    COUNT(*)::text
FROM person_contact_infos
UNION ALL
SELECT 
    'Total de direcciones fiscales',
    'Registros en tabla person_fiscal_addresses',
    COUNT(*)::text
FROM person_fiscal_addresses
UNION ALL
SELECT 
    'Usuarios migrados',
    'Usuarios con person_id asignado',
    COUNT(*)::text
FROM users 
WHERE person_id IS NOT NULL
UNION ALL
SELECT 
    'Tipos de personas',
    'Configuraciones de tipos de personas',
    COUNT(*)::text
FROM configuration_types 
WHERE name LIKE '%Persona%' OR name LIKE '%Cliente%' OR name LIKE '%Proveedor%';

-- =====================================================
-- 11. VERIFICAR FUNCIONES DE SEGURIDAD
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO FUNCIONES DE SEGURIDAD ===';
END $$;

SELECT 
    routine_name as funcion,
    routine_type as tipo,
    CASE 
        WHEN routine_name LIKE '%person%' THEN '✅ Función de personas'
        ELSE 'ℹ️ Otra función'
    END as descripcion
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%person%'
ORDER BY routine_name;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VALIDACIÓN COMPLETADA ===';
    RAISE NOTICE 'Revisa los resultados anteriores para verificar que todo esté correcto.';
    RAISE NOTICE 'Si hay errores (❌), revisa los scripts de migración correspondientes.';
END $$;
