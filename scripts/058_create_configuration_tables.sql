-- Script para crear las tablas de configuración del sistema
-- Permite definir tipos dinámicos (tipos de usuario, reserva, pago, etc.)
-- con filtrado automático por tenant

-- =====================================================
-- TABLA 1: configuration_types (Tipos de Configuración)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuration_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Nombre del icono (ej: "user", "calendar", "credit-card")
    color VARCHAR(7), -- Color hexadecimal (ej: "#3B82F6")
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT configuration_types_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT configuration_types_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT configuration_types_tenant_name_unique UNIQUE (tenant_id, name)
);

-- =====================================================
-- TABLA 2: configuration_values (Valores de Configuración)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuration_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_type_id UUID NOT NULL REFERENCES public.configuration_types(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icono específico para este valor
    color VARCHAR(7), -- Color específico para este valor
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT configuration_values_value_not_empty CHECK (LENGTH(TRIM(value)) > 0),
    CONSTRAINT configuration_values_label_not_empty CHECK (LENGTH(TRIM(label)) > 0),
    CONSTRAINT configuration_values_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT configuration_values_type_value_unique UNIQUE (configuration_type_id, value)
);

-- =====================================================
-- TABLA 3: configuration_audit_log (Auditoría)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL, -- 'configuration_types' o 'configuration_values'
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para configuration_types
CREATE INDEX IF NOT EXISTS idx_configuration_types_tenant_id ON public.configuration_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configuration_types_active ON public.configuration_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_configuration_types_sort_order ON public.configuration_types(tenant_id, sort_order);

-- Índices para configuration_values
CREATE INDEX IF NOT EXISTS idx_configuration_values_type_id ON public.configuration_values(configuration_type_id);
CREATE INDEX IF NOT EXISTS idx_configuration_values_active ON public.configuration_values(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_configuration_values_sort_order ON public.configuration_values(configuration_type_id, sort_order);

-- Índices para audit_log
CREATE INDEX IF NOT EXISTS idx_configuration_audit_log_table_record ON public.configuration_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_configuration_audit_log_tenant ON public.configuration_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configuration_audit_log_created_at ON public.configuration_audit_log(created_at);

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Función para auditoría de configuration_types
CREATE OR REPLACE FUNCTION public.audit_configuration_types()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, old_values, user_id, tenant_id
        ) VALUES (
            'configuration_types', OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), OLD.tenant_id
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, old_values, new_values, user_id, tenant_id
        ) VALUES (
            'configuration_types', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.tenant_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, new_values, user_id, tenant_id
        ) VALUES (
            'configuration_types', NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), NEW.tenant_id
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para auditoría de configuration_values
CREATE OR REPLACE FUNCTION public.audit_configuration_values()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- Obtener tenant_id del configuration_type
    IF TG_OP = 'DELETE' THEN
        SELECT ct.tenant_id INTO tenant_uuid FROM public.configuration_types ct WHERE ct.id = OLD.configuration_type_id;
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, old_values, user_id, tenant_id
        ) VALUES (
            'configuration_values', OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), tenant_uuid
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        SELECT ct.tenant_id INTO tenant_uuid FROM public.configuration_types ct WHERE ct.id = NEW.configuration_type_id;
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, old_values, new_values, user_id, tenant_id
        ) VALUES (
            'configuration_values', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), tenant_uuid
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        SELECT ct.tenant_id INTO tenant_uuid FROM public.configuration_types ct WHERE ct.id = NEW.configuration_type_id;
        INSERT INTO public.configuration_audit_log (
            table_name, record_id, action, new_values, user_id, tenant_id
        ) VALUES (
            'configuration_values', NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), tenant_uuid
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_audit_configuration_types ON public.configuration_types;
CREATE TRIGGER trigger_audit_configuration_types
    AFTER INSERT OR UPDATE OR DELETE ON public.configuration_types
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_types();

DROP TRIGGER IF EXISTS trigger_audit_configuration_values ON public.configuration_values;
CREATE TRIGGER trigger_audit_configuration_values
    AFTER INSERT OR UPDATE OR DELETE ON public.configuration_values
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_values();

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_configuration_types_updated_at ON public.configuration_types;
CREATE TRIGGER trigger_update_configuration_types_updated_at
    BEFORE UPDATE ON public.configuration_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_configuration_values_updated_at ON public.configuration_values;
CREATE TRIGGER trigger_update_configuration_values_updated_at
    BEFORE UPDATE ON public.configuration_values
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.configuration_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA configuration_types
-- =====================================================

-- Política: Los usuarios pueden ver los tipos de configuración de su tenant
CREATE POLICY "Users can view configuration types of their tenant"
    ON public.configuration_types FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden insertar tipos de configuración en su tenant
CREATE POLICY "Users can insert configuration types in their tenant"
    ON public.configuration_types FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden actualizar tipos de configuración de su tenant
CREATE POLICY "Users can update configuration types of their tenant"
    ON public.configuration_types FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden eliminar tipos de configuración de su tenant
CREATE POLICY "Users can delete configuration types of their tenant"
    ON public.configuration_types FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS RLS PARA configuration_values
-- =====================================================

