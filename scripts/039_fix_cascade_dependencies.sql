-- Script corregido para manejar dependencias en cascada

-- 1. Eliminar políticas RLS que dependen de is_admin() con CASCADE
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users CASCADE;

-- 2. Ahora eliminar la función is_admin() sin problemas
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 3. Recrear la función is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
  );
END;
$$;

-- 4. Recrear las políticas RLS que usan is_admin()
CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- 5. Verificar que todo se creó correctamente
SELECT 
    'Function recreated successfully' as status,
    proname as function_name
FROM pg_proc 
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
    'Policies recreated successfully' as status,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname LIKE 'Admin users can %'
ORDER BY policyname;
