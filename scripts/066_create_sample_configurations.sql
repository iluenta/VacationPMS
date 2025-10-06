-- Script para crear datos de prueba para el sistema de configuraciones
-- Inserta tipos de configuración básicos para poder probar el sistema

-- =====================================================
-- INSERTAR TENANTS DE PRUEBA (si no existen)
-- =====================================================

INSERT INTO public.tenants (id, name, description, slug, is_active, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Empresa Demo', 'Empresa de demostración', 'empresa-demo', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Cliente Ejemplo', 'Cliente de ejemplo', 'cliente-ejemplo', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERTAR TIPOS DE CONFIGURACIÓN DE PRUEBA
-- =====================================================

INSERT INTO public.configuration_types (id, tenant_id, name, description, icon, color, is_active, sort_order, created_at, updated_at)
VALUES
    -- Tipos básicos del sistema
    ('a1b2c3d4-e5f6-4a5b-8c9d-123456789abc', '550e8400-e29b-41d4-a716-446655440000', 'Tipo de Usuario', 'Define los diferentes tipos de usuario en el sistema', 'Users', '#3B82F6', true, 1, NOW(), NOW()),
    ('b2c3d4e5-f6a5-4b8c-9d12-234567890bcd', '550e8400-e29b-41d4-a716-446655440000', 'Estado de Reserva', 'Estados posibles de una reserva', 'Calendar', '#10B981', true, 2, NOW(), NOW()),
    ('c3d4e5f6-a5b4-4c8d-9e12-345678901cde', '550e8400-e29b-41d4-a716-446655440000', 'Método de Pago', 'Formas de pago disponibles', 'CreditCard', '#F59E0B', true, 3, NOW(), NOW()),
    ('d4e5f6a5-b4c8-4d9e-1e23-456789012def', '550e8400-e29b-41d4-a716-446655440000', 'Categoría de Servicio', 'Categorías de servicios ofrecidos', 'Tag', '#8B5CF6', true, 4, NOW(), NOW()),

    -- Tipos para el segundo tenant
    ('e5f6a5b4-c8d9-4e1f-2e34-567890123efg', '550e8400-e29b-41d4-a716-446655440001', 'Tipo de Cliente', 'Tipos de cliente en el sistema', 'Users', '#EF4444', true, 1, NOW(), NOW()),
    ('f6a5b4c8-d9e1-4f2e-3e45-678901234fgh', '550e8400-e29b-41d4-a716-446655440001', 'Estado de Proyecto', 'Estados de proyectos', 'Briefcase', '#06B6D4', true, 2, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERTAR VALORES DE CONFIGURACIÓN DE PRUEBA
-- =====================================================

INSERT INTO public.configuration_values (id, configuration_type_id, value, label, description, icon, color, is_active, sort_order, created_at, updated_at)
VALUES
    -- Valores para "Tipo de Usuario"
    ('11111111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-4a5b-8c9d-123456789abc', 'admin', 'Administrador', 'Usuario con permisos completos', 'Crown', '#DC2626', true, 1, NOW(), NOW()),
    ('22222222-3333-4444-5555-666666666666', 'a1b2c3d4-e5f6-4a5b-8c9d-123456789abc', 'manager', 'Gerente', 'Usuario con permisos de gestión', 'Shield', '#2563EB', true, 2, NOW(), NOW()),
    ('33333333-4444-5555-6666-777777777777', 'a1b2c3d4-e5f6-4a5b-8c9d-123456789abc', 'user', 'Usuario Regular', 'Usuario estándar del sistema', 'User', '#059669', true, 3, NOW(), NOW()),

    -- Valores para "Estado de Reserva"
    ('44444444-5555-6666-7777-888888888888', 'b2c3d4e5-f6a5-4b8c-9d12-234567890bcd', 'pending', 'Pendiente', 'Reserva pendiente de confirmación', 'Clock', '#F59E0B', true, 1, NOW(), NOW()),
    ('55555555-6666-7777-8888-999999999999', 'b2c3d4e5-f6a5-4b8c-9d12-234567890bcd', 'confirmed', 'Confirmada', 'Reserva confirmada', 'CheckCircle', '#10B981', true, 2, NOW(), NOW()),
    ('66666666-7777-8888-9999-aaaaaaaaaaaa', 'b2c3d4e5-f6a5-4b8c-9d12-234567890bcd', 'cancelled', 'Cancelada', 'Reserva cancelada', 'XCircle', '#EF4444', true, 3, NOW(), NOW()),

    -- Valores para "Método de Pago"
    ('77777777-8888-9999-aaaa-bbbbbbbbbbbb', 'c3d4e5f6-a5b4-4c8d-9e12-345678901cde', 'cash', 'Efectivo', 'Pago en efectivo', 'Banknotes', '#059669', true, 1, NOW(), NOW()),
    ('88888888-9999-aaaa-bbbb-cccccccccccc', 'c3d4e5f6-a5b4-4c8d-9e12-345678901cde', 'card', 'Tarjeta', 'Pago con tarjeta de crédito/débito', 'CreditCard', '#3B82F6', true, 2, NOW(), NOW()),
    ('99999999-aaaa-bbbb-cccc-dddddddddddd', 'c3d4e5f6-a5b4-4c8d-9e12-345678901cde', 'transfer', 'Transferencia', 'Pago por transferencia bancaria', 'ArrowRightLeft', '#8B5CF6', true, 3, NOW(), NOW()),

    -- Valores para el segundo tenant - "Tipo de Cliente"
    ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'e5f6a5b4-c8d9-4e1f-2e34-567890123efg', 'individual', 'Individual', 'Cliente individual', 'User', '#10B981', true, 1, NOW(), NOW()),
    ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'e5f6a5b4-c8d9-4e1f-2e34-567890123efg', 'company', 'Empresa', 'Cliente empresarial', 'Building', '#3B82F6', true, 2, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'Datos de prueba creados exitosamente!' as status;

-- Mostrar resumen de datos creados
SELECT
    'Tipos de configuración creados:' as info,
    COUNT(*) as count
FROM public.configuration_types
WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');

SELECT
    'Valores de configuración creados:' as info,
    COUNT(*) as count
FROM public.configuration_values;
