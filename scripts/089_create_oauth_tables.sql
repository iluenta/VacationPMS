-- ============================================================
-- CREAR TABLAS PARA OAUTH
-- ============================================================

BEGIN;

-- Tabla para proveedores OAuth de usuarios
CREATE TABLE IF NOT EXISTS public.user_oauth_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('google', 'github', 'microsoft')),
    provider_id text NOT NULL,
    provider_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, provider)
);

-- Tabla para sesiones OAuth (temporal)
CREATE TABLE IF NOT EXISTS public.oauth_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    state text NOT NULL UNIQUE,
    provider text NOT NULL,
    redirect_uri text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '10 minutes') NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_user_id ON public.user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_provider ON public.user_oauth_providers(provider);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_provider_id ON public.user_oauth_providers(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state ON public.oauth_sessions(state);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires ON public.oauth_sessions(expires_at);

-- Habilitar RLS
ALTER TABLE public.user_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_oauth_providers
CREATE POLICY "Users can view their own OAuth providers" ON public.user_oauth_providers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth providers" ON public.user_oauth_providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth providers" ON public.user_oauth_providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth providers" ON public.user_oauth_providers
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para oauth_sessions (solo el sistema puede acceder)
CREATE POLICY "System can manage OAuth sessions" ON public.oauth_sessions
    FOR ALL USING (true);

-- Función para limpiar sesiones OAuth expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.oauth_sessions 
    WHERE expires_at < now();
END;
$$;

-- Función para crear sesión OAuth
CREATE OR REPLACE FUNCTION public.create_oauth_session(
    session_state text,
    session_provider text,
    session_redirect_uri text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.oauth_sessions (state, provider, redirect_uri)
    VALUES (session_state, session_provider, session_redirect_uri);
END;
$$;

-- Función para validar sesión OAuth
CREATE OR REPLACE FUNCTION public.validate_oauth_session(session_state text)
RETURNS TABLE (
    provider text,
    redirect_uri text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        os.provider,
        os.redirect_uri
    FROM public.oauth_sessions os
    WHERE os.state = session_state 
      AND os.expires_at > now();
    
    -- Eliminar sesión después de usarla
    DELETE FROM public.oauth_sessions 
    WHERE state = session_state;
END;
$$;

-- Función para obtener proveedores OAuth de un usuario
CREATE OR REPLACE FUNCTION public.get_user_oauth_providers(user_uuid uuid)
RETURNS TABLE (
    provider text,
    provider_id text,
    provider_data jsonb,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uop.provider,
        uop.provider_id,
        uop.provider_data,
        uop.created_at
    FROM public.user_oauth_providers uop
    WHERE uop.user_id = user_uuid
    ORDER BY uop.created_at DESC;
END;
$$;

-- Función para desvincular proveedor OAuth
CREATE OR REPLACE FUNCTION public.unlink_oauth_provider(user_uuid uuid, provider_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_rows integer;
BEGIN
    DELETE FROM public.user_oauth_providers 
    WHERE user_id = user_uuid AND provider = provider_name;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    RETURN deleted_rows > 0;
END;
$$;

-- Trigger para actualizar updated_at en user_oauth_providers
CREATE OR REPLACE FUNCTION public.update_oauth_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_oauth_updated_at_trigger
    BEFORE UPDATE ON public.user_oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_oauth_updated_at();

-- Trigger para limpiar sesiones OAuth expiradas
CREATE OR REPLACE FUNCTION public.trigger_cleanup_oauth_sessions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar sesiones expiradas cada 10 inserciones
    IF (SELECT COUNT(*) FROM public.oauth_sessions) % 10 = 0 THEN
        PERFORM public.cleanup_expired_oauth_sessions();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_oauth_sessions_trigger
    AFTER INSERT ON public.oauth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_oauth_sessions();

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TABLAS OAUTH CREADAS EXITOSAMENTE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tablas: user_oauth_providers, oauth_sessions';
    RAISE NOTICE 'Índices: 5 creados';
    RAISE NOTICE 'RLS: Habilitado con políticas';
    RAISE NOTICE 'Funciones: 5 creadas';
    RAISE NOTICE 'Triggers: 2 creados';
    RAISE NOTICE '===========================================';
END $$;

-- Mostrar estructura de las tablas
SELECT 'user_oauth_providers' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_oauth_providers' AND table_schema = 'public'
UNION ALL
SELECT 'oauth_sessions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'oauth_sessions' AND table_schema = 'public'
ORDER BY table_name, column_name;
