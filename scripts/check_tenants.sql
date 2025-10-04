-- Script para verificar el estado de la tabla tenants

-- Verificar si la tabla existe
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tenants';

-- Verificar datos en la tabla tenants
SELECT 
    id, 
    name, 
    slug, 
    created_at 
FROM public.tenants 
ORDER BY created_at;

-- Verificar permisos en la tabla tenants
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'tenants';

-- Verificar políticas RLS
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
AND tablename = 'tenants';
