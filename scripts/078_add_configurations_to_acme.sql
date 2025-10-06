-- ============================================================
-- Agregar configuraciones al tenant "Acme Properties"
-- ============================================================

-- Primero verificamos que el tenant existe
SELECT id, name FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000002';

-- Agregar tipos de configuración para Acme Properties
INSERT INTO public.configuration_types (
  tenant_id,
  name,
  description,
  icon,
  color,
  sort_order,
  is_active
) VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'Tipo de Usuario',
    'Define los diferentes tipos de usuarios en el sistema',
    'users',
    '#3B82F6',
    1,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Tipo de Reserva',
    'Define los diferentes tipos de reservas',
    'calendar',
    '#10B981',
    2,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Tipo de Pago',
    'Define los diferentes tipos de pagos',
    'credit-card',
    '#F59E0B',
    3,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Estado de Propiedad',
    'Define los estados de las propiedades',
    'home',
    '#8B5CF6',
    4,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Tipo de Propiedad',
    'Define los tipos de propiedades (Casa, Apartamento, etc.)',
    'building',
    '#EC4899',
    5,
    true
  )
RETURNING id, name;

-- Verificar que se crearon correctamente
SELECT 
  id,
  name,
  description,
  icon,
  color,
  tenant_id,
  is_active
FROM public.configuration_types
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
ORDER BY sort_order;

-- Contar configuraciones por tenant
SELECT 
  t.name as tenant_name,
  COUNT(ct.id) as total_configuraciones
FROM public.tenants t
LEFT JOIN public.configuration_types ct ON t.id = ct.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

