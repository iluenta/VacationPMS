-- Implementar políticas RLS seguras para la tabla users
-- Estas políticas permiten acceso controlado sin causar recursión

-- Activar RLS en la tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Usuarios pueden insertar su propio perfil (para el trigger)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 4: Solo admins pueden ver todos los usuarios
-- Usamos una función auxiliar para evitar recursión
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (((auth.jwt()::jsonb) ->> 'user_metadata')::jsonb ->> 'is_admin')::boolean,
    false
  );
$$;

CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Política 5: Solo admins pueden actualizar cualquier usuario
CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- Verificar que las políticas están activas
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

-- Verificar que RLS está activado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';
