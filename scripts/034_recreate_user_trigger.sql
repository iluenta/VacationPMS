-- Script para recrear el trigger de usuarios si es necesario

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recrear la función
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

-- 3. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que se creó correctamente
SELECT 
    'Trigger recreated successfully' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Crear manualmente el usuario que está fallando si existe en auth.users
DO $$
DECLARE
  _user_id uuid := '07d0cadf-c0de-403c-af74-492214376512';
  _email text;
  _full_name text;
  _tenant_id uuid;
  _is_admin boolean;
BEGIN
  -- Verificar si el usuario existe en auth.users
  SELECT 
    u.email,
    coalesce(u.raw_user_meta_data ->> 'full_name', null),
    coalesce((u.raw_user_meta_data ->> 'tenant_id')::uuid, null),
    coalesce((u.raw_user_meta_data ->> 'is_admin')::boolean, false)
  INTO
    _email,
    _full_name,
    _tenant_id,
    _is_admin
  FROM auth.users u
  WHERE u.id = _user_id;

  -- Si existe en auth.users pero no en public.users, crearlo
  IF _email IS NOT NULL THEN
    INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
    VALUES (_user_id, _email, _full_name, _tenant_id, _is_admin)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      tenant_id = EXCLUDED.tenant_id,
      is_admin = EXCLUDED.is_admin,
      updated_at = timezone('utc'::text, now());
    
    RAISE NOTICE 'Usuario % insertado/actualizado en public.users', _user_id;
  ELSE
    RAISE NOTICE 'Usuario % no encontrado en auth.users', _user_id;
  END IF;
END $$;

-- 6. Verificar que el usuario ahora existe en public.users
SELECT 
    'User verification' as info,
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';
