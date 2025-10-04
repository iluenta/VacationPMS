-- Script para probar que el trigger funciona correctamente

-- 1. Verificar el estado actual
SELECT 
    'Current state' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users;

-- 2. Crear un usuario de prueba en auth.users (simulando registro)
-- NOTA: Esto es solo para testing, en producción los usuarios se crean via Supabase Auth
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insertar usuario de prueba en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        raw_app_meta_data,
        is_super_admin,
        last_sign_in_at,
        app_metadata,
        user_metadata,
        factors,
        identities,
        recovery_sent_at,
        email_change,
        email_change_sent_at,
        last_sign_in_ip,
        raw_user_meta_data,
        is_sso_user,
        deleted_at,
        is_anonymous,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        confirmed_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        confirmed_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'test@example.com',
        '$2a$10$dummy',
        now(),
        now(),
        now(),
        jsonb_build_object(
            'full_name', 'Test User',
            'tenant_id', test_tenant_id,
            'is_admin', false
        ),
        '{}',
        false,
        now(),
        '{}',
        '{}',
        '[]',
        '[]',
        null,
        '',
        null,
        '127.0.0.1',
        jsonb_build_object(
            'full_name', 'Test User',
            'tenant_id', test_tenant_id,
            'is_admin', false
        ),
        false,
        null,
        false,
        null,
        null,
        '',
        '',
        null,
        now(),
        '',
        0,
        null,
        '',
        null,
        false,
        null,
        false,
        null,
        null,
        '',
        '',
        null,
        now(),
        '',
        0,
        null,
        '',
        null
    );

    RAISE NOTICE 'Usuario de prueba creado con ID: %', test_user_id;
END $$;

-- 3. Verificar que el trigger se ejecutó
SELECT 
    'After trigger test' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users;

-- 4. Verificar que el usuario de prueba se creó en public.users
SELECT 
    'Test user in public.users' as info,
    id,
    email,
    full_name,
    tenant_id,
    is_admin
FROM public.users
WHERE email = 'test@example.com';

-- 5. Limpiar usuario de prueba
DELETE FROM public.users WHERE email = 'test@example.com';
DELETE FROM auth.users WHERE email = 'test@example.com';

-- 6. Verificar limpieza
SELECT 
    'After cleanup' as info,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users;
