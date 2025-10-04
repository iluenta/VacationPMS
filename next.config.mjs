/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para desarrollo con certificados SSL problemáticos
  serverExternalPackages: ['@supabase/supabase-js'],
}

export default nextConfig
