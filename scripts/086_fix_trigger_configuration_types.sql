-- ============================================================
-- CORREGIR TRIGGER PARA CONFIGURATION_TYPES
-- ============================================================
-- El problema: el trigger está intentando acceder a NEW.configuration_type_id
-- pero en la tabla configuration_types no existe ese campo.
-- Solo existe en configuration_values.

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CORRIGIENDO TRIGGER PARA CONFIGURATION_TYPES';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================================
-- RECREAR FUNCIÓN CON LÓGICA CORRECTA
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_configuration_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_tenant_id uuid;
BEGIN
  -- Determinar el tenant_id según la tabla
  IF TG_TABLE_NAME = 'configuration_types' THEN
    -- Para configuration_types, el tenant_id está directamente en el registro
    config_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  ELSIF TG_TABLE_NAME = 'configuration_values' THEN
    -- Para configuration_values, necesitamos obtener el tenant_id del configuration_type
    SELECT ct.tenant_id INTO config_tenant_id
    FROM configuration_types ct
    WHERE ct.id = COALESCE(NEW.configuration_type_id, OLD.configuration_type_id);
  END IF;

  -- Insertar en audit log
  INSERT INTO configuration_audit_log (
    tenant_id,
    table_name,
    action,
    record_id,
    old_values,
    new_values,
    user_id
  ) VALUES (
    config_tenant_id,
    TG_TABLE_NAME,
    TG_OP, -- INSERT, UPDATE, DELETE
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICACIÓN';
  RAISE NOTICE '===========================================';
  
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND event_object_table IN ('configuration_types', 'configuration_values')
    AND trigger_name LIKE '%audit_trigger';
  
  RAISE NOTICE 'Triggers de auditoría activos: %', trigger_count;
  
  IF trigger_count = 2 THEN
    RAISE NOTICE '✅ Triggers configurados correctamente';
  ELSE
    RAISE WARNING '⚠️ Problema con triggers (esperados: 2, encontrados: %)', trigger_count;
  END IF;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ CORRECCIÓN COMPLETADA';
  RAISE NOTICE '===========================================';
END $$;

COMMIT;

-- ============================================================
-- MOSTRAR TRIGGERS ACTUALES
-- ============================================================

SELECT 
  event_object_table as tabla,
  trigger_name,
  action_timing as timing,
  string_agg(event_manipulation, ', ') as eventos
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('configuration_types', 'configuration_values')
  AND trigger_name LIKE '%audit_trigger'
GROUP BY event_object_table, trigger_name, action_timing
ORDER BY event_object_table;

-- ============================================================
-- TEST MANUAL
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PARA PROBAR:';
  RAISE NOTICE '1. Ve a la aplicación web';
  RAISE NOTICE '2. Intenta crear una nueva configuración';
  RAISE NOTICE '3. Debería funcionar sin error 42703';
  RAISE NOTICE '4. El registro debería aparecer en audit_log';
  RAISE NOTICE '===========================================';
END $$;
