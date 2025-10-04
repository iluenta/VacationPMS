-- Script de reparación completa paso a paso

-- PASO 1: Crear el usuario faltante inmediatamente
INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
VALUES (
    '07d0cadf-c0de-403c-af74-492214376512',
    'veratespera@gmail.com',
    'veratespera',
    '00000000-0000-0000-0000-000000000001',
    false
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  tenant_id = EXCLUDED.tenant_id,
  is_admin = EXCLUDED.is_admin,
  updated_at = timezone('utc'::text, now());

-- PASO 2: Verificar que el usuario se creó
SELECT 
    'PASO 1: Usuario creado' as paso,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- PASO 3: Recrear el trigger (sin tocar is_admin por ahora)
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

-- PASO 4: Verificar que el trigger se creó
SELECT 
    'PASO 2: Trigger recreado' as paso,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- PASO 5: Verificar políticas RLS básicas (sin tocar las de admin por ahora)
SELECT 
    'PASO 3: Políticas RLS básicas' as paso,
    count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname IN ('Users can view own profile', 'Users can update own profile', 'Users can insert own profile');

-- PASO 6: Verificar que RLS está habilitado
SELECT 
    'PASO 4: RLS habilitado' as paso,
    CASE 
        WHEN relrowsecurity THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM pg_class
WHERE relname = 'users';

-- PASO 7: Verificación final
SELECT 
    '=== VERIFICACIÓN FINAL ===' as info;

SELECT 
    'Usuario existe en public.users' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

SELECT 
    'Trigger existe' as check_item,
    CASE 
        WHEN count(*) > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    'RLS habilitado' as check_item,
    CASE 
        WHEN relrowsecurity THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status
FROM pg_class
WHERE relname = 'users';

-- PASO 8: Mostrar detalles del usuario
SELECT 
    'Detalles del usuario' as info,
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';
