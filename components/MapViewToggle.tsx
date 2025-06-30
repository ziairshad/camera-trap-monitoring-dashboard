"use client"

import React, { useCallback, useMemo } from 'react'
import { Globe, Map } from 'lucide-react'

interface MapViewToggleProps {
  isGlobeView: boolean
  onToggle: (isGlobeView: boolean) => void
  className?: string
  disabled?: boolean
}

// Optimized button configuration
const VIEW_MODES = {
  flat: {
    id: 'flat',
    label: 'Flat',
    icon: Map,
    value: false,
    ariaLabel: 'Switch to flat map view'
  },
  globe: {
    id: 'globe',
    label: 'Globe',
    icon: Globe,
    value: true,
    ariaLabel: 'Switch to globe view'
  }
} as const

export default function MapViewToggle({ 
  isGlobeView, 
  onToggle, 
  className = "",
  disabled = false
}: MapViewToggleProps) {
  
  // Memoized button configurations
  const buttons = useMemo(() => [
    { ...VIEW_MODES.flat, isActive: !isGlobeView },
    { ...VIEW_MODES.globe, isActive: isGlobeView }
  ], [isGlobeView])

  // Optimized click handler with useCallback
  const handleToggle = useCallback((newView: boolean) => {
    if (disabled || newView === isGlobeView) return
    onToggle(newView)
  }, [disabled, isGlobeView, onToggle])

  // Memoized button styles
  const getButtonStyles = useCallback((isActive: boolean) => {
    const baseStyles = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
    const activeStyles = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10"
    const inactiveStyles = "text-white/70 hover:text-white hover:bg-white/10"
    const disabledStyles = "opacity-50 cursor-not-allowed"
    
    return `${baseStyles} ${isActive ? activeStyles : inactiveStyles} ${disabled ? disabledStyles : ''}`
  }, [disabled])

  return (
    <div className={`fixed top-20 right-4 z-40 ${className}`}>
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center p-2" role="group" aria-label="Map view selector">
          {buttons.map((button, index) => {
            const Icon = button.icon
            
            return (
              <React.Fragment key={button.id}>
                {index > 0 && (
                  <div className="mx-2 w-px h-6 bg-white/20" aria-hidden="true" />
                )}
                
                <button
                  onClick={() => handleToggle(button.value)}
                  disabled={disabled}
                  className={getButtonStyles(button.isActive)}
                  aria-label={button.ariaLabel}
                  aria-pressed={button.isActive}
                  type="button"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{button.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
} 