-- Script simple para actualizar el theme_color del usuario
-- Ejecutar este script en el SQL Editor de Supabase

-- Actualizar el usuario actual con un color de tema verde
UPDATE users 
SET theme_color = 'green' 
WHERE email = 'veratespera@gmail.com';

-- Verificar que se aplicó correctamente
SELECT id, email, full_name, theme_color, is_admin, tenant_id
FROM users 
WHERE email = 'veratespera@gmail.com';
