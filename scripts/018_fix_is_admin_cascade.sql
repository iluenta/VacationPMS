-- Script para corregir la función is_admin() eliminando dependencias primero

-- 1. Eliminar las políticas que dependen de is_admin()
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- 2. Ahora eliminar la función is_admin()
DROP FUNCTION IF EXISTS public.is_admin();

-- 3. Crear una nueva función is_admin() que use auth.users directamente
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

-- 4. Recrear las políticas con la nueva función
CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- 5. Verificar que todo funciona correctamente
SELECT 
    'is_admin function updated successfully' as status,
    public.is_admin() as is_admin_result;

-- 6. Verificar que las políticas se recrearon
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
AND policyname LIKE '%Admin%'
ORDER BY policyname;
