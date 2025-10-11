-- Verificar si la columna theme_color existe en la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'theme_color';

-- Verificar los datos actuales del usuario
SELECT id, email, full_name, theme_color, is_admin, tenant_id
FROM users 
WHERE email = 'veratespera@gmail.com';

-- Si la columna no existe, crearla
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT 'blue';

-- Si la columna existe pero está NULL, actualizarla
-- UPDATE users SET theme_color = 'green' WHERE email = 'veratespera@gmail.com';
