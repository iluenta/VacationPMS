-- Script para corregir la recursión infinita en las políticas RLS

-- Primero, eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

-- Mantener solo las políticas básicas que no causan recursión
-- (Las políticas básicas ya están creadas y funcionan correctamente)

-- Crear políticas corregidas para admins que no causen recursión
-- Para que los admins puedan ver todos los usuarios sin recursión
CREATE POLICY "Admin users can view all users (fixed)"
  ON public.users FOR SELECT
  USING (
    -- Verificar si el usuario actual es admin usando auth.users directamente
    -- Esto evita la recursión porque no consulta la tabla public.users
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Política para que los admins puedan actualizar cualquier usuario
CREATE POLICY "Admin users can update any user (fixed)"
  ON public.users FOR UPDATE
  USING (
    -- Misma lógica para evitar recursión
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Verificar que las políticas están correctas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;
