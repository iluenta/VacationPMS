-- Script para verificar y crear las configuraciones necesarias
-- Basado en el error 500 de la API

-- =====================================================
-- 1. VERIFICAR SI LAS TABLAS EXISTEN
-- =====================================================

SELECT 'Verificando existencia de tablas...' as info;

-- Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR USUARIO ESPECÍFICO
-- =====================================================

SELECT 'Verificando usuario específico...' as info;

-- Verificar usuario en public.users
SELECT 
    id,
    tenant_id,
    is_admin,
    full_name,
    email
FROM public.users
WHERE id = '107b5ded-c817-48c3-aa8e-c2373bff5dcc';

-- =====================================================
-- 3. VERIFICAR TENANT ESPECÍFICO
-- =====================================================

SELECT 'Verificando tenant específico...' as info;

-- Verificar tenant
SELECT 
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE id = '00000001-0000-4000-8000-000000000000';

-- =====================================================
-- 4. CREAR CONFIGURACIONES DE EJEMPLO SI NO EXISTEN
-- =====================================================

SELECT 'Creando configuraciones de ejemplo...' as info;

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

-- Insertar segunda configuración
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    '00000001-0000-4000-8000-000000000000',
    'Tipo de Reserva',
    'Define los diferentes tipos de reservas',
    'calendar',
    '#10B981',
    2
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Reserva'
);

-- Insertar tercera configuración
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    '00000001-0000-4000-8000-000000000000',
    'Tipo de Pago',
    'Define los diferentes tipos de pago',
    'credit-card',
    '#F59E0B',
    3
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Pago'
);

-- =====================================================
-- 5. CREAR VALORES DE EJEMPLO
-- =====================================================

SELECT 'Creando valores de ejemplo...' as info;

-- Obtener el ID del tipo de configuración "Tipo de Usuario"
WITH user_type AS (
    SELECT id FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Usuario'
    LIMIT 1
)
-- Insertar valores para Tipo de Usuario
INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ut.id,
    'admin',
    'Administrador',
    'Usuario con permisos completos del sistema',
    'shield',
    '#EF4444',
    1
FROM user_type ut
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_values cv
    JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
    WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
    AND ct.name = 'Tipo de Usuario'
    AND cv.value = 'admin'
);

-- Insertar segundo valor
WITH user_type AS (
    SELECT id FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Usuario'
    LIMIT 1
)
INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ut.id,
    'user',
    'Usuario Regular',
    'Usuario con permisos básicos',
    'user',
    '#3B82F6',
    2
FROM user_type ut
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_values cv
    JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
    WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
    AND ct.name = 'Tipo de Usuario'
    AND cv.value = 'user'
);

-- Insertar tercer valor
WITH user_type AS (
    SELECT id FROM public.configuration_types 
    WHERE tenant_id = '00000001-0000-4000-8000-000000000000' 
    AND name = 'Tipo de Usuario'
    LIMIT 1
)
INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ut.id,
    'guest',
    'Invitado',
    'Usuario con permisos limitados',
    'user-check',
    '#6B7280',
    3
FROM user_type ut
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuration_values cv
    JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
    WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
    AND ct.name = 'Tipo de Usuario'
    AND cv.value = 'guest'
);

-- =====================================================
-- 6. VERIFICAR RESULTADOS
-- =====================================================

SELECT 'Verificando resultados...' as info;

-- Verificar tipos de configuración creados
SELECT 
    'configuration_types' as table_name,
    COUNT(*) as count
FROM public.configuration_types
WHERE tenant_id = '00000001-0000-4000-8000-000000000000'
UNION ALL
SELECT 
    'configuration_values' as table_name,
    COUNT(*) as count
FROM public.configuration_values cv
JOIN public.configuration_types ct ON cv.configuration_type_id = ct.id
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000';

-- Mostrar configuraciones creadas
SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.icon,
    ct.color,
    ct.sort_order,
    COUNT(cv.id) as values_count
FROM public.configuration_types ct
LEFT JOIN public.configuration_values cv ON ct.id = cv.configuration_type_id
WHERE ct.tenant_id = '00000001-0000-4000-8000-000000000000'
GROUP BY ct.id, ct.name, ct.description, ct.icon, ct.color, ct.sort_order
ORDER BY ct.sort_order;

-- =====================================================
-- 7. PROBAR QUERY SIMILAR A LA API
-- =====================================================

SELECT 'Probando query de la API...' as info;

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

SELECT 'Configuraciones creadas exitosamente!' as status;
