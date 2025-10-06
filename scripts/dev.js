// Script para configurar Node.js en desarrollo
// Esto resuelve problemas de certificados SSL en entornos corporativos

const { spawn } = require('child_process')

// Solo configurar SSL en desarrollo y si no está ya configurado
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
const needsSSLFix = isDevelopment && !process.env.NODE_TLS_REJECT_UNAUTHORIZED

if (needsSSLFix) {
  console.log('🔧 Configuración de desarrollo: Ignorando certificados SSL problemáticos')
  console.log('⚠️  ADVERTENCIA: Esto hace las conexiones TLS inseguras. Solo para desarrollo.')
  console.log('📖 Para más información, consulta SSL_CONFIGURATION.md')
}

// Preparar variables de entorno
const env = {
  ...process.env,
  NODE_ENV: 'development'
}

// Solo agregar la configuración SSL si es necesario
if (needsSSLFix) {
  env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// Importar y ejecutar Next.js
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env
})

nextProcess.on('close', (code) => {
  console.log(`Servidor Next.js terminado con código ${code}`)
})

nextProcess.on('error', (err) => {
  console.error('Error al iniciar Next.js:', err)
})
