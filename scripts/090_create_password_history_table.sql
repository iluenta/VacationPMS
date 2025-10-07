-- ============================================================
-- CREAR TABLA PARA HISTORIAL DE CONTRASEÑAS
-- ============================================================

BEGIN;

-- Tabla para historial de contraseñas
CREATE TABLE IF NOT EXISTS public.password_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Agregar campos de política de contraseñas a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password_change_required_at timestamp with time zone;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON public.password_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_password_changed_at ON public.users(password_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_password_change_required ON public.users(password_change_required);

-- Habilitar RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Políticas para password_history
CREATE POLICY "Users can view their own password history" ON public.password_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert password history" ON public.password_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can delete old password history" ON public.password_history
    FOR DELETE USING (true);

-- Función para limpiar historial antiguo de contraseñas
CREATE OR REPLACE FUNCTION public.cleanup_old_password_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eliminar registros más antiguos que el límite de historial
    DELETE FROM public.password_history 
    WHERE id IN (
        SELECT ph.id
        FROM public.password_history ph
        WHERE ph.created_at < (
            SELECT created_at
            FROM public.password_history ph2
            WHERE ph2.user_id = ph.user_id
            ORDER BY created_at DESC
            LIMIT 1 OFFSET 5  -- Mantener solo las 5 más recientes
        )
    );
END;
$$;

-- Función para obtener estadísticas de contraseñas
CREATE OR REPLACE FUNCTION public.get_password_stats(user_uuid uuid)
RETURNS TABLE (
    last_changed timestamp with time zone,
    days_since_change integer,
    change_required boolean,
    history_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.password_changed_at as last_changed,
        CASE 
            WHEN u.password_changed_at IS NOT NULL THEN
                EXTRACT(DAY FROM now() - u.password_changed_at)::integer
            ELSE 999
        END as days_since_change,
        COALESCE(u.password_change_required, false) as change_required,
        COUNT(ph.id) as history_count
    FROM public.users u
    LEFT JOIN public.password_history ph ON u.id = ph.user_id
    WHERE u.id = user_uuid
    GROUP BY u.password_changed_at, u.password_change_required;
END;
$$;

-- Función para verificar si contraseña está en historial
CREATE OR REPLACE FUNCTION public.is_password_in_history(user_uuid uuid, password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    history_count integer;
BEGIN
    SELECT COUNT(*) INTO history_count
    FROM public.password_history
    WHERE user_id = user_uuid 
      AND password_hash = is_password_in_history.password_hash;
    
    RETURN history_count > 0;
END;
$$;

-- Función para marcar cambio de contraseña requerido
CREATE OR REPLACE FUNCTION public.require_password_change(user_uuid uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users 
    SET 
        password_change_required = true,
        password_change_required_at = now()
    WHERE id = user_uuid;
    
    -- Logear evento de seguridad
    INSERT INTO public.security_events (
        user_id,
        event_type,
        event_data,
        created_at
    ) VALUES (
        user_uuid,
        'password_change_required',
        jsonb_build_object('reason', reason),
        now()
    );
END;
$$;

-- Función para limpiar contraseñas expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_passwords()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count integer;
BEGIN
    -- Marcar usuarios con contraseñas expiradas (más de 90 días)
    UPDATE public.users 
    SET 
        password_change_required = true,
        password_change_required_at = now()
    WHERE password_changed_at < now() - interval '90 days'
      AND password_change_required = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- Trigger para limpiar historial antiguo
CREATE OR REPLACE FUNCTION public.trigger_cleanup_password_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar historial antiguo cada 10 inserciones
    IF (SELECT COUNT(*) FROM public.password_history WHERE user_id = NEW.user_id) % 10 = 0 THEN
        PERFORM public.cleanup_old_password_history();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_password_history_trigger
    AFTER INSERT ON public.password_history
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_password_history();

-- Trigger para actualizar fecha de cambio de contraseña
CREATE OR REPLACE FUNCTION public.update_password_changed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si se actualiza el hash de contraseña, actualizar la fecha
    IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
        NEW.password_changed_at = now();
        NEW.password_change_required = false;
        NEW.password_change_required_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_password_changed_at_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_password_changed_at();

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TABLA PASSWORD_HISTORY CREADA EXITOSAMENTE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tabla: password_history';
    RAISE NOTICE 'Campos agregados a users: password_changed_at, password_change_required, password_change_required_at';
    RAISE NOTICE 'Índices: 4 creados';
    RAISE NOTICE 'RLS: Habilitado con políticas';
    RAISE NOTICE 'Funciones: 5 creadas';
    RAISE NOTICE 'Triggers: 2 creados';
    RAISE NOTICE '===========================================';
END $$;

-- Mostrar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_history' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar campos agregados a users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('password_changed_at', 'password_change_required', 'password_change_required_at')
ORDER BY column_name;
