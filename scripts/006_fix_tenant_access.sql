-- Script para corregir el acceso a la tabla tenants para usuarios no autenticados

-- Eliminar TODAS las políticas existentes de tenants
DROP POLICY IF EXISTS "Admin users can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admin users can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admin users can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can view tenants for signup" ON public.tenants;

-- Crear políticas corregidas para tenants
-- Permitir que usuarios no autenticados vean todos los tenants (para el signup)
CREATE POLICY "Anyone can view tenants for signup"
  ON public.tenants FOR SELECT
  USING (true);

-- Solo admins pueden insertar tenants
CREATE POLICY "Admin users can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Solo admins pueden actualizar tenants
CREATE POLICY "Admin users can update tenants"
  ON public.tenants FOR UPDATE
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
AND tablename = 'tenants'
ORDER BY policyname;
