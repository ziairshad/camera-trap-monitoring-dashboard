import { useEffect, useCallback, useRef } from 'react'
import type { MapTheme } from '@/types'

interface KeyboardShortcutsProps {
  onThemeChange: (theme: MapTheme) => void
  onProjectionToggle: (isGlobeView: boolean) => void
  themes: MapTheme[]
  isGlobeView: boolean
  currentTheme: MapTheme
  disabled?: boolean
}

// Keyboard shortcut mappings
const SHORTCUT_KEYS = {
  // Theme shortcuts
  KeyB: 'cycle-basemap', // Single shortcut to cycle through all basemaps
  
  // Projection shortcuts
  KeyF: 'flat',
  KeyG: 'globe',
  
  // UI shortcuts
  Escape: 'close-menus'
} as const

export function useKeyboardShortcuts({
  onThemeChange,
  onProjectionToggle,
  themes,
  isGlobeView,
  currentTheme,
  disabled = false
}: KeyboardShortcutsProps) {
  
  // Throttling to prevent rapid theme changes
  const lastThemeChangeRef = useRef<number>(0)
  const THEME_CHANGE_THROTTLE = 1000 // 1 second minimum between theme changes
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled or if user is typing in an input
    if (disabled || 
        event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return
    }

    // Don't handle if modifier keys are pressed (except for specific combinations)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    const key = event.code

    switch (key) {
      case 'KeyB':
        event.preventDefault()
        
        // Throttle theme changes to prevent rapid cycling issues
        const now = Date.now()
        if (now - lastThemeChangeRef.current < THEME_CHANGE_THROTTLE) {
          console.log('🎨 Theme change throttled - please wait a moment before cycling again')
          return
        }
        
        // Cycle through all available basemap themes
        const currentIndex = themes.findIndex(t => t.id === currentTheme.id)
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]
        
        if (nextTheme) {
          console.log(`🎨 Cycling basemap: ${currentTheme.name} → ${nextTheme.name}`)
          lastThemeChangeRef.current = now
          onThemeChange(nextTheme)
        }
        break
        
      case 'KeyG':
        event.preventDefault()
        // G for Globe projection
        onProjectionToggle(true)
        break
        
      case 'KeyF':
        event.preventDefault()
        // F for Flat projection
        onProjectionToggle(false)
        break
    }
  }, [onThemeChange, onProjectionToggle, themes, currentTheme, disabled, THEME_CHANGE_THROTTLE])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Return shortcut information for UI display
  return {
    shortcuts: {
      themes: {
        cycle: 'B' // Single shortcut to cycle through all basemaps
      },
      projections: {
        flat: 'F',
        globe: 'G'
      },
      ui: {
        closeMenus: 'Escape'
      }
    }
  }
} 