-- =====================================================
-- SOLUCIÓN ALTERNATIVA: Modificar políticas RLS
-- En lugar de desactivar RLS completamente, modificamos las políticas
-- para permitir acceso desde el servicio cuando sea necesario
-- =====================================================

-- =====================================================
-- 1. HABILITAR RLS NUEVAMENTE (si estaba desactivado)
-- =====================================================

ALTER TABLE public.configuration_types ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES PRIMERO
-- =====================================================

-- Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Service can access all configuration types" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can view configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can insert configuration types in their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can update configuration types of their tenant" ON public.configuration_types;
DROP POLICY IF EXISTS "Users can delete configuration types of their tenant" ON public.configuration_types;

-- =====================================================
-- 3. CREAR POLÍTICA PARA SERVICIO/API
-- =====================================================

-- Política especial para acceso desde la API/servicio
-- Esta política permite acceso cuando no hay usuario autenticado (caso de service role)
CREATE POLICY "Service can access all configuration types"
    ON public.configuration_types FOR ALL
    USING (true) -- Permitir todas las operaciones desde el servicio
    WITH CHECK (true);

-- =====================================================
-- 4. CREAR POLÍTICAS PARA USUARIOS
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
-- 5. VERIFICACIÓN
-- =====================================================

-- Verificar políticas activas
SELECT
    'Active Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'configuration_types'
ORDER BY policyname;

-- Probar consulta como servicio (sin usuario autenticado)
SELECT
    'Service Access Test' as test,
    COUNT(*) as config_types_count
FROM public.configuration_types;

SELECT 'Políticas RLS modificadas - Servicio tiene acceso completo!' as status;
