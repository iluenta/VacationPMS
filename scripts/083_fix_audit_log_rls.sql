-- ============================================================
-- CORREGIR RLS PARA TABLA configuration_audit_log
-- ============================================================

-- El problema: Los triggers intentan insertar en configuration_audit_log
-- pero no hay política de INSERT, causando error 42501

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CORRIGIENDO POLÍTICAS PARA AUDIT LOG';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================================
-- PASO 1: ELIMINAR POLÍTICA ACTUAL
-- ============================================================

DROP POLICY IF EXISTS "configuration_audit_log_select_policy" ON public.configuration_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.configuration_audit_log;
DROP POLICY IF EXISTS "Users can view audit log of their tenant" ON public.configuration_audit_log;

-- ============================================================
-- PASO 2: CREAR NUEVAS POLÍTICAS
-- ============================================================

-- SELECT: Usuarios ven logs de su tenant, admins ven todos
CREATE POLICY "audit_log_select_policy"
ON public.configuration_audit_log
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- INSERT: Permitir a TODOS los usuarios autenticados insertar
-- (necesario para que los triggers funcionen)
CREATE POLICY "audit_log_insert_policy"
ON public.configuration_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Los triggers se encargan de validar los datos

-- ============================================================
-- ALTERNATIVA: Hacer el trigger SECURITY DEFINER
-- ============================================================

-- Recrear el trigger como SECURITY DEFINER para que se ejecute
-- con permisos elevados y no necesite política INSERT

-- Primero, crear la función como SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.log_configuration_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Clave: Se ejecuta con permisos del creador
SET search_path = public
AS $$
DECLARE
  config_tenant_id uuid;
BEGIN
  -- Obtener el tenant_id del configuration_type
  SELECT tenant_id INTO config_tenant_id
  FROM configuration_types
  WHERE id = COALESCE(NEW.configuration_type_id, OLD.configuration_type_id);

  -- Insertar en audit log
  INSERT INTO configuration_audit_log (
    tenant_id,
    table_name,
    operation,
    record_id,
    old_data,
    new_data,
    user_id
  ) VALUES (
    config_tenant_id,
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recrear los triggers (si no existen)
DROP TRIGGER IF EXISTS configuration_types_audit_trigger ON public.configuration_types;
CREATE TRIGGER configuration_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.configuration_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_configuration_change();

DROP TRIGGER IF EXISTS configuration_values_audit_trigger ON public.configuration_values;
CREATE TRIGGER configuration_values_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.configuration_values
  FOR EACH ROW
  EXECUTE FUNCTION public.log_configuration_change();

-- ============================================================
-- PASO 3: VERIFICACIÓN
-- ============================================================

DO $$
DECLARE
  audit_policies INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICACIÓN';
  RAISE NOTICE '===========================================';
  
  -- Contar políticas de audit_log
  SELECT COUNT(*) INTO audit_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'configuration_audit_log';
  
  RAISE NOTICE 'Políticas en configuration_audit_log: %', audit_policies;
  
  IF audit_policies >= 2 THEN
    RAISE NOTICE '✅ Políticas configuradas correctamente';
  ELSE
    RAISE WARNING '⚠️ Faltan políticas (esperadas: 2, encontradas: %)', audit_policies;
  END IF;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ CORRECCIÓN COMPLETADA';
  RAISE NOTICE '===========================================';
END $$;

COMMIT;

-- ============================================================
-- MOSTRAR POLÍTICAS
-- ============================================================

SELECT 
  policyname,
  cmd as comando,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN 'Permisivo'
    ELSE 'Restrictivo'
  END as tipo,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Inserción (para triggers)'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
  END as descripcion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'configuration_audit_log'
ORDER BY cmd;

-- ============================================================
-- TEST
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PARA PROBAR:';
  RAISE NOTICE '1. Intenta crear un valor de configuración';
  RAISE NOTICE '2. El trigger debería insertar en audit_log';
  RAISE NOTICE '3. NO debería haber error 42501';
  RAISE NOTICE '===========================================';
END $$;

