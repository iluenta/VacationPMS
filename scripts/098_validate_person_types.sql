-- ============================================================================
-- SCRIPT 098: VALIDAR TIPOS DE PERSONAS
-- ============================================================================
-- Descripción: Valida que los tipos de personas se crearon correctamente
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que existe al menos un tenant
DO $$
DECLARE
    tenant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    
    IF tenant_count = 0 THEN
        RAISE EXCEPTION 'No hay tenants disponibles. Crea al menos un tenant antes de ejecutar este script.';
    END IF;
    
    RAISE NOTICE 'Tenants disponibles: %', tenant_count;
END $$;

-- Mostrar tenants existentes
SELECT 
    id,
    name,
    description,
    is_active,
    created_at
FROM tenants
ORDER BY created_at;

-- Verificar si ya existen tipos de personas
DO $$
DECLARE
    existing_types_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_types_count
    FROM configuration_types
    WHERE name IN (
        'Cliente Propiedad',
        'Cliente Herramienta', 
        'Plataforma Distribución',
        'Proveedor',
        'Usuario Plataforma'
    );
    
    IF existing_types_count > 0 THEN
        RAISE NOTICE 'Ya existen % tipos de personas. Verificando...', existing_types_count;
        
        -- Mostrar los tipos existentes
        SELECT 
            ct.id,
            ct.name,
            ct.description,
            ct.tenant_id,
            t.name as tenant_name
        FROM configuration_types ct
        LEFT JOIN tenants t ON ct.tenant_id = t.id
        WHERE ct.name IN (
            'Cliente Propiedad',
            'Cliente Herramienta', 
            'Plataforma Distribución',
            'Proveedor',
            'Usuario Plataforma'
        )
        ORDER BY ct.name;
    ELSE
        RAISE NOTICE 'No existen tipos de personas. Listo para crear.';
    END IF;
END $$;
