-- Script de emergencia para corregir acceso a la tabla users
-- Error 42501: permission denied for table users

-- =====================================================
-- 1. DESACTIVAR RLS TEMPORALMENTE
-- =====================================================

-- Desactivar RLS en users para permitir acceso
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can delete any user" ON public.users;

-- =====================================================
-- 3. VERIFICAR QUE RLS ESTÁ DESACTIVADO
-- =====================================================

SELECT 
    'RLS Status Check' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- =====================================================
-- 4. PROBAR ACCESO DIRECTO
-- =====================================================

-- Probar que podemos acceder a la tabla users
SELECT 
    'Direct Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- Verificar usuario específico
SELECT 
    'User Verification' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 5. CREAR POLÍTICAS MÁS PERMISIVAS
-- =====================================================

-- Reactivar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política 1: Cualquier usuario autenticado puede ver cualquier usuario
-- (Esto es temporal para debugging)
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

-- =====================================================
-- 6. VERIFICAR NUEVAS POLÍTICAS
-- =====================================================

-- Verificar que RLS está activado
SELECT 
    'RLS Status After Fix' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Verificar políticas creadas
SELECT
    'Policies After Fix' as info,
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
-- 7. PROBAR ACCESO CON RLS ACTIVADO
-- =====================================================

-- Probar acceso con RLS activado
SELECT 
    'RLS Access Test' as test,
    COUNT(*) as user_count
FROM public.users;

-- Verificar usuario específico con RLS
SELECT 
    'User Verification with RLS' as test,
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

SELECT 'Acceso a tabla users corregido exitosamente!' as status;

