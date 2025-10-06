-- ============================================================
-- CORREGIR POLÍTICAS RLS - VERSIÓN SEGURA
-- ============================================================

-- Este script REEMPLAZA las políticas actuales con políticas seguras
-- Ejecutar después de verificar el estado actual (script 079)

BEGIN;

-- ============================================================
-- PASO 1: ELIMINAR POLÍTICAS INSEGURAS ACTUALES
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 1: Eliminando políticas inseguras...';
  RAISE NOTICE '===========================================';
END $$;

-- Eliminar políticas de tenants (INSEGURAS)
DROP POLICY IF EXISTS "Anyone can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can insert tenants for signup" ON public.tenants;
DROP POLICY IF EXISTS "Admin users can update tenants" ON public.tenants;

-- Eliminar políticas de configuration_types (restrictivas en exceso)
DROP POLICY IF EXISTS "Users can view their tenant's configuration types" ON public.configuration_types;
DROP POLICY IF EXISTS "Only admins can insert configuration types" ON public.configuration_types;
DROP POLICY IF EXISTS "Only admins can update configuration types" ON public.configuration_types;
DROP POLICY IF EXISTS "Only admins can delete configuration types" ON public.configuration_types;

-- Eliminar políticas de configuration_values
DROP POLICY IF EXISTS "Users can view their tenant's configuration values" ON public.configuration_values;
DROP POLICY IF EXISTS "Users can insert configuration values in their tenant" ON public.configuration_values;
DROP POLICY IF EXISTS "Users can update their tenant's configuration values" ON public.configuration_values;
DROP POLICY IF EXISTS "Only admins can delete configuration values" ON public.configuration_values;

-- Eliminar políticas de configuration_audit_log
DROP POLICY IF EXISTS "Users can view audit log of their tenant" ON public.configuration_audit_log;

-- ============================================================
-- PASO 2: CREAR FUNCIONES HELPER SEGURAS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 2: Creando funciones helper...';
  RAISE NOTICE '===========================================';
END $$;

-- Función para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Obtener tenant_id desde public.users (NO desde auth metadata)
  RETURN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- Función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Verificar is_admin desde public.users (NO desde auth metadata)
  RETURN COALESCE((
    SELECT is_admin
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1
  ), false);
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO authenticated;

-- ============================================================
-- PASO 3: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 3: Habilitando RLS...';
  RAISE NOTICE '===========================================';
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 4: CREAR POLÍTICAS SEGURAS - TABLA: tenants
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 4: Creando políticas para tenants...';
  RAISE NOTICE '===========================================';
END $$;

-- SELECT: Usuarios ven solo su tenant, admins ven todos
CREATE POLICY "tenants_select_policy"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- INSERT: Solo admins pueden crear tenants
CREATE POLICY "tenants_insert_policy"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (public.is_user_admin() = true);

-- UPDATE: Solo admins pueden actualizar tenants
CREATE POLICY "tenants_update_policy"
ON public.tenants
FOR UPDATE
TO authenticated
USING (public.is_user_admin() = true)
WITH CHECK (public.is_user_admin() = true);

-- DELETE: Solo admins pueden eliminar tenants
CREATE POLICY "tenants_delete_policy"
ON public.tenants
FOR DELETE
TO authenticated
USING (public.is_user_admin() = true);

-- ============================================================
-- PASO 5: CREAR POLÍTICAS SEGURAS - TABLA: users
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 5: Creando políticas para users...';
  RAISE NOTICE '===========================================';
END $$;

-- SELECT: Usuarios ven solo su perfil, admins ven todos
CREATE POLICY "users_select_policy"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_user_admin() = true
);

-- UPDATE: Usuarios actualizan solo su perfil, admins actualizan todos
CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.is_user_admin() = true
)
WITH CHECK (
  id = auth.uid()
  OR public.is_user_admin() = true
);

-- INSERT: Solo admins pueden crear usuarios
CREATE POLICY "users_insert_policy"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_user_admin() = true);

-- DELETE: Solo admins pueden eliminar usuarios
CREATE POLICY "users_delete_policy"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_user_admin() = true);

-- ============================================================
-- PASO 6: CREAR POLÍTICAS SEGURAS - TABLA: configuration_types
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 6: Creando políticas para configuration_types...';
  RAISE NOTICE '===========================================';
END $$;

