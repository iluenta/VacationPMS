-- ============================================================
-- TEST DE POLÍTICAS RLS
-- ============================================================

-- Este script verifica que las políticas RLS funcionan correctamente
-- Ejecutar después de aplicar el script 080

-- ============================================================
-- 1. VERIFICAR ESTADO DE RLS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '1. VERIFICANDO ESTADO DE RLS';
  RAISE NOTICE '===========================================';
END $$;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as estado_rls
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

-- ============================================================
-- 2. CONTAR POLÍTICAS POR TABLA
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '2. CONTANDO POLÍTICAS POR TABLA';
  RAISE NOTICE '===========================================';
END $$;

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

-- ============================================================
-- 3. LISTAR TODAS LAS POLÍTICAS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '3. LISTANDO TODAS LAS POLÍTICAS';
  RAISE NOTICE '===========================================';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as comando,
  CASE 
    WHEN permissive THEN 'Permisivo'
    ELSE 'Restrictivo'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants',
    'users',
    'configuration_types',
    'configuration_values',
    'configuration_audit_log'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- 4. VERIFICAR FUNCIONES HELPER
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '4. VERIFICANDO FUNCIONES HELPER';
  RAISE NOTICE '===========================================';
END $$;

SELECT 
  routine_name as nombre_funcion,
  routine_type as tipo,
  data_type as retorna,
  security_type as seguridad
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_current_tenant_id', 'is_user_admin')
ORDER BY routine_name;

-- ============================================================
-- 5. TEST DE DATOS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '5. TEST DE DATOS';
  RAISE NOTICE '===========================================';
END $$;

-- Contar registros en cada tabla
SELECT 
  'tenants' as tabla,
  COUNT(*) as total_registros
FROM public.tenants
UNION ALL
SELECT 
  'users' as tabla,
  COUNT(*) as total_registros
FROM public.users
UNION ALL
SELECT 
  'configuration_types' as tabla,
  COUNT(*) as total_registros
FROM public.configuration_types
UNION ALL
SELECT 
  'configuration_values' as tabla,
  COUNT(*) as total_registros
FROM public.configuration_values
UNION ALL
SELECT 
  'configuration_audit_log' as tabla,
  COUNT(*) as total_registros
FROM public.configuration_audit_log
ORDER BY tabla;

-- ============================================================
-- 6. VERIFICAR INTEGRIDAD DE DATOS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '6. VERIFICANDO INTEGRIDAD DE DATOS';
  RAISE NOTICE '===========================================';
END $$;

-- Usuarios sin tenant
SELECT 
  'Usuarios sin tenant asignado' as verificacion,
  COUNT(*) as cantidad
FROM public.users
WHERE tenant_id IS NULL;

-- Configuraciones sin tenant
SELECT 
  'Configuraciones sin tenant' as verificacion,
  COUNT(*) as cantidad
FROM public.configuration_types
WHERE tenant_id IS NULL;

-- Valores huérfanos (sin tipo de configuración)
SELECT 
  'Valores huérfanos' as verificacion,
  COUNT(*) as cantidad
FROM public.configuration_values cv
WHERE NOT EXISTS (
  SELECT 1 FROM public.configuration_types ct
  WHERE ct.id = cv.configuration_type_id
);

-- ============================================================
-- 7. RESUMEN FINAL
-- ============================================================

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  total_policies INTEGER;
BEGIN
  -- Contar tablas con RLS
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'tenants',
      'users',
      'configuration_types',
      'configuration_values',
      'configuration_audit_log'
    );
    
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
    
  -- Contar políticas
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
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RESUMEN FINAL';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tablas totales: %', total_tables;
  RAISE NOTICE 'Tablas con RLS habilitado: %', tables_with_rls;
  RAISE NOTICE 'Total de políticas: %', total_policies;
  RAISE NOTICE '';
  
  IF tables_with_rls = total_tables THEN
    RAISE NOTICE '✅ TODAS LAS TABLAS TIENEN RLS HABILITADO';
  ELSE
    RAISE WARNING '⚠️ FALTAN % TABLAS POR HABILITAR RLS', (total_tables - tables_with_rls);
  END IF;
  
  IF total_policies >= 16 THEN  -- Mínimo esperado
    RAISE NOTICE '✅ POLÍTICAS RLS CONFIGURADAS CORRECTAMENTE';
  ELSE
    RAISE WARNING '⚠️ FALTAN POLÍTICAS RLS (se esperan al menos 16, hay %)', total_policies;
  END IF;
  
  RAISE NOTICE '===========================================';
END $$;

