-- ============================================================
-- CREAR TABLA PARA REFRESH TOKENS
-- ============================================================

BEGIN;

-- Crear tabla para refresh tokens
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    user_agent text,
    ip inet,
    revoked boolean DEFAULT false NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON public.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON public.refresh_tokens(revoked);

-- Habilitar RLS
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios tokens
CREATE POLICY "Users can view their own refresh tokens" ON public.refresh_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios tokens
CREATE POLICY "Users can insert their own refresh tokens" ON public.refresh_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios tokens
CREATE POLICY "Users can update their own refresh tokens" ON public.refresh_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios tokens
CREATE POLICY "Users can delete their own refresh tokens" ON public.refresh_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_refresh_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.refresh_tokens 
    WHERE expires_at < now() OR revoked = true;
END;
$$;

-- Crear trigger para limpiar tokens expirados periódicamente
-- (Esto se ejecutará cada vez que se inserte un nuevo token)
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar tokens expirados cada 100 inserciones (aproximadamente)
    IF (SELECT COUNT(*) FROM public.refresh_tokens) % 100 = 0 THEN
        PERFORM public.cleanup_expired_refresh_tokens();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_expired_tokens_trigger
    AFTER INSERT ON public.refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_expired_tokens();

-- Función para obtener sesiones activas de un usuario
CREATE OR REPLACE FUNCTION public.get_user_active_sessions(user_uuid uuid)
RETURNS TABLE (
    session_id text,
    created_at timestamp with time zone,
    last_used_at timestamp with time zone,
    user_agent text,
    ip inet
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.session_id,
        rt.created_at,
        rt.last_used_at,
        rt.user_agent,
        rt.ip
    FROM public.refresh_tokens rt
    WHERE rt.user_id = user_uuid 
      AND rt.expires_at > now() 
      AND rt.revoked = false
    ORDER BY rt.last_used_at DESC NULLS LAST, rt.created_at DESC;
END;
$$;

-- Función para revocar una sesión específica
CREATE OR REPLACE FUNCTION public.revoke_user_session(session_uuid text, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows integer;
BEGIN
    UPDATE public.refresh_tokens 
    SET revoked = true, last_used_at = now()
    WHERE session_id = session_uuid AND user_id = user_uuid;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows > 0;
END;
$$;

-- Función para revocar todas las sesiones de un usuario
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows integer;
BEGIN
    UPDATE public.refresh_tokens 
    SET revoked = true, last_used_at = now()
    WHERE user_id = user_uuid AND revoked = false;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows;
END;
$$;

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TABLA REFRESH_TOKENS CREADA EXITOSAMENTE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tabla: refresh_tokens';
    RAISE NOTICE 'Índices: 4 creados';
    RAISE NOTICE 'RLS: Habilitado con 4 políticas';
    RAISE NOTICE 'Funciones: 4 creadas';
    RAISE NOTICE 'Trigger: cleanup_expired_tokens_trigger';
    RAISE NOTICE '===========================================';
END $$;

-- Mostrar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'refresh_tokens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