-- Política: Los usuarios pueden ver los valores de configuración de su tenant
CREATE POLICY "Users can view configuration values of their tenant"
    ON public.configuration_values FOR SELECT
    USING (
        configuration_type_id IN (
            SELECT ct.id FROM public.configuration_types ct
            WHERE ct.tenant_id IN (
                SELECT tenant_id FROM public.users WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden insertar valores de configuración en su tenant
CREATE POLICY "Users can insert configuration values in their tenant"
    ON public.configuration_values FOR INSERT
    WITH CHECK (
        configuration_type_id IN (
            SELECT ct.id FROM public.configuration_types ct
            WHERE ct.tenant_id IN (
                SELECT tenant_id FROM public.users WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden actualizar valores de configuración de su tenant
CREATE POLICY "Users can update configuration values of their tenant"
    ON public.configuration_values FOR UPDATE
    USING (
        configuration_type_id IN (
            SELECT ct.id FROM public.configuration_types ct
            WHERE ct.tenant_id IN (
                SELECT tenant_id FROM public.users WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- Política: Los usuarios pueden eliminar valores de configuración de su tenant
CREATE POLICY "Users can delete configuration values of their tenant"
    ON public.configuration_values FOR DELETE
    USING (
        configuration_type_id IN (
            SELECT ct.id FROM public.configuration_types ct
            WHERE ct.tenant_id IN (
                SELECT tenant_id FROM public.users WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- =====================================================
-- POLÍTICAS RLS PARA configuration_audit_log
-- =====================================================

-- Política: Los usuarios pueden ver el log de auditoría de su tenant
CREATE POLICY "Users can view audit log of their tenant"
    ON public.configuration_audit_log FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
        )
    );

-- =====================================================
-- FUNCIÓN PARA VALIDAR DEPENDENCIAS
-- =====================================================

-- Función para verificar si un tipo de configuración está siendo usado
CREATE OR REPLACE FUNCTION public.check_configuration_type_dependencies(config_type_id UUID)
RETURNS TABLE (
    table_name TEXT,
    record_count BIGINT,
    can_delete BOOLEAN
) AS $$
BEGIN
    -- Por ahora solo verificamos si tiene valores asociados
    -- En el futuro se pueden agregar más tablas que referencien configuration_types
    
    RETURN QUERY
    SELECT 
        'configuration_values'::TEXT as table_name,
        COUNT(*) as record_count,
        (COUNT(*) = 0) as can_delete
    FROM public.configuration_values cv
    WHERE cv.configuration_type_id = config_type_id;
    
    -- Aquí se pueden agregar más verificaciones en el futuro:
    -- - users (si tienen un tipo de usuario asignado)
    -- - reservations (si tienen un tipo de reserva)
    -- - payments (si tienen un tipo de pago)
    -- etc.
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos tipos de configuración de ejemplo para el primer tenant
-- (Solo si existe al menos un tenant)
INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    t.id,
    'Tipo de Usuario',
    'Define los diferentes tipos de usuarios en el sistema',
    'users',
    '#3B82F6',
    1
FROM public.tenants t
WHERE t.id = (SELECT id FROM public.tenants ORDER BY created_at LIMIT 1)
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    t.id,
    'Tipo de Reserva',
    'Define los diferentes tipos de reservas disponibles',
    'calendar',
    '#10B981',
    2
FROM public.tenants t
WHERE t.id = (SELECT id FROM public.tenants ORDER BY created_at LIMIT 1)
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO public.configuration_types (tenant_id, name, description, icon, color, sort_order)
SELECT 
    t.id,
    'Tipo de Pago',
    'Define los métodos de pago disponibles',
    'credit-card',
    '#F59E0B',
    3
FROM public.tenants t
WHERE t.id = (SELECT id FROM public.tenants ORDER BY created_at LIMIT 1)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insertar valores de ejemplo para "Tipo de Usuario"
INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ct.id,
    'admin',
    'Administrador',
    'Usuario con permisos completos del sistema',
    'shield',
    '#EF4444',
    1
FROM public.configuration_types ct
WHERE ct.name = 'Tipo de Usuario'
ON CONFLICT (configuration_type_id, value) DO NOTHING;

INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ct.id,
    'user',
    'Usuario Regular',
    'Usuario estándar con permisos básicos',
    'user',
    '#3B82F6',
    2
FROM public.configuration_types ct
WHERE ct.name = 'Tipo de Usuario'
ON CONFLICT (configuration_type_id, value) DO NOTHING;

INSERT INTO public.configuration_values (configuration_type_id, value, label, description, icon, color, sort_order)
SELECT 
    ct.id,
    'guest',
    'Invitado',
    'Usuario con permisos limitados',
    'user-check',
    '#6B7280',
    3
FROM public.configuration_types ct
WHERE ct.name = 'Tipo de Usuario'
ON CONFLICT (configuration_type_id, value) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    'configuration_types' as table_name,
    COUNT(*) as record_count
FROM public.configuration_types
UNION ALL
SELECT 
    'configuration_values' as table_name,
    COUNT(*) as record_count
FROM public.configuration_values
UNION ALL
SELECT 
    'configuration_audit_log' as table_name,
    COUNT(*) as record_count
FROM public.configuration_audit_log;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('configuration_types', 'configuration_values', 'configuration_audit_log')
ORDER BY tablename, policyname;
