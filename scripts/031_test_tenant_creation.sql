-- Script para probar la creación de tenants con ID correlativo

-- 1. Verificar el estado actual de la tabla tenants
SELECT 
    'Current tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
ORDER BY created_at;

-- 2. Probar la función get_next_tenant_id()
SELECT 
    'Next tenant ID' as info,
    public.get_next_tenant_id() as next_id;

-- 3. Probar la función create_tenant_with_correlative_id()
SELECT 
    'Creating test tenant' as info,
    *
FROM public.create_tenant_with_correlative_id('Test Organization', 'test-org');

-- 4. Verificar que el tenant se creó correctamente
SELECT 
    'Verification - New tenant created' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE name = 'Test Organization';

-- 5. Probar crear otro tenant para verificar que el ID es correlativo
SELECT 
    'Creating second test tenant' as info,
    *
FROM public.create_tenant_with_correlative_id('Another Test Org', 'another-test');

-- 6. Verificar ambos tenants creados
SELECT 
    'Final verification - All test tenants' as info,
    id,
    name,
    slug,
    created_at
FROM public.tenants
WHERE name IN ('Test Organization', 'Another Test Org')
ORDER BY created_at;

-- 7. Limpiar los tenants de prueba (opcional)
-- DELETE FROM public.tenants WHERE name IN ('Test Organization', 'Another Test Org');
