-- ============================================================================
-- SCRIPT 099: ELIMINAR TRIGGER PROBLEMÁTICO DE PASSWORD_HASH
-- ============================================================================
-- Descripción: Elimina el trigger que causa el error "password_hash" field
-- Fecha: 2025-01-09
-- Autor: Sistema PMS
-- ============================================================================

-- IMPORTANTE: Este script debe ejecutarse DIRECTAMENTE en Supabase SQL Editor
-- No puede ejecutarse desde la aplicación debido a restricciones de permisos

BEGIN;

-- 1. Eliminar el trigger problemático
DROP TRIGGER IF EXISTS update_password_changed_at_trigger ON public.users;

-- 2. Eliminar la función asociada
DROP FUNCTION IF EXISTS public.update_password_changed_at();

-- 3. Verificar que se eliminaron correctamente
SELECT 
    'Trigger Status' as info,
    COUNT(*) as remaining_triggers
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_name = 'update_password_changed_at_trigger';

-- 4. Mostrar triggers restantes en la tabla users
SELECT 
    'Remaining Triggers' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
ORDER BY trigger_name;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES PARA EJECUTAR ESTE SCRIPT
-- ============================================================================
-- 1. Ve a https://supabase.com/dashboard
-- 2. Selecciona tu proyecto: pxuzmsugwfbppmedkkxp
-- 3. Ve a "SQL Editor" en el menú lateral
-- 4. Crea una nueva query
-- 5. Copia y pega este script completo
-- 6. Haz clic en "Run" para ejecutar
-- 7. Verifica que el resultado muestre "remaining_triggers: 0"
-- ============================================================================

