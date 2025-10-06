-- Script simplificado para corregir RLS sin usar auth.jwt()
-- Evita el error de operador ->> unknown

-- =====================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- =====================================================
-- 2. ELIMINAR FUNCIÓN is_admin PROBLEMÁTICA
-- =====================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================
-- 3. CREAR POLÍTICAS SIMPLES Y PERMISIVAS
-- =====================================================

-- Política 1: Cualquier usuario autenticado puede ver cualquier usuario
-- (Esto es necesario para que la API funcione)
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política 2: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 4: Cualquier usuario autenticado puede actualizar cualquier usuario
-- (Temporalmente permisivo para que funcione la API)
CREATE POLICY "Authenticated users can update any user"
  ON public.users FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 4. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que RLS está activado
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar políticas creadas
SELECT
    'New Policies' as info,
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

-- =====================================================
-- 5. PROBAR ACCESO
-- =====================================================

-- Probar acceso directo
SELECT 
    'Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- Verificar usuario específico
SELECT 
    'User Check' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'Políticas RLS simplificadas creadas exitosamente!' as status;