-- SELECT: Usuarios ven configuraciones de su tenant, admins ven todas
CREATE POLICY "configuration_types_select_policy"
ON public.configuration_types
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- INSERT: Usuarios crean en su tenant, admins en cualquier tenant
CREATE POLICY "configuration_types_insert_policy"
ON public.configuration_types
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- UPDATE: Usuarios actualizan de su tenant, admins de cualquier tenant
CREATE POLICY "configuration_types_update_policy"
ON public.configuration_types
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
)
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- DELETE: Usuarios eliminan de su tenant, admins de cualquier tenant
CREATE POLICY "configuration_types_delete_policy"
ON public.configuration_types
FOR DELETE
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- ============================================================
-- PASO 7: CREAR POLÍTICAS SEGURAS - TABLA: configuration_values
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 7: Creando políticas para configuration_values...';
  RAISE NOTICE '===========================================';
END $$;

-- SELECT: Basado en tenant del configuration_type padre
CREATE POLICY "configuration_values_select_policy"
ON public.configuration_values
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (
      ct.tenant_id = public.get_current_tenant_id()
      OR public.is_user_admin() = true
    )
  )
);

-- INSERT: Basado en tenant del configuration_type padre
CREATE POLICY "configuration_values_insert_policy"
ON public.configuration_values
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (
      ct.tenant_id = public.get_current_tenant_id()
      OR public.is_user_admin() = true
    )
  )
);

-- UPDATE: Basado en tenant del configuration_type padre
CREATE POLICY "configuration_values_update_policy"
ON public.configuration_values
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (
      ct.tenant_id = public.get_current_tenant_id()
      OR public.is_user_admin() = true
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (
      ct.tenant_id = public.get_current_tenant_id()
      OR public.is_user_admin() = true
    )
  )
);

-- DELETE: Basado en tenant del configuration_type padre
CREATE POLICY "configuration_values_delete_policy"
ON public.configuration_values
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.configuration_types ct
    WHERE ct.id = configuration_values.configuration_type_id
    AND (
      ct.tenant_id = public.get_current_tenant_id()
      OR public.is_user_admin() = true
    )
  )
);

-- ============================================================
-- PASO 8: CREAR POLÍTICAS SEGURAS - TABLA: configuration_audit_log
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 8: Creando políticas para audit_log...';
  RAISE NOTICE '===========================================';
END $$;

-- SELECT: Solo lectura, filtrado por tenant
CREATE POLICY "configuration_audit_log_select_policy"
ON public.configuration_audit_log
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.is_user_admin() = true
);

-- INSERT: Los triggers pueden insertar (SECURITY DEFINER en trigger)
-- No necesitamos política INSERT para usuarios normales

-- ============================================================
-- PASO 9: VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  total_policies INTEGER;
  tables_with_rls INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PASO 9: Verificación final...';
  RAISE NOTICE '===========================================';
  
  -- Contar políticas creadas
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'tenants',
      'users',
      'configuration_types',
      'configuration_values',
      'configuration_audit_log'
    );
  
  -- Contar tablas con RLS
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'tenants',
      'users',
      'configuration_types',
      'configuration_values',
      'configuration_audit_log'
    )
    AND rowsecurity = true;
  
  RAISE NOTICE 'Tablas con RLS habilitado: %', tables_with_rls;
  RAISE NOTICE 'Total de políticas creadas: %', total_policies;
  RAISE NOTICE '';
  
  IF tables_with_rls = 5 THEN
    RAISE NOTICE '✅ TODAS LAS TABLAS TIENEN RLS HABILITADO';
  ELSE
    RAISE WARNING '⚠️ FALTAN TABLAS POR HABILITAR RLS';
  END IF;
  
  IF total_policies >= 21 THEN  -- 4+4+4+4+1 = 17 mínimo esperado
    RAISE NOTICE '✅ POLÍTICAS RLS CONFIGURADAS CORRECTAMENTE (% políticas)', total_policies;
  ELSE
    RAISE WARNING '⚠️ FALTAN POLÍTICAS RLS (se esperan al menos 21, hay %)', total_policies;
  END IF;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ SCRIPT COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '===========================================';
END $$;

COMMIT;

-- ============================================================
-- MOSTRAR RESUMEN
-- ============================================================

-- Ver estado de RLS
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants',
    'users',
    'configuration_types',
    'configuration_values',
    'configuration_audit_log'
  )
ORDER BY tablename;

-- Ver políticas creadas por tabla
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants',
    'users',
    'configuration_types',
    'configuration_values',
    'configuration_audit_log'
  )
GROUP BY tablename
ORDER BY tablename;

