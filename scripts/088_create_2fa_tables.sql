-- ============================================================
-- CREAR TABLAS PARA AUTENTICACIÓN DE DOS FACTORES (2FA)
-- ============================================================

BEGIN;

-- Tabla principal para configuración 2FA
CREATE TABLE IF NOT EXISTS public.user_2fa (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret text NOT NULL,
    backup_codes text[] NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    activated_at timestamp with time zone,
    disabled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabla temporal para configuración 2FA (antes de activar)
CREATE TABLE IF NOT EXISTS public.user_2fa_temp (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret text NOT NULL,
    backup_codes text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '1 hour') NOT NULL
);

-- Tabla para intentos de 2FA (prevenir ataques de fuerza bruta)
CREATE TABLE IF NOT EXISTS public.user_2fa_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip inet NOT NULL,
    user_agent text,
    success boolean NOT NULL,
    attempt_type text NOT NULL CHECK (attempt_type IN ('totp', 'backup_code')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_active ON public.user_2fa(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_2fa_temp_user_id ON public.user_2fa_temp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_temp_expires ON public.user_2fa_temp(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_user_id ON public.user_2fa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_ip ON public.user_2fa_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_created ON public.user_2fa_attempts(created_at);

-- Habilitar RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas para user_2fa
CREATE POLICY "Users can view their own 2FA settings" ON public.user_2fa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON public.user_2fa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON public.user_2fa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings" ON public.user_2fa
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_2fa_temp
CREATE POLICY "Users can view their own temp 2FA settings" ON public.user_2fa_temp
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own temp 2FA settings" ON public.user_2fa_temp
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own temp 2FA settings" ON public.user_2fa_temp
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_2fa_attempts
CREATE POLICY "Users can view their own 2FA attempts" ON public.user_2fa_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert 2FA attempts" ON public.user_2fa_attempts
    FOR INSERT WITH CHECK (true);

-- Función para limpiar configuraciones temporales expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_temp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_2fa_temp 
    WHERE expires_at < now();
END;
$$;

-- Función para limpiar intentos antiguos de 2FA
CREATE OR REPLACE FUNCTION public.cleanup_old_2fa_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_2fa_attempts 
    WHERE created_at < now() - interval '30 days';
END;
$$;

-- Función para verificar límite de intentos 2FA
CREATE OR REPLACE FUNCTION public.check_2fa_rate_limit(user_uuid uuid, user_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_attempts integer;
    max_attempts integer := 5;
    time_window interval := '15 minutes';
BEGIN
    -- Contar intentos fallidos recientes
    SELECT COUNT(*) INTO recent_attempts
    FROM public.user_2fa_attempts
    WHERE user_id = user_uuid 
      AND ip = user_ip
      AND success = false
      AND created_at > now() - time_window;
    
    RETURN recent_attempts < max_attempts;
END;
$$;

-- Función para registrar intento de 2FA
CREATE OR REPLACE FUNCTION public.log_2fa_attempt(
    user_uuid uuid,
    user_ip inet,
    user_agent_text text,
    success_flag boolean,
    attempt_type_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_2fa_attempts (
        user_id,
        ip,
        user_agent,
        success,
        attempt_type
    ) VALUES (
        user_uuid,
        user_ip,
        user_agent_text,
        success_flag,
        attempt_type_text
    );
END;
$$;

-- Función para obtener estadísticas de 2FA
CREATE OR REPLACE FUNCTION public.get_2fa_stats(user_uuid uuid)
RETURNS TABLE (
    is_enabled boolean,
    activated_at timestamp with time zone,
    total_attempts bigint,
    successful_attempts bigint,
    failed_attempts bigint,
    last_attempt timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(u2fa.is_active, false) as is_enabled,
        u2fa.activated_at,
        COUNT(u2fa_att.id) as total_attempts,
        COUNT(CASE WHEN u2fa_att.success THEN 1 END) as successful_attempts,
        COUNT(CASE WHEN NOT u2fa_att.success THEN 1 END) as failed_attempts,
        MAX(u2fa_att.created_at) as last_attempt
    FROM auth.users u
    LEFT JOIN public.user_2fa u2fa ON u.id = u2fa.user_id
    LEFT JOIN public.user_2fa_attempts u2fa_att ON u.id = u2fa_att.user_id
    WHERE u.id = user_uuid
    GROUP BY u2fa.is_active, u2fa.activated_at;
END;
$$;

-- Trigger para actualizar updated_at en user_2fa
CREATE OR REPLACE FUNCTION public.update_2fa_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_2fa_updated_at_trigger
    BEFORE UPDATE ON public.user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION public.update_2fa_updated_at();

-- Trigger para limpiar configuraciones temporales expiradas
CREATE OR REPLACE FUNCTION public.trigger_cleanup_2fa_temp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar configuraciones temporales expiradas cada 10 inserciones
    IF (SELECT COUNT(*) FROM public.user_2fa_temp) % 10 = 0 THEN
        PERFORM public.cleanup_expired_2fa_temp();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_2fa_temp_trigger
    AFTER INSERT ON public.user_2fa_temp
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_2fa_temp();

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TABLAS 2FA CREADAS EXITOSAMENTE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tablas: user_2fa, user_2fa_temp, user_2fa_attempts';
    RAISE NOTICE 'Índices: 6 creados';
    RAISE NOTICE 'RLS: Habilitado con políticas';
    RAISE NOTICE 'Funciones: 6 creadas';
    RAISE NOTICE 'Triggers: 2 creados';
    RAISE NOTICE '===========================================';
END $$;

-- Mostrar estructura de las tablas
SELECT 'user_2fa' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_2fa' AND table_schema = 'public'
UNION ALL
SELECT 'user_2fa_temp' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_2fa_temp' AND table_schema = 'public'
UNION ALL
SELECT 'user_2fa_attempts' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_2fa_attempts' AND table_schema = 'public'
ORDER BY table_name, column_name;
