-- Script para crear función que genere tenants con ID correlativo
-- Esta función se usará en el proceso de registro para crear automáticamente un tenant

-- Función para generar el siguiente ID correlativo para tenants
CREATE OR REPLACE FUNCTION public.get_next_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_id uuid;
  max_sequence bigint;
BEGIN
  -- Obtener el máximo número de secuencia actual
  SELECT COALESCE(MAX(CAST(SUBSTRING(id::text, 1, 8) AS bigint)), 0) + 1
  INTO max_sequence
  FROM public.tenants
  WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND SUBSTRING(id::text, 1, 8) ~ '^[0-9a-f]{8}$';
  
  -- Generar el nuevo UUID con el número de secuencia
  next_id := LPAD(TO_HEX(max_sequence), 8, '0') || '-0000-4000-8000-000000000000';
  
  RETURN next_id;
END;
$$;

-- Función para crear un tenant con ID correlativo
CREATE OR REPLACE FUNCTION public.create_tenant_with_correlative_id(
  tenant_name text,
  tenant_slug text
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Generar el siguiente ID correlativo
  new_id := public.get_next_tenant_id();
  
  -- Insertar el nuevo tenant
  INSERT INTO public.tenants (id, name, slug, created_at, updated_at)
  VALUES (new_id, tenant_name, tenant_slug, timezone('utc'::text, now()), timezone('utc'::text, now()));
  
  -- Retornar los datos del tenant creado
  RETURN QUERY
  SELECT t.id, t.name, t.slug, t.created_at
  FROM public.tenants t
  WHERE t.id = new_id;
END;
$$;

-- Verificar que las funciones se crearon correctamente
SELECT 
    'Functions created successfully' as status,
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_next_tenant_id', 'create_tenant_with_correlative_id')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Probar la función con un ejemplo
-- SELECT * FROM public.create_tenant_with_correlative_id('Test Organization', 'test-org');
