-- Crear el usuario faltante en public.users
-- Primero verificar si existe en auth.users para obtener los datos
DO $$
DECLARE
    auth_user_record RECORD;
BEGIN
    -- Obtener datos del usuario de auth.users
    SELECT 
        id,
        email,
        raw_user_meta_data
    INTO auth_user_record
    FROM auth.users 
    WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd';
    
    -- Si el usuario existe en auth.users pero no en public.users, crearlo
    IF auth_user_record.id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            full_name,
            tenant_id,
            is_admin
        ) VALUES (
            auth_user_record.id,
            auth_user_record.email,
            COALESCE(auth_user_record.raw_user_meta_data->>'full_name', null),
            COALESCE((auth_user_record.raw_user_meta_data->>'tenant_id')::uuid, null),
            COALESCE((auth_user_record.raw_user_meta_data->>'is_admin')::boolean, false)
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuario creado/actualizado en public.users: %', auth_user_record.email;
    ELSE
        RAISE NOTICE 'Usuario no encontrado en auth.users';
    END IF;
END $$;

-- Verificar que el usuario se creó correctamente
SELECT 
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users 
WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd';
