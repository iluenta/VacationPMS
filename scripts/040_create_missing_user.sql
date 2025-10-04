-- Script simplificado para crear el usuario faltante

-- 1. Crear manualmente el usuario que está fallando
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

-- 2. Verificar que el usuario se creó correctamente
SELECT 
    'User created successfully' as status,
    id,
    email,
    full_name,
    tenant_id,
    is_admin,
    created_at
FROM public.users
WHERE id = '07d0cadf-c0de-403c-af74-492214376512';

-- 3. Verificar que el tenant existe
SELECT 
    'Tenant verification' as status,
    id,
    name,
    slug
FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001';
