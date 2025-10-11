"use client"

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

// Definir colores para cada tema
const THEME_COLORS = {
  blue: {
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    ring: '221.2 83.2% 53.3%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
  green: {
    primary: '142.1 76.2% 36.3%',
    primaryForeground: '355.7 100% 97.3%',
    ring: '142.1 76.2% 36.3%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
  purple: {
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '210 40% 98%',
    ring: '262.1 83.3% 57.8%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
  orange: {
    primary: '24.6 95% 53.1%',
    primaryForeground: '60 9.1% 97.8%',
    ring: '24.6 95% 53.1%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
  red: {
    primary: '0 84.2% 60.2%',
    primaryForeground: '0 0% 98%',
    ring: '0 84.2% 60.2%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
  pink: {
    primary: '330.4 81.2% 60.4%',
    primaryForeground: '355.7 100% 97.3%',
    ring: '330.4 81.2% 60.4%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%',
  },
} as const

export function useThemeColors() {
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile?.theme_color) {
      return
    }

    const themeColor = profile.theme_color as keyof typeof THEME_COLORS
    const colors = THEME_COLORS[themeColor]

    if (!colors) {
      console.error('🎨 [THEME] Invalid theme color:', themeColor)
      return
    }

    // Aplicar colores al documento
    const root = document.documentElement
    
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-foreground', colors.primaryForeground)
    root.style.setProperty('--ring', colors.ring)
    root.style.setProperty('--chart-1', colors.chart1)
    root.style.setProperty('--chart-2', colors.chart2)
    root.style.setProperty('--chart-3', colors.chart3)
    root.style.setProperty('--chart-4', colors.chart4)
    root.style.setProperty('--chart-5', colors.chart5)

    // También actualizar las variables de color para el sidebar
    root.style.setProperty('--sidebar-primary', colors.primary)
    root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground)


  }, [profile?.theme_color])

  return {
    currentTheme: profile?.theme_color || 'blue',
    availableThemes: Object.keys(THEME_COLORS),
  }
}
