-- Script para corregir las políticas RLS de la tabla users
-- Permitir que usuarios autenticados puedan acceder a su propio perfil

-- Eliminar TODAS las políticas existentes de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users (fixed)" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user (fixed)" ON public.users;

-- Crear políticas corregidas para users
-- Permitir que usuarios autenticados vean su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Permitir que usuarios autenticados actualicen su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Solo admins pueden ver todos los usuarios
CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Solo admins pueden actualizar cualquier usuario
CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (
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
