-- ============================================================
-- VERIFICAR ESTRUCTURA DE configuration_audit_log
-- ============================================================

-- Ver columnas de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'configuration_audit_log'
ORDER BY ordinal_position;

-- Ver la definición completa
SELECT 
  'CREATE TABLE ' || table_name || ' (' || 
  string_agg(
    column_name || ' ' || 
    data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', '
  ) || ');' as table_definition
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'configuration_audit_log'
GROUP BY table_name;

