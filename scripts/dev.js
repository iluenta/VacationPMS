// Script para configurar Node.js en desarrollo
// Esto resuelve problemas de certificados SSL en entornos corporativos

// Configurar Node.js para ignorar certificados SSL problemáticos en desarrollo
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.log('🔧 Configuración de desarrollo: Certificados SSL ignorados')
}

// Importar y ejecutar Next.js
const { spawn } = require('child_process')

const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_TLS_REJECT_UNAUTHORIZED: '0'
  }
})

nextProcess.on('close', (code) => {
  console.log(`Servidor Next.js terminado con código ${code}`)
})

nextProcess.on('error', (err) => {
  console.error('Error al iniciar Next.js:', err)
})
