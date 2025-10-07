import React from 'react'
import { escapeHtml, escapeJs, isSafeString } from './sanitization'

// ============================================================================
// COMPONENTES DE ESCAPE PARA REACT
// ============================================================================

/**
 * Props para componentes de escape
 */
interface EscapeProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

/**
 * Componente que escapa HTML automáticamente
 * Útil para mostrar contenido de usuario de forma segura
 */
export function SafeText({ children, ...props }: EscapeProps) {
  const safeContent = React.useMemo(() => {
    if (typeof children === 'string') {
      return escapeHtml(children)
    }
    return children
  }, [children])

  return <span {...props}>{safeContent}</span>
}

/**
 * Componente para mostrar texto con validación de seguridad
 */
export function ValidatedText({ 
  children, 
  fallback = 'Contenido no válido',
  ...props 
}: EscapeProps & { fallback?: string }) {
  const safeContent = React.useMemo(() => {
    if (typeof children === 'string') {
      if (isSafeString(children)) {
        return escapeHtml(children)
      }
      return fallback
    }
    return children
  }, [children, fallback])

  return <span {...props}>{safeContent}</span>
}

/**
 * Componente para mostrar contenido HTML limitado y seguro
 */
export function SafeHtml({ 
  content, 
  className,
  ...props 
}: { 
  content: string
  className?: string
  [key: string]: any 
}) {
  const safeHtml = React.useMemo(() => {
    if (typeof content !== 'string') {
      return ''
    }

    // Escapar primero para seguridad
    const escaped = escapeHtml(content)
    
    // Permitir solo tags básicos de formato
    return escaped
      .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, '<b>$1</b>')
      .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, '<i>$1</i>')
      .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/g, '<em>$1</em>')
      .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, '<strong>$1</strong>')
      .replace(/&lt;br\s*\/?&gt;/g, '<br />')
      .replace(/&lt;p&gt;(.*?)&lt;\/p&gt;/g, '<p>$1</p>')
  }, [content])

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      {...props}
    />
  )
}

/**
 * Hook para escapar valores de forma segura
 */
export function useSafeValue(value: string): string {
  return React.useMemo(() => {
    if (typeof value !== 'string') {
      return ''
    }
    return escapeHtml(value)
  }, [value])
}

/**
 * Hook para validar y escapar valores
 */
export function useValidatedValue(value: string, fallback: string = ''): string {
  return React.useMemo(() => {
    if (typeof value !== 'string') {
      return fallback
    }
    
    if (!isSafeString(value)) {
      return fallback
    }
    
    return escapeHtml(value)
  }, [value, fallback])
}

// ============================================================================
// UTILIDADES PARA ATRIBUTOS
// ============================================================================

/**
 * Escapa atributos HTML de forma segura
 */
export function escapeAttribute(value: string): string {
  if (typeof value !== 'string') {
    return ''
  }
  
  return value
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
}

/**
 * Escapa URLs para atributos href/src
 */
export function escapeUrl(value: string): string {
  if (typeof value !== 'string') {
    return ''
  }
  
  // Validar que sea una URL segura
  if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('/')) {
    return ''
  }
  
  return escapeAttribute(value)
}

/**
 * Hook para crear props seguras
 */
export function useSafeProps(props: Record<string, any>): Record<string, any> {
  return React.useMemo(() => {
    const safeProps: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        if (key === 'href' || key === 'src') {
          safeProps[key] = escapeUrl(value)
        } else if (key.startsWith('data-') || key.startsWith('aria-')) {
          safeProps[key] = escapeAttribute(value)
        } else {
          safeProps[key] = escapeHtml(value)
        }
      } else {
        safeProps[key] = value
      }
    }
    
    return safeProps
  }, [props])
}

// ============================================================================
// COMPONENTES ESPECÍFICOS
// ============================================================================

/**
 * Input seguro que escapa automáticamente
 */
export function SafeInput({ 
  value, 
  onChange, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const safeValue = escapeHtml(e.target.value)
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: safeValue
        }
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }, [onChange])

  return <input value={value} onChange={handleChange} {...props} />
}

/**
 * Textarea seguro que escapa automáticamente
 */
export function SafeTextarea({ 
  value, 
  onChange, 
  ...props 
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const safeValue = escapeHtml(e.target.value)
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: safeValue
        }
      } as React.ChangeEvent<HTMLTextAreaElement>)
    }
  }, [onChange])

  return <textarea value={value} onChange={handleChange} {...props} />
}

/**
 * Link seguro que valida URLs
 */
export function SafeLink({ 
  href, 
  children, 
  ...props 
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const safeHref = React.useMemo(() => {
    if (typeof href !== 'string') {
      return '#'
    }
    return escapeUrl(href) || '#'
  }, [href])

  return (
    <a href={safeHref} {...props}>
      {children}
    </a>
  )
}

// ============================================================================
// CONTEXTO DE SEGURIDAD
// ============================================================================

interface SecurityContextType {
  escapeHtml: (value: string) => string
  escapeJs: (value: string) => string
  isSafeString: (value: string) => boolean
  escapeAttribute: (value: string) => string
  escapeUrl: (value: string) => string
}

const SecurityContext = React.createContext<SecurityContextType | null>(null)

/**
 * Provider de contexto de seguridad
 */
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const contextValue: SecurityContextType = React.useMemo(() => ({
    escapeHtml,
    escapeJs,
    isSafeString,
    escapeAttribute,
    escapeUrl
  }), [])

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

/**
 * Hook para usar el contexto de seguridad
 */
export function useSecurity() {
  const context = React.useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}

// ============================================================================
// EXPORTAR COMPONENTES
// ============================================================================

export {
  SafeText,
  ValidatedText,
  SafeHtml,
  SafeInput,
  SafeTextarea,
  SafeLink,
  SecurityProvider,
  useSecurity,
  useSafeValue,
  useValidatedValue,
  useSafeProps
}
