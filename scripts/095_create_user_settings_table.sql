-- Script para crear tabla user_settings con configuraciones avanzadas de usuario
-- Fecha: 2025-01-07

-- Crear tabla user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Configuraciones de interfaz
  language text DEFAULT 'es' CHECK (language IN ('es', 'en')),
  timezone text DEFAULT 'UTC',
  date_format text DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  dashboard_layout text DEFAULT 'default' CHECK (dashboard_layout IN ('default', 'compact', 'expanded')),
  items_per_page integer DEFAULT 50 CHECK (items_per_page BETWEEN 10 AND 100),
  
  -- Configuraciones de notificaciones
  notifications_email boolean DEFAULT true,
  notifications_push boolean DEFAULT true,
  notifications_sms boolean DEFAULT false,
  
  -- Configuraciones de seguridad
  auto_logout_minutes integer DEFAULT 30 CHECK (auto_logout_minutes BETWEEN 5 AND 480),
  session_timeout boolean DEFAULT true,
  login_notifications boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  
  -- Configuraciones de contraseña
  password_expiry_days integer DEFAULT 90 CHECK (password_expiry_days BETWEEN 30 AND 365),
  password_history_count integer DEFAULT 5 CHECK (password_history_count BETWEEN 3 AND 10),
  
  -- Configuraciones de privacidad
  profile_visibility text DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'tenant_only')),
  data_sharing boolean DEFAULT false,
  
  -- Metadatos
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraint único por usuario
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_created_at ON public.user_settings(created_at);

-- Deshabilitar RLS temporalmente (se habilitará en script separado)
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos
GRANT ALL ON public.user_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Crear función para inicializar configuraciones por defecto para usuarios existentes
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar configuraciones por defecto cuando se crea un nuevo usuario
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para inicializar configuraciones automáticamente
CREATE TRIGGER trigger_initialize_user_settings
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_settings();

-- Inicializar configuraciones para usuarios existentes
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.user_settings IS 'Configuraciones avanzadas de usuario para personalización de la aplicación';
COMMENT ON COLUMN public.user_settings.language IS 'Idioma de la interfaz (es, en)';
COMMENT ON COLUMN public.user_settings.timezone IS 'Zona horaria del usuario';
COMMENT ON COLUMN public.user_settings.date_format IS 'Formato de fecha preferido';
COMMENT ON COLUMN public.user_settings.dashboard_layout IS 'Layout del dashboard (default, compact, expanded)';
COMMENT ON COLUMN public.user_settings.items_per_page IS 'Número de elementos por página en listas';
COMMENT ON COLUMN public.user_settings.notifications_email IS 'Recibir notificaciones por email';
COMMENT ON COLUMN public.user_settings.notifications_push IS 'Recibir notificaciones push';
COMMENT ON COLUMN public.user_settings.notifications_sms IS 'Recibir notificaciones por SMS';
COMMENT ON COLUMN public.user_settings.auto_logout_minutes IS 'Minutos antes del logout automático';
COMMENT ON COLUMN public.user_settings.session_timeout IS 'Habilitar timeout de sesión';
COMMENT ON COLUMN public.user_settings.login_notifications IS 'Notificar inicios de sesión';
COMMENT ON COLUMN public.user_settings.two_factor_enabled IS 'Autenticación de dos factores habilitada';
COMMENT ON COLUMN public.user_settings.password_expiry_days IS 'Días antes de expirar contraseña';
COMMENT ON COLUMN public.user_settings.password_history_count IS 'Número de contraseñas anteriores a recordar';
COMMENT ON COLUMN public.user_settings.profile_visibility IS 'Visibilidad del perfil (public, private, tenant_only)';
COMMENT ON COLUMN public.user_settings.data_sharing IS 'Compartir datos para análisis';
