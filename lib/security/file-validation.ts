import { validateMimeType, validateFileSize, validateFilename, sanitizeFilename, ALLOWED_MIME_TYPES } from './sanitization'

// ============================================================================
// CONFIGURACIÓN DE VALIDACIÓN DE ARCHIVOS
// ============================================================================

// Tamaños máximos por tipo de archivo (en bytes)
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB para imágenes
  document: 10 * 1024 * 1024, // 10MB para documentos
  default: 5 * 1024 * 1024, // 5MB por defecto
} as const

// Extensiones permitidas por tipo
export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.txt'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt']
} as const

// ============================================================================
// VALIDACIÓN DE ARCHIVOS
// ============================================================================

/**
 * Información de validación de archivo
 */
export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedFilename?: string
  fileType?: string
  size?: number
}

/**
 * Valida un archivo completo
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[]
    maxSize?: number
    allowedExtensions?: string[]
    requireExtension?: boolean
  } = {}
): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Configuración por defecto
  const {
    allowedTypes = ALLOWED_MIME_TYPES.all,
    maxSize = FILE_SIZE_LIMITS.default,
    allowedExtensions = ALLOWED_EXTENSIONS.all,
    requireExtension = true
  } = options

  // Validar nombre de archivo
  if (!validateFilename(file.name)) {
    errors.push('Nombre de archivo no válido')
  }

  // Sanitizar nombre de archivo
  const sanitizedFilename = sanitizeFilename(file.name)
  if (sanitizedFilename !== file.name) {
    warnings.push(`Nombre de archivo sanitizado: ${sanitizedFilename}`)
  }

  // Validar extensión
  const extension = getFileExtension(file.name)
  if (requireExtension && !extension) {
    errors.push('Archivo debe tener una extensión')
  }
  
  if (extension && !allowedExtensions.includes(extension.toLowerCase())) {
    errors.push(`Extensión no permitida: ${extension}. Permitidas: ${allowedExtensions.join(', ')}`)
  }

  // Validar tipo MIME
  if (!validateMimeType(file.type, allowedTypes)) {
    errors.push(`Tipo de archivo no permitido: ${file.type}. Permitidos: ${allowedTypes.join(', ')}`)
  }

  // Validar tamaño
  if (!validateFileSize(file.size, maxSize)) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    errors.push(`Archivo demasiado grande: ${Math.round(file.size / (1024 * 1024))}MB. Máximo: ${maxSizeMB}MB`)
  }

  // Detectar tipo de archivo
  const fileType = detectFileType(file.type, extension)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedFilename,
    fileType,
    size: file.size
  }
}

/**
 * Valida múltiples archivos
 */
export function validateFiles(
  files: FileList | File[],
  options: Parameters<typeof validateFile>[1] = {}
): FileValidationResult[] {
  const fileArray = Array.from(files)
  return fileArray.map(file => validateFile(file, options))
}

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot)
}

/**
 * Detecta el tipo de archivo basado en MIME type y extensión
 */
export function detectFileType(mimeType: string, extension: string): string {
  if (ALLOWED_MIME_TYPES.images.includes(mimeType) || 
      ALLOWED_EXTENSIONS.images.includes(extension.toLowerCase())) {
    return 'image'
  }
  
  if (ALLOWED_MIME_TYPES.documents.includes(mimeType) || 
      ALLOWED_EXTENSIONS.documents.includes(extension.toLowerCase())) {
    return 'document'
  }
  
  return 'unknown'
}

// ============================================================================
// VALIDACIÓN DE CONTENIDO DE ARCHIVOS
// ============================================================================

/**
 * Valida el contenido de un archivo (magic numbers)
 */
