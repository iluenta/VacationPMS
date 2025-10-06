-- Script para diagnosticar errores en el sistema de configuraciones
-- Verifica el estado del usuario, tenant y tablas

-- =====================================================
-- 1. VERIFICAR USUARIOS Y TENANTS
-- =====================================================

SELECT 'Verificando usuarios y tenants...' as info;

-- Verificar usuarios en auth.users
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
    'public.users' as table_name,
    COUNT(*) as user_count
FROM public.users
UNION ALL
SELECT 
    'public.tenants' as table_name,
    COUNT(*) as tenant_count
FROM public.tenants;

-- =====================================================
-- 2. VERIFICAR USUARIOS ESPECÍFICOS
-- =====================================================

SELECT 'Verificando usuarios específicos...' as info;

-- Verificar el último usuario creado
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at as auth_created_at,
    pu.id as public_user_id,
    pu.tenant_id,
    pu.is_admin,
    pu.created_at as public_created_at,
    t.name as tenant_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
ORDER BY au.created_at DESC
LIMIT 5;

-- =====================================================
-- 3. VERIFICAR TABLAS DE CONFIGURACIÓN
-- =====================================================

SELECT 'Verificando tablas de configuración...' as info;

-- Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY table_name;

-- =====================================================
-- 4. VERIFICAR DATOS DE CONFIGURACIÓN
-- =====================================================

SELECT 'Verificando datos de configuración...' as info;

-- Verificar tipos de configuración
SELECT 
    ct.id,
    ct.name,
    ct.tenant_id,
    t.name as tenant_name,
    ct.is_active,
    ct.created_at
FROM public.configuration_types ct
LEFT JOIN public.tenants t ON ct.tenant_id = t.id
ORDER BY ct.created_at;

-- Verificar valores de configuración
SELECT 
    cv.id,
    cv.value,
    cv.label,
    ct.name as configuration_type_name,
    t.name as tenant_name,
    cv.is_active
FROM public.configuration_values cv
LEFT JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
LEFT JOIN public.tenants t ON ct.tenant_id = t.id
ORDER BY cv.created_at;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 'Verificando políticas RLS...' as info;

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY tablename;

-- Verificar políticas activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY tablename, policyname;

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
AND table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY table_name, grantee;

-- =====================================================
-- 7. DIAGNÓSTICO ESPECÍFICO PARA ERROR 401
-- =====================================================

SELECT 'Diagnóstico para error 401...' as info;

-- Verificar si hay usuarios sin tenant asignado
SELECT 
    'Usuarios sin tenant' as issue,
    COUNT(*) as count
FROM public.users
WHERE tenant_id IS NULL
UNION ALL
SELECT 
    'Usuarios con tenant' as issue,
    COUNT(*) as count
FROM public.users
WHERE tenant_id IS NOT NULL;

-- Verificar si hay configuraciones sin tenant válido
SELECT 
    'Configuraciones sin tenant válido' as issue,
    COUNT(*) as count
FROM public.configuration_types ct
LEFT JOIN public.tenants t ON ct.tenant_id = t.id
WHERE t.id IS NULL;

-- =====================================================
-- 8. RECOMENDACIONES
-- =====================================================

SELECT 'Recomendaciones para solucionar el error...' as info;

-- Verificar el estado general
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.users WHERE tenant_id IS NULL) > 0 
        THEN 'CRÍTICO: Hay usuarios sin tenant asignado'
        ELSE 'OK: Todos los usuarios tienen tenant'
    END as user_tenant_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM public.configuration_types) = 0 
        THEN 'ADVERTENCIA: No hay tipos de configuración'
        ELSE 'OK: Hay tipos de configuración'
    END as configuration_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM public.tenants) = 0 
        THEN 'CRÍTICO: No hay tenants'
        ELSE 'OK: Hay tenants disponibles'
    END as tenant_status;

-- =====================================================
-- 9. SOLUCIONES SUGERIDAS
-- =====================================================

SELECT 'Soluciones sugeridas:' as info;

-- Si no hay configuraciones, crear algunas de ejemplo
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    t.id,
    'Tipo de Usuario',
    'Define los diferentes tipos de usuarios en el sistema',
    'users',
    '#3B82F6',
    1
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_types ct 
    WHERE ct.tenant_id = t.id AND ct.name = 'Tipo de Usuario'
)
LIMIT 1;

-- Verificar si se creó la configuración
SELECT 
    'Configuración creada' as result,
    COUNT(*) as count
FROM public.configuration_types
WHERE name = 'Tipo de Usuario';

SELECT 'Diagnóstico completado. Revisa los resultados arriba.' as status;
