-- ============================================================================
-- SCRIPT 100: VALIDACIÓN COMPLETA DEL SISTEMA DE PERSONAS
-- ============================================================================
-- Descripción: Valida que todo el sistema de personas esté listo
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- ============================================================================
-- VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER := 0;
BEGIN
    -- Verificar tablas necesarias
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        table_count := table_count + 1;
        RAISE NOTICE '✅ Tabla tenants existe';
    ELSE
        RAISE EXCEPTION '❌ Tabla tenants no existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') THEN
        table_count := table_count + 1;
        RAISE NOTICE '✅ Tabla configuration_types existe';
    ELSE
        RAISE EXCEPTION '❌ Tabla configuration_types no existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'persons') THEN
        table_count := table_count + 1;
        RAISE NOTICE '✅ Tabla persons existe';
    ELSE
        RAISE WARNING '⚠️ Tabla persons no existe - ejecuta scripts/094_create_person_tables.sql';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_contact_infos') THEN
        table_count := table_count + 1;
        RAISE NOTICE '✅ Tabla person_contact_infos existe';
    ELSE
        RAISE WARNING '⚠️ Tabla person_contact_infos no existe - ejecuta scripts/094_create_person_tables.sql';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_fiscal_addresses') THEN
        table_count := table_count + 1;
        RAISE NOTICE '✅ Tabla person_fiscal_addresses existe';
    ELSE
        RAISE WARNING '⚠️ Tabla person_fiscal_addresses no existe - ejecuta scripts/094_create_person_tables.sql';
    END IF;
    
    RAISE NOTICE 'Tablas verificadas: %', table_count;
END $$;

-- ============================================================================
-- VERIFICAR TENANTS
-- ============================================================================

DO $$
DECLARE
    tenant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    
    IF tenant_count = 0 THEN
        RAISE EXCEPTION '❌ No hay tenants disponibles. Crea al menos un tenant.';
    END IF;
    
    RAISE NOTICE '✅ Tenants disponibles: %', tenant_count;
END $$;

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

DO $$
DECLARE
    person_types_count INTEGER;
    required_types TEXT[] := ARRAY[
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    ];
    missing_types TEXT[] := ARRAY[]::TEXT[];
    type_name TEXT;
BEGIN
    -- Contar tipos existentes
    SELECT COUNT(*) INTO person_types_count
    FROM configuration_types
    WHERE name = ANY(required_types);
    
    -- Verificar tipos faltantes
    FOREACH type_name IN ARRAY required_types
    LOOP
        IF NOT EXISTS (SELECT 1 FROM configuration_types WHERE name = type_name) THEN
            missing_types := array_append(missing_types, type_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_types, 1) > 0 THEN
        RAISE WARNING '⚠️ Tipos de personas faltantes: %', array_to_string(missing_types, ', ');
        RAISE NOTICE 'Ejecuta scripts/096_create_person_types_simple.sql para crear los tipos faltantes';
    ELSE
        RAISE NOTICE '✅ Todos los tipos de personas están creados: %', person_types_count;
    END IF;
END $$;

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

DO $$
DECLARE
    user_count INTEGER;
    users_with_person INTEGER;
BEGIN
    -- Contar usuarios totales
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- Contar usuarios con person_id (si la columna existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'person_id'
    ) THEN
        SELECT COUNT(*) INTO users_with_person 
        FROM users 
        WHERE person_id IS NOT NULL;
        
        RAISE NOTICE '✅ Usuarios totales: %', user_count;
        RAISE NOTICE '✅ Usuarios con person_id: %', users_with_person;
        
        IF users_with_person < user_count THEN
            RAISE WARNING '⚠️ Algunos usuarios no tienen person_id asignado';
            RAISE NOTICE 'Ejecuta scripts/095_migrate_users_to_persons.sql para migrar usuarios';
        END IF;
    ELSE
        RAISE NOTICE '✅ Usuarios totales: %', user_count;
        RAISE WARNING '⚠️ Columna person_id no existe en users - ejecuta scripts/095_migrate_users_to_persons.sql';
    END IF;
END $$;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE VALIDACIÓN ===';
    RAISE NOTICE '1. Verifica que todas las tablas necesarias existan';
    RAISE NOTICE '2. Verifica que haya al menos un tenant';
    RAISE NOTICE '3. Verifica que los tipos de personas estén creados';
    RAISE NOTICE '4. Verifica el estado de migración de usuarios';
    RAISE NOTICE '';
    RAISE NOTICE 'Si hay warnings, ejecuta los scripts correspondientes:';
    RAISE NOTICE '- scripts/094_create_person_tables.sql (tablas)';
    RAISE NOTICE '- scripts/096_create_person_types_simple.sql (tipos)';
    RAISE NOTICE '- scripts/095_migrate_users_to_persons.sql (migración)';
    RAISE NOTICE '';
    RAISE NOTICE 'Una vez completado, el sistema de personas estará listo para usar.';
END $$;
