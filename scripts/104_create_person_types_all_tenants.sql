-- ============================================================================
-- SCRIPT 104: CREAR TIPOS DE PERSONAS PARA TODOS LOS TENANTS
-- ============================================================================
-- Descripción: Inserta los tipos de personas en la tabla configuration_types
--              para todos los tenants existentes en el sistema
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') THEN
        RAISE EXCEPTION 'La tabla configuration_types no existe. Ejecuta primero los scripts de configuración.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE EXCEPTION 'La tabla tenants no existe. Ejecuta primero los scripts de tenants.';
    END IF;
END $$;

-- ============================================================================
-- INSERTAR TIPOS DE PERSONAS PARA TODOS LOS TENANTS
-- ============================================================================

DO $$
DECLARE
    tenant_record RECORD;
    person_types_count INTEGER;
    total_tenants INTEGER := 0;
    total_inserted INTEGER := 0;
BEGIN
    -- Iterar sobre todos los tenants
    FOR tenant_record IN 
        SELECT id, name FROM tenants ORDER BY name
    LOOP
        total_tenants := total_tenants + 1;
        
        RAISE NOTICE 'Procesando tenant: % (ID: %)', tenant_record.name, tenant_record.id;
        
        -- Insertar tipos de personas para este tenant
        INSERT INTO configuration_types (name, description, icon, color, is_active, sort_order, tenant_id) VALUES
        ('Cliente Propiedad', 'Clientes que alquilan o compran propiedades', 'user', '#3B82F6', true, 1, tenant_record.id),
        ('Cliente Herramienta', 'Clientes que usan la plataforma como herramienta', 'tool', '#10B981', true, 2, tenant_record.id),
        ('Plataforma Distribución', 'Plataformas que distribuyen alquileres', 'globe', '#F59E0B', true, 3, tenant_record.id),
        ('Proveedor', 'Proveedores de servicios', 'truck', '#EF4444', true, 4, tenant_record.id),
        ('Usuario Plataforma', 'Usuarios internos de la plataforma', 'users', '#8B5CF6', true, 5, tenant_record.id)
        ON CONFLICT (name, tenant_id) DO NOTHING;
        
        -- Contar los tipos insertados para este tenant
        SELECT COUNT(*) INTO person_types_count
        FROM configuration_types
        WHERE name IN (
            'Cliente Propiedad',
            'Cliente Herramienta', 
            'Plataforma Distribución',
            'Proveedor',
            'Usuario Plataforma'
        ) AND tenant_id = tenant_record.id;
        
        total_inserted := total_inserted + person_types_count;
        
        RAISE NOTICE '  - Tipos de personas para %: %', tenant_record.name, person_types_count;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN:';
    RAISE NOTICE '  - Tenants procesados: %', total_tenants;
    RAISE NOTICE '  - Total tipos insertados: %', total_inserted;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    tenant_record RECORD;
    person_types_count INTEGER;
    total_tenants INTEGER := 0;
    tenants_with_types INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN FINAL:';
    RAISE NOTICE '========================================';
    
    -- Verificar cada tenant
    FOR tenant_record IN 
        SELECT id, name FROM tenants ORDER BY name
    LOOP
        total_tenants := total_tenants + 1;
        
        -- Contar tipos de persona para este tenant
        SELECT COUNT(*) INTO person_types_count
        FROM configuration_types
        WHERE name IN (
            'Cliente Propiedad',
            'Cliente Herramienta', 
            'Plataforma Distribución',
            'Proveedor',
            'Usuario Plataforma'
        ) AND tenant_id = tenant_record.id;
        
        IF person_types_count >= 5 THEN
            tenants_with_types := tenants_with_types + 1;
            RAISE NOTICE '✅ %: % tipos de persona', tenant_record.name, person_types_count;
        ELSE
            RAISE NOTICE '❌ %: % tipos de persona (FALTAN)', tenant_record.name, person_types_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN FINAL:';
    RAISE NOTICE '  - Total tenants: %', total_tenants;
    RAISE NOTICE '  - Tenants con tipos completos: %', tenants_with_types;
    RAISE NOTICE '  - Tenants incompletos: %', (total_tenants - tenants_with_types);
    RAISE NOTICE '========================================';
END $$;
