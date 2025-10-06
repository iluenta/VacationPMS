-- ============================================================
-- Verificar estado de RLS en todas las tablas
-- ============================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
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

-- Ver políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

