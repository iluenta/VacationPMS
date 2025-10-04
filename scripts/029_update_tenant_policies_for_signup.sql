-- Script para actualizar las políticas RLS de tenants para permitir creación durante el registro

-- Verificar el estado actual de RLS en la tabla tenants
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'tenants';

-- Listar políticas actuales para tenants
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tenants'
ORDER BY policyname;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view tenants for signup" ON public.tenants;
DROP POLICY IF EXISTS "Admin users can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admin users can update tenants" ON public.tenants;

-- Crear nuevas políticas para el nuevo flujo de registro

-- Política 1: Permitir que usuarios no autenticados vean todos los tenants (para compatibilidad)
CREATE POLICY "Anyone can view tenants"
  ON public.tenants FOR SELECT
  USING (true);

-- Política 2: Permitir que usuarios no autenticados inserten tenants (para el registro)
CREATE POLICY "Anyone can insert tenants for signup"
  ON public.tenants FOR INSERT
  WITH CHECK (true);

-- Política 3: Solo admins pueden actualizar tenants
CREATE POLICY "Admin users can update tenants"
  ON public.tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Verificar que las nuevas políticas están activas
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

-- Verificar que RLS está habilitado
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'tenants';
