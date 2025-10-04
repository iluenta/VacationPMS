-- Script para recrear completamente el trigger y función

-- 1. Eliminar completamente el trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Recrear la función con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log para debugging
  RAISE NOTICE 'Trigger ejecutado para usuario: %', NEW.id;
  RAISE NOTICE 'Email: %', NEW.email;
  RAISE NOTICE 'Metadata: %', NEW.raw_user_meta_data;

  -- Insertar en public.users
  INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'tenant_id')::uuid, NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'is_admin')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id,
    is_admin = EXCLUDED.is_admin,
    updated_at = timezone('utc'::text, now());

  RAISE NOTICE 'Usuario insertado/actualizado en public.users: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que se creó correctamente
SELECT 
    'Trigger recreated' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Verificar la función
SELECT 
    'Function recreated' as status,
    proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 6. Crear manualmente todos los usuarios faltantes
INSERT INTO public.users (id, email, full_name, tenant_id, is_admin)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE((au.raw_user_meta_data ->> 'tenant_id')::uuid, NULL),
    COALESCE((au.raw_user_meta_data ->> 'is_admin')::boolean, false)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  tenant_id = EXCLUDED.tenant_id,
  is_admin = EXCLUDED.is_admin,
  updated_at = timezone('utc'::text, now());

-- 7. Verificar que todos los usuarios están sincronizados
SELECT 
    'Synchronization check' as status,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users,
    CASE 
        WHEN (SELECT count(*) FROM auth.users) = (SELECT count(*) FROM public.users) 
        THEN 'SYNCHRONIZED'
        ELSE 'MISSING USERS'
    END as sync_status;
