-- Script para verificar la configuración de Supabase

-- Verificar que las tablas existen y tienen datos
SELECT 
    'Tenants count' as check_name,
    COUNT(*) as count
FROM public.tenants

UNION ALL

SELECT 
    'Users count' as check_name,
    COUNT(*) as count
FROM public.users

UNION ALL

SELECT 
    'Auth users count' as check_name,
    COUNT(*) as count
FROM auth.users;

-- Verificar que RLS está habilitado
SELECT 
    'RLS Status' as check_name,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname IN ('users', 'tenants')
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar políticas RLS
SELECT 
    'RLS Policies' as check_name,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'tenants')
ORDER BY tablename, policyname;
