-- Verificar si el usuario existe en la tabla users
SELECT 
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users 
WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd';

-- Verificar si existe en auth.users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE id = '453129fb-950e-4934-a1ff-2cb83ca697cd';

-- Verificar políticas RLS actuales
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
AND tablename = 'users'
ORDER BY policyname;
