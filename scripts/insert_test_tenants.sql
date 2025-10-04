-- Script para insertar tenants de prueba si no existen

-- Insertar tenants de prueba
INSERT INTO public.tenants (id, name, slug)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Tenant', 'demo'),
  ('00000000-0000-0000-0000-000000000002', 'Acme Properties', 'acme')
ON CONFLICT (id) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
    id, 
    name, 
    slug, 
    created_at 
FROM public.tenants 
ORDER BY created_at;
