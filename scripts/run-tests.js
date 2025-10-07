#!/usr/bin/env node

/**
 * Script para ejecutar tests de la nueva arquitectura
 * 
 * Este script ejecuta todos los tests y genera reportes de cobertura.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Ejecutando tests de la nueva arquitectura...\n')

try {
  // Ejecutar tests con cobertura
  console.log('📊 Ejecutando tests con cobertura...')
  execSync('npm test -- --coverage --watchAll=false', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })

  // Verificar que el directorio de cobertura existe
  const coverageDir = path.join(process.cwd(), 'coverage')
  if (fs.existsSync(coverageDir)) {
    console.log('\n✅ Tests completados exitosamente!')
    console.log('📊 Reporte de cobertura generado en: ./coverage/index.html')
    
    // Mostrar resumen de cobertura si existe
    const lcovPath = path.join(coverageDir, 'lcov-report', 'index.html')
    if (fs.existsSync(lcovPath)) {
      console.log('📈 Para ver el reporte detallado, abre: ./coverage/lcov-report/index.html')
    }
  } else {
    console.log('\n⚠️  Tests completados pero no se generó reporte de cobertura')
  }

} catch (error) {
  console.error('\n❌ Error ejecutando tests:', error.message)
  process.exit(1)
}

console.log('\n🎉 Proceso de testing completado!')
