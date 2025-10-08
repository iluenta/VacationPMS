-- ============================================================================
-- SCRIPT 102: DIAGNÓSTICO DE TRIGGERS EN TABLA USERS
-- ============================================================================
-- Descripción: Diagnostica los triggers existentes en la tabla users
-- Fecha: 2025-01-07
-- Autor: Sistema PMS
-- ============================================================================

-- Verificar triggers en la tabla users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- Verificar funciones de triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%password%' 
   OR routine_name LIKE '%user%'
   OR routine_name LIKE '%update%'
ORDER BY routine_name;

-- Verificar si existe la columna password_hash
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name LIKE '%password%'
ORDER BY column_name;
