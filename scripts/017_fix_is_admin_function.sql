-- Script para corregir la función is_admin() usando auth.users directamente

-- Eliminar la función is_admin() existente
DROP FUNCTION IF EXISTS public.is_admin();

-- Crear una nueva función is_admin() que use auth.users directamente
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (raw_user_meta_data->>'is_admin')::boolean 
     FROM auth.users 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Verificar que la función se creó correctamente
SELECT 
    'is_admin function updated' as status,
    public.is_admin() as is_admin_result;

-- Probar la función con el usuario actual
SELECT 
    'Testing updated is_admin() function' as test_name,
    public.is_admin() as is_admin_result;
