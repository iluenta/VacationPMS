-- Script para agregar la columna theme_color si no existe
-- Ejecutar este script en el SQL Editor de Supabase

-- Verificar si la columna existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'theme_color';

-- Agregar la columna si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT 'blue';

-- Actualizar el usuario actual con un color de tema
UPDATE users 
SET theme_color = 'green' 
WHERE email = 'veratespera@gmail.com';

-- Verificar que se aplicó correctamente
SELECT id, email, full_name, theme_color, is_admin, tenant_id
FROM users 
WHERE email = 'veratespera@gmail.com';
