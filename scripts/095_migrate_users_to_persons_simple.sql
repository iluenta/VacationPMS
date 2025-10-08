-- ============================================================================
-- SCRIPT 095: MIGRAR USUARIOS EXISTENTES A PERSONAS (VERSIÓN SIMPLE)
-- ============================================================================
-- Descripción: Migra los usuarios existentes a la nueva tabla de personas
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que las tablas necesarias existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'persons') THEN
        RAISE EXCEPTION 'La tabla persons no existe. Ejecuta primero el script 094_create_person_tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuration_types') THEN
        RAISE EXCEPTION 'La tabla configuration_types no existe.';
    END IF;
END $$;

-- ============================================================================
-- PREPARACIÓN DE LA MIGRACIÓN
-- ============================================================================

-- Agregar columna person_id a users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'person_id'
    ) THEN
        ALTER TABLE users ADD COLUMN person_id UUID REFERENCES persons(id);
        RAISE NOTICE 'Columna person_id agregada a la tabla users';
    ELSE
        RAISE NOTICE 'Columna person_id ya existe en la tabla users';
    END IF;
END $$;

-- ============================================================================
-- MIGRACIÓN DE USUARIOS
-- ============================================================================

DO $$
DECLARE
    user_platform_type_id UUID;
    users_count INTEGER;
    migrated_count INTEGER := 0;
    user_record RECORD;
    new_person_id UUID;
    new_contact_id UUID;
BEGIN
    -- Obtener el ID del tipo "Usuario Plataforma" del Demo Tenant
    SELECT ct.id INTO user_platform_type_id
    FROM configuration_types ct
    JOIN tenants t ON ct.tenant_id = t.id
    WHERE ct.name = 'Usuario Plataforma' AND t.name = 'Demo Tenant'
    LIMIT 1;
    
    IF user_platform_type_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el tipo de persona "Usuario Plataforma". Ejecuta primero el script 096_create_person_types_final.sql';
    END IF;
    
    RAISE NOTICE 'ID del tipo "Usuario Plataforma": %', user_platform_type_id;
    
    -- Contar usuarios a migrar
    SELECT COUNT(*) INTO users_count FROM users WHERE person_id IS NULL;
    RAISE NOTICE 'Usuarios a migrar: %', users_count;
    
    -- Migrar usuarios a personas
    FOR user_record IN 
        SELECT 
            id,
            email,
            tenant_id,
            created_at,
            updated_at
        FROM users
        WHERE person_id IS NULL
    LOOP
        -- Generar nuevo ID para la persona
        new_person_id := gen_random_uuid();
        
        -- Insertar persona física (todos los usuarios son personas físicas)
        INSERT INTO persons (
            id,
            tenant_id,
            person_type_id,
            first_name,
            last_name,
            business_name,
            identification_type,
            identification_number,
            person_category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            new_person_id,
            user_record.tenant_id,
            user_platform_type_id,
            'Usuario', -- Nombre temporal
            'Migrado', -- Apellido temporal
            NULL,
            'PASSPORT', -- Tipo temporal
            'MIGRATED-' || user_record.id::TEXT, -- Número temporal único
            'PHYSICAL',
            true, -- is_active por defecto
            user_record.created_at,
            user_record.updated_at
        );
        
        -- Crear información de contacto con el email del usuario
        new_contact_id := gen_random_uuid();
        INSERT INTO person_contact_infos (
            id,
            person_id,
            tenant_id,
            contact_name,
            phone,
            email,
            position,
            is_primary,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            new_contact_id,
            new_person_id,
            user_record.tenant_id,
            'Usuario Principal',
            NULL,
            user_record.email,
            'Usuario de la Plataforma',
            true,
            true, -- is_active por defecto
            user_record.created_at,
            user_record.updated_at
        );
        
        -- Actualizar el usuario con el ID de la persona
        UPDATE users 
        SET person_id = new_person_id
        WHERE id = user_record.id;
        
        migrated_count := migrated_count + 1;
        
        -- Log de progreso cada 10 usuarios
        IF migrated_count % 10 = 0 THEN
            RAISE NOTICE 'Migrados % de % usuarios', migrated_count, users_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migración completada. Total de usuarios migrados: %', migrated_count;
END $$;

-- ============================================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================================================

-- Contar usuarios totales
SELECT 
    'Usuarios totales' as descripcion,
    COUNT(*)::TEXT as valor
FROM users;

-- Contar usuarios con person_id
SELECT 
    'Usuarios con person_id' as descripcion,
    COUNT(*)::TEXT as valor
FROM users 
WHERE person_id IS NOT NULL;

-- Contar personas creadas
SELECT 
    'Personas creadas' as descripcion,
    COUNT(*)::TEXT as valor
FROM persons;

-- Contar contactos creados
SELECT 
    'Contactos creados' as descripcion,
    COUNT(*)::TEXT as valor
FROM person_contact_infos;

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================================

-- Mostrar algunos ejemplos de la migración
SELECT 
    u.id as user_id,
    u.email,
    u.tenant_id,
    u.person_id,
    p.first_name,
    p.last_name,
    p.identification_number,
    p.person_category,
    p.is_active as person_active
FROM users u
JOIN persons p ON u.person_id = p.id
ORDER BY u.created_at
LIMIT 5;

-- Mostrar contactos creados
SELECT 
    pci.id,
    pci.person_id,
    pci.contact_name,
    pci.email,
    pci.is_primary,
    p.first_name,
    p.last_name
FROM person_contact_infos pci
JOIN persons p ON pci.person_id = p.id
WHERE pci.is_primary = true
ORDER BY pci.created_at
LIMIT 5;

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

COMMENT ON COLUMN users.person_id IS 'Referencia a la persona asociada al usuario (migrado desde usuarios existentes)';

SELECT 
    '=== MIGRACIÓN DE USUARIOS COMPLETADA ===' as mensaje,
    '' as detalle;

SELECT 
    'Los usuarios existentes han sido migrados a la nueva estructura de personas.' as mensaje,
    'Cada usuario ahora tiene una persona asociada con información de contacto.' as detalle;

SELECT 
    'Los datos originales se mantienen intactos en la tabla users.' as mensaje,
    'Para completar la migración, actualiza manualmente los nombres y datos de las personas según sea necesario.' as detalle;
