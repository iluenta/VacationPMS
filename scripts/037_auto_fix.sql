-- Script de reparación automática para solucionar todos los problemas identificados

-- 1. Recrear el trigger de usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce((new.raw_user_meta_data ->> 'tenant_id')::uuid, null),
    coalesce((new.raw_user_meta_data ->> 'is_admin')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id,
    is_admin = EXCLUDED.is_admin,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Recrear la función is_admin si no existe
DROP FUNCTION IF EXISTS public.is_admin();

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

-- 3. Recrear las políticas RLS para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update any user" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- 4. Crear manualmente todos los usuarios que existen en auth.users pero no en public.users
INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
SELECT 
    au.id,
    au.email,
    coalesce(au.raw_user_meta_data ->> 'full_name', null),
    coalesce((au.raw_user_meta_data ->> 'tenant_id')::uuid, null),
    coalesce((au.raw_user_meta_data ->> 'is_admin')::boolean, false)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  tenant_id = EXCLUDED.tenant_id,
  is_admin = EXCLUDED.is_admin,
  updated_at = timezone('utc'::text, now());

-- 5. Verificar que todo se creó correctamente
SELECT 
    '=== VERIFICACIÓN POST-REPARACIÓN ===' as info;

SELECT 
    'Trigger recreated' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    'Function recreated' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
    'is_admin function recreated' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM pg_proc 
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
    'RLS policies recreated' as check_item,
    count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

SELECT 
    'Users synchronized' as check_item,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users
FROM (SELECT 1) as dummy;

-- 6. Verificar el usuario específico
SELECT 
    'Specific user fixed' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';