export async function validateFileContent(file: File): Promise<{
  isValid: boolean
  detectedType?: string
  errors: string[]
}> {
  const errors: string[] = []
  let detectedType: string | undefined

  try {
    // Leer los primeros bytes del archivo
    const buffer = await file.slice(0, 16).arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Verificar magic numbers
    const magicNumbers = {
      // Imágenes
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      gif: [0x47, 0x49, 0x46, 0x38],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
      
      // Documentos
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    }

    // Verificar cada tipo
    for (const [type, signature] of Object.entries(magicNumbers)) {
      if (signature.every((byte, index) => uint8Array[index] === byte)) {
        detectedType = type
        break
      }
    }

    // Verificar consistencia entre MIME type y contenido
    if (detectedType) {
      const expectedMimeTypes = {
        jpeg: ['image/jpeg', 'image/jpg'],
        png: ['image/png'],
        gif: ['image/gif'],
        webp: ['image/webp'],
        pdf: ['application/pdf']
      }

      const expected = expectedMimeTypes[detectedType as keyof typeof expectedMimeTypes]
      if (expected && !expected.includes(file.type)) {
        errors.push(`Tipo MIME inconsistente: esperado ${expected.join(' o ')}, recibido ${file.type}`)
      }
    } else {
      errors.push('No se pudo detectar el tipo de archivo por su contenido')
    }

  } catch (error) {
    errors.push(`Error al validar contenido del archivo: ${error}`)
  }

  return {
    isValid: errors.length === 0,
    detectedType,
    errors
  }
}

// ============================================================================
// UTILIDADES DE UPLOAD
// ============================================================================

/**
 * Configuración para upload de archivos
 */
export interface UploadConfig {
  maxFiles?: number
  maxSizePerFile?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
  validateContent?: boolean
  sanitizeFilenames?: boolean
}

/**
 * Resultado de validación de upload
 */
export interface UploadValidationResult {
  isValid: boolean
  files: FileValidationResult[]
  totalSize: number
  errors: string[]
  warnings: string[]
}

/**
 * Valida un conjunto de archivos para upload
 */
export async function validateUpload(
  files: FileList | File[],
  config: UploadConfig = {}
): Promise<UploadValidationResult> {
  const {
    maxFiles = 10,
    maxSizePerFile = FILE_SIZE_LIMITS.default,
    allowedTypes = ALLOWED_MIME_TYPES.all,
    allowedExtensions = ALLOWED_EXTENSIONS.all,
    validateContent = true,
    sanitizeFilenames = true
  } = config

  const fileArray = Array.from(files)
  const errors: string[] = []
  const warnings: string[] = []
  let totalSize = 0

  // Validar número de archivos
  if (fileArray.length > maxFiles) {
    errors.push(`Demasiados archivos: ${fileArray.length}. Máximo: ${maxFiles}`)
  }

  // Validar cada archivo
  const fileResults: FileValidationResult[] = []
  
  for (const file of fileArray) {
    const result = validateFile(file, {
      allowedTypes,
      maxSize: maxSizePerFile,
      allowedExtensions
    })

    totalSize += file.size
    fileResults.push(result)

    // Agregar errores y warnings
    errors.push(...result.errors)
    warnings.push(...result.warnings)

    // Validar contenido si está habilitado
    if (validateContent && result.isValid) {
      const contentResult = await validateFileContent(file)
      if (!contentResult.isValid) {
        errors.push(`Archivo ${file.name}: ${contentResult.errors.join(', ')}`)
        result.isValid = false
      }
    }
  }

  // Validar tamaño total
  const maxTotalSize = maxSizePerFile * maxFiles
  if (totalSize > maxTotalSize) {
    errors.push(`Tamaño total excedido: ${Math.round(totalSize / (1024 * 1024))}MB. Máximo: ${Math.round(maxTotalSize / (1024 * 1024))}MB`)
  }

  return {
    isValid: errors.length === 0,
    files: fileResults,
    totalSize,
    errors,
    warnings
  }
}

// ============================================================================
// UTILIDADES DE SEGURIDAD
// ============================================================================

/**
 * Verifica si un archivo es potencialmente peligroso
 */
export function isPotentiallyDangerousFile(file: File): boolean {
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh'
  ]

  const extension = getFileExtension(file.name).toLowerCase()
  return dangerousExtensions.includes(extension)
}

/**
 * Genera un nombre de archivo seguro único
 */
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const sanitized = sanitizeFilename(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  const name = prefix ? `${prefix}_${sanitized}` : sanitized
  const extension = getFileExtension(originalName)
  
  return `${name}_${timestamp}_${random}${extension}`
}

/**
 * Convierte bytes a formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================================================
// EXPORTAR CONFIGURACIONES
// ============================================================================

export {
  FILE_SIZE_LIMITS,
  ALLOWED_EXTENSIONS
}
