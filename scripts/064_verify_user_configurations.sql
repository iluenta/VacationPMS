-- Script para verificar el usuario específico y sus configuraciones
-- Basado en la información del debug: veratespera@gmail.com

-- =====================================================
-- 1. VERIFICAR USUARIO ESPECÍFICO
-- =====================================================

SELECT 'Verificando usuario específico...' as info;

-- Verificar usuario en auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'veratespera@gmail.com';

-- Verificar usuario en public.users
SELECT 
    'public.users' as table_name,
    id,
    tenant_id,
    is_admin,
    full_name,
    created_at
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 2. VERIFICAR TENANT DEL USUARIO
-- =====================================================

SELECT 'Verificando tenant del usuario...' as info;

-- Verificar tenant específico
SELECT 
    'public.tenants' as table_name,
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE id = '00000001-0000-4000-8000-000000000000';

-- =====================================================
-- 3. VERIFICAR CONFIGURACIONES DEL TENANT
-- =====================================================

SELECT 'Verificando configuraciones del tenant...' as info;

-- Verificar tipos de configuración para este tenant
SELECT 
    'configuration_types' as table_name,
    id,
    name,
    description,
    tenant_id,
    is_active,
    created_at
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000';

-- Verificar valores de configuración para este tenant
SELECT 
    'configuration_values' as table_name,
    cv.id,
    cv.value,
    cv.label,
    cv.configuration_type_id,
    ct.name as configuration_type_name,
    ct.tenant_id
FROM public.configuration_values cv
JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000';

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 'Verificando políticas RLS...' as info;

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'users')
ORDER BY tablename;

-- Verificar políticas específicas para configuration_types
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
AND tablename = 'configuration_types'
ORDER BY policyname;

-- =====================================================
-- 5. PROBAR QUERY SIMILAR A LA API
-- =====================================================

SELECT 'Probando query similar a la API...' as info;

-- Simular la query que hace la API
SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    ct.is_active,
    ct.sort_order,
    ct.created_at,
    ct.updated_at,
    t.name as tenant_name
FROM public.configuration_types ct
LEFT JOIN public.tenants t ON ct.tenant_id = t.id
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
ORDER BY ct.sort_order, ct.name;

-- =====================================================
-- 6. VERIFICAR PERMISOS DE USUARIO
-- =====================================================

SELECT 'Verificando permisos de usuario...' as info;

-- Verificar permisos en las tablas
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('configuration_types', 'configuration_values', 'users')
AND grantee IN ('authenticated', 'public')
ORDER BY table_name, grantee;

-- =====================================================
-- 7. CREAR CONFIGURACIÓN DE EJEMPLO SI NO EXISTE
-- =====================================================

SELECT 'Creando configuración de ejemplo si no existe...' as info;

-- Insertar configuración de ejemplo si no existe
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    '00000001-0000-4000-8000-000000000000',
    'Tipo de Usuario',
    'Define los diferentes tipos de usuarios en el sistema',
    'users',
    '#3B82F6',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Usuario'
);

-- Verificar si se creó
SELECT 
    'Configuración creada' as result,
    COUNT(*) as count
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000'
AND name = 'Tipo de Usuario';

-- =====================================================
-- 8. RESUMEN FINAL
-- =====================================================

SELECT 'RESUMEN FINAL' as info;

-- Contar configuraciones para este tenant
SELECT 
    'Configuraciones para tenant veratespera' as info,
    COUNT(*) as configuration_count
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000';

-- Verificar que el usuario puede acceder a sus configuraciones
SELECT 
    'Usuario puede acceder a configuraciones' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.configuration_types 
            WHERE tenant_id = '00000001-0000-4000-8000-000000000000'
        ) THEN 'SÍ - Hay configuraciones disponibles'
        ELSE 'NO - No hay configuraciones para este tenant'
    END as result;

SELECT 'Verificación completada para usuario veratespera@gmail.com' as status;
