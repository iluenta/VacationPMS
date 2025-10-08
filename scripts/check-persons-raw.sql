-- Script para verificar que existen personas en la base de datos

-- 1. Ver todas las personas
SELECT 
    id,
    first_name,
    last_name,
    business_name,
    identification_type,
    identification_number,
    person_category,
    tenant_id,
    is_active
FROM persons
ORDER BY created_at DESC;

-- 2. Ver personas por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_persons
FROM persons
GROUP BY tenant_id;

-- 3. Ver si hay personas en tenant específico
SELECT 
    *
FROM persons
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 4. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'persons'
ORDER BY ordinal_position;

