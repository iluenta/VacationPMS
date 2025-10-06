-- ============================================================
-- CORREGIR TRIGGER DE AUDITORÍA
-- ============================================================

-- El trigger está usando nombres de columnas incorrectos:
-- - Usa "operation" pero debería ser "action"
-- - Usa "old_data/new_data" pero debería ser "old_values/new_values"

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CORRIGIENDO FUNCIÓN DE TRIGGER';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================================
-- RECREAR FUNCIÓN CON NOMBRES DE COLUMNAS CORRECTOS
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
  -- Obtener el tenant_id del configuration_type
  SELECT tenant_id INTO config_tenant_id
  FROM configuration_types
  WHERE id = COALESCE(NEW.configuration_type_id, OLD.configuration_type_id);

  -- Insertar en audit log con nombres de columnas correctos
  INSERT INTO configuration_audit_log (
    tenant_id,
    table_name,
    action,          -- ← Correcto: "action" no "operation"
    record_id,
    old_values,      -- ← Correcto: "old_values" no "old_data"
    new_values,      -- ← Correcto: "new_values" no "new_data"
    user_id
  ) VALUES (
    config_tenant_id,
    TG_TABLE_NAME,
    TG_OP,           -- INSERT, UPDATE, DELETE
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- RECREAR TRIGGERS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RECREANDO TRIGGERS';
  RAISE NOTICE '===========================================';
END $$;

-- Trigger para configuration_types
DROP TRIGGER IF EXISTS configuration_types_audit_trigger ON public.configuration_types;
CREATE TRIGGER configuration_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.configuration_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_configuration_change();

-- Trigger para configuration_values
DROP TRIGGER IF EXISTS configuration_values_audit_trigger ON public.configuration_values;
CREATE TRIGGER configuration_values_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.configuration_values
  FOR EACH ROW
  EXECUTE FUNCTION public.log_configuration_change();

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
  
  RAISE NOTICE 'Triggers de auditoría creados: %', trigger_count;
  
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
-- MOSTRAR TRIGGERS
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
-- TEST
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PARA PROBAR:';
  RAISE NOTICE '1. Refresca la página';
  RAISE NOTICE '2. Intenta crear un valor de configuración';
  RAISE NOTICE '3. Debería funcionar sin error 42703';
  RAISE NOTICE '4. El registro debería aparecer en audit_log';
  RAISE NOTICE '===========================================';
END $$;

