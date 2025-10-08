-- ============================================================================
-- SCRIPT 101: DIAGNÓSTICO DE TABLA USERS
-- ============================================================================
-- Descripción: Diagnostica la estructura de la tabla users
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar que la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe';
    END IF;
    
    RAISE NOTICE 'La tabla users existe';
END $$;

-- Mostrar la estructura de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Mostrar las restricciones
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
ORDER BY tc.constraint_type, kcu.column_name;

-- Mostrar datos existentes
SELECT 
    id,
    email,
    tenant_id,
    created_at,
    updated_at
FROM users
ORDER BY created_at
LIMIT 10;

-- Contar registros
SELECT COUNT(*) as total_users FROM users;
