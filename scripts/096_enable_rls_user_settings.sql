-- Script para habilitar RLS en la tabla user_settings
-- Fecha: 2025-01-07

-- Habilitar RLS en user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA USER_SETTINGS
-- ============================================

-- Los usuarios pueden ver sus propias configuraciones
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias configuraciones
CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias configuraciones
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias configuraciones
CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las configuraciones
CREATE POLICY "Admin users can view all settings"
  ON public.user_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Los administradores pueden actualizar todas las configuraciones
CREATE POLICY "Admin users can update all settings"
  ON public.user_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_settings'
ORDER BY policyname;
