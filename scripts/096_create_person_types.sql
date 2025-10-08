-- ============================================================================
-- SCRIPT 096: CREAR TIPOS DE PERSONAS EN CONFIGURACIÓN
-- ============================================================================
-- Descripción: Inserta los tipos de personas en la tabla configuration_types
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que la tabla configuration_types existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') THEN
        RAISE EXCEPTION 'La tabla configuration_types no existe. Ejecuta primero los scripts de configuración.';
    END IF;
END $$;

-- ============================================================================
-- INSERTAR TIPOS DE PERSONAS
-- ============================================================================

DO $$
DECLARE
    default_tenant_id UUID;
    person_types_count INTEGER;
BEGIN
    -- Obtener el primer tenant disponible o crear uno por defecto
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    -- Si no hay tenants, crear uno por defecto para los tipos globales
    IF default_tenant_id IS NULL THEN
        -- Intentar insertar con is_active si existe, sino solo con name
        BEGIN
            INSERT INTO tenants (name, is_active) 
            VALUES ('Sistema Global', true)
            RETURNING id INTO default_tenant_id;
        EXCEPTION WHEN OTHERS THEN
            -- Si falla, intentar solo con name
            INSERT INTO tenants (name) 
            VALUES ('Sistema Global')
            RETURNING id INTO default_tenant_id;
        END;
        
        RAISE NOTICE 'Creado tenant por defecto: %', default_tenant_id;
    END IF;
    
    RAISE NOTICE 'Usando tenant para tipos de personas: %', default_tenant_id;
    
    -- Insertar tipos de personas en configuration_types
    INSERT INTO configuration_types (name, description, icon, color, is_active, sort_order, tenant_id) VALUES
    ('Cliente Propiedad', 'Clientes que alquilan o compran propiedades', 'user', '#3B82F6', true, 1, default_tenant_id),
    ('Cliente Herramienta', 'Clientes que usan la plataforma como herramienta', 'tool', '#10B981', true, 2, default_tenant_id),
    ('Plataforma Distribución', 'Plataformas que distribuyen alquileres', 'globe', '#F59E0B', true, 3, default_tenant_id),
    ('Proveedor', 'Proveedores de servicios', 'truck', '#EF4444', true, 4, default_tenant_id),
    ('Usuario Plataforma', 'Usuarios internos de la plataforma', 'users', '#8B5CF6', true, 5, default_tenant_id)
    ON CONFLICT (name, tenant_id) DO NOTHING;
    
    -- Contar los tipos insertados
    SELECT COUNT(*) INTO person_types_count
    FROM configuration_types
    WHERE name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    ) AND tenant_id = default_tenant_id;
    
    RAISE NOTICE 'Tipos de personas insertados: %', person_types_count;
END $$;

-- ============================================================================
-- VERIFICACIÓN DE LA INSERCIÓN
-- ============================================================================

DO $$
DECLARE
    person_types_count INTEGER;
    default_tenant_id UUID;
BEGIN
    -- Obtener el tenant usado
    SELECT id INTO default_tenant_id FROM tenants WHERE name = 'Sistema Global' LIMIT 1;
    
    -- Si no existe el tenant "Sistema Global", usar el primero disponible
    IF default_tenant_id IS NULL THEN
        SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    END IF;
    
    -- Contar los tipos de personas insertados
    SELECT COUNT(*) INTO person_types_count
    FROM configuration_types
    WHERE name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    ) AND tenant_id = default_tenant_id;
    
    IF person_types_count < 5 THEN
        RAISE EXCEPTION 'No se insertaron todos los tipos de personas. Esperados: 5, Insertados: %', person_types_count;
    END IF;
    
    RAISE NOTICE 'Se insertaron correctamente % tipos de personas en el tenant %', person_types_count, default_tenant_id;
END $$;

-- ============================================================================
-- CONSULTA DE VERIFICACIÓN
-- ============================================================================

-- Mostrar los tipos de personas creados
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Obtener el tenant usado
    SELECT id INTO default_tenant_id FROM tenants WHERE name = 'Sistema Global' LIMIT 1;
    
    -- Si no existe el tenant "Sistema Global", usar el primero disponible
    IF default_tenant_id IS NULL THEN
        SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Mostrando tipos de personas para el tenant: %', default_tenant_id;
END $$;

SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    ct.is_active,
    ct.sort_order,
    ct.tenant_id,
    t.name as tenant_name,
    ct.created_at
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
