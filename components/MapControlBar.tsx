"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Map, Satellite, Globe, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MAP_THEMES } from "../config/constants"
import type { MapTheme } from "../types"

interface MapControlBarProps {
  currentTheme: MapTheme
  onThemeChange: (theme: MapTheme) => void
  isGlobeView: boolean
  onProjectionToggle: (isGlobeView: boolean) => void
  isChanging?: boolean
  disabled?: boolean
  className?: string
}

// Optimized theme configuration
const THEME_CONFIG = {
  icons: {
    satellite: Satellite,
    streets: Map,
    dark: Globe,
    'space42-blue': Globe,
    custom: Globe,
    default: Map
  },
  previews: {
    satellite: "bg-gradient-to-br from-green-800 via-yellow-700 to-blue-800",
    streets: "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300",
    dark: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700",
    'space42-blue': "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900",
    custom: "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900",
    default: "bg-gradient-to-br from-gray-500 to-gray-600"
  },
  descriptions: {
    satellite: "High-resolution satellite imagery",
    streets: "Detailed street map with labels",
    dark: "Dark theme for low-light viewing",
    'space42-blue': "Custom GIX blue theme",
    custom: "Custom GIX blue theme",
    default: "Standard map view"
  }
} as const

// Projection modes configuration
const PROJECTION_MODES = {
  flat: {
    id: 'flat',
    label: 'Flat',
    icon: Map,
    value: false,
    tooltip: 'Switch to flat map view',
    shortcut: 'F'
  },
  globe: {
    id: 'globe',
    label: 'Globe',
    icon: Globe,
    value: true,
    tooltip: 'Switch to globe view',
    shortcut: 'G'
  }
} as const

// Utility function to get theme configuration
const getThemeConfig = <T extends keyof typeof THEME_CONFIG>(themeId: string, configType: T) => {
  try {
    const config = THEME_CONFIG[configType] as Record<string, any>
    return config[themeId] || config.default
  } catch (error) {
    console.warn(`Failed to get theme config for ${themeId}:`, error)
    const config = THEME_CONFIG[configType] as Record<string, any>
    return config.default
  }
}

export default function MapControlBar({
  currentTheme,
  onThemeChange,
  isGlobeView,
  onProjectionToggle,
  isChanging = false,
  disabled = false,
  className = ""
}: MapControlBarProps) {
  const [isBasemapOpen, setIsBasemapOpen] = useState(false)
  const [changingTheme, setChangingTheme] = useState<string | null>(null)

  // Memoized current theme configuration
  const currentThemeConfig = useMemo(() => {
    if (!currentTheme || !currentTheme.id) {
      return {
        Icon: Map,
        preview: 'bg-gradient-to-br from-gray-500 to-gray-600',
        description: 'Default theme',
        shortcut: 'M'
      }
    }
    
          return {
        Icon: getThemeConfig(currentTheme.id, 'icons'),
        preview: getThemeConfig(currentTheme.id, 'previews'),
        description: getThemeConfig(currentTheme.id, 'descriptions')
      }
  }, [currentTheme?.id])

  // Memoized projection buttons
  const projectionButtons = useMemo(() => [
    { ...PROJECTION_MODES.flat, isActive: !isGlobeView },
    { ...PROJECTION_MODES.globe, isActive: isGlobeView }
  ], [isGlobeView])

  // Optimized theme change handler
  const handleThemeChange = useCallback(async (theme: MapTheme) => {
    if (!theme || !theme.id || changingTheme || isChanging || theme.id === currentTheme?.id || disabled) return
    
    try {
      setChangingTheme(theme.id)
      await onThemeChange(theme)
      
      setTimeout(() => {
        setChangingTheme(null)
        setIsBasemapOpen(false)
      }, 800)
    } catch (error) {
      console.error('Failed to change theme:', error)
      setChangingTheme(null)
    }
  }, [changingTheme, isChanging, currentTheme?.id, disabled, onThemeChange])

  // Optimized projection toggle handler
  const handleProjectionToggle = useCallback((newView: boolean) => {
    if (disabled || newView === isGlobeView || isChanging) return
    onProjectionToggle(newView)
  }, [disabled, isGlobeView, isChanging, onProjectionToggle])

  // Memoized theme items
  const themeItems = useMemo(() => {
    if (!MAP_THEMES || !Array.isArray(MAP_THEMES)) {
      return []
    }
    
    return MAP_THEMES.map((theme) => {
      if (!theme || !theme.id) {
        return null
      }
      
      const ThemeIcon = getThemeConfig(theme.id, 'icons')
      const preview = getThemeConfig(theme.id, 'previews')
      const description = getThemeConfig(theme.id, 'descriptions')
      const isSelected = currentTheme?.id === theme.id
      const isCurrentlyChanging = changingTheme === theme.id
      
      return {
        theme,
        ThemeIcon,
        preview,
        description,
        isSelected,
        isCurrentlyChanging
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [currentTheme?.id, changingTheme])

  // Button state management
  const isOperationInProgress = isChanging || changingTheme !== null

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`fixed top-16 right-3 z-40 ${className}`} style={{ isolation: 'isolate' }}>
        {/* Invisible padding div to ensure tooltips have space */}
        <div className="p-2 -m-2">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl">
            <div className="flex items-center divide-x divide-white/10">
            
            {/* Projection Toggle Section */}
            <div className="flex items-center p-1">
              {projectionButtons.map((button, index) => {
                const Icon = button.icon
                
                return (
                  <Tooltip key={button.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleProjectionToggle(button.value)}
                        disabled={disabled || isOperationInProgress}
                        className={`
                          h-8 w-8 p-0 rounded-lg transition-all duration-200 relative group
                          ${button.isActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10' 
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                          ${disabled || isOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                          ${index > 0 ? 'ml-0.5' : ''}
                        `}
                        aria-label={button.tooltip}
                        aria-pressed={button.isActive}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      sideOffset={8}
                      className="bg-black/90 border-white/20 text-white z-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{button.tooltip}</span>
                        <kbd className="px-1 py-0.5 text-xs bg-white/20 rounded">{button.shortcut}</kbd>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            {/* Basemap Selector Section */}
            <div className="flex items-center">
              <DropdownMenu open={isBasemapOpen} onOpenChange={setIsBasemapOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled || isOperationInProgress}
                        className={`
                          h-8 px-2 rounded-none rounded-r-xl transition-all duration-300 text-white 
                          hover:bg-white/10 flex items-center gap-2 min-w-[100px]
                          ${disabled || isOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                        `}
                        aria-label={`Current basemap: ${currentTheme.name}`}
                      >
                        {/* Theme Name */}
                        <span className="text-xs font-medium leading-none flex-1 text-left">
                          {isOperationInProgress ? "Switching..." : currentTheme.name}
                        </span>

                        {/* Dropdown Arrow */}
                        <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isBasemapOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    sideOffset={8}
                    className="bg-black/90 border-white/20 text-white z-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Cycle through basemaps</span>
                      <kbd className="px-1 py-0.5 text-xs bg-white/20 rounded">B</kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent 
                  align="end" 
                  className="bg-black/40 backdrop-blur-xl border border-white/10 text-white min-w-[160px] p-1 shadow-2xl"
                  sideOffset={8}
                >
                  {themeItems.map(({ theme, ThemeIcon, preview, description, isSelected, isCurrentlyChanging }) => (
                    <DropdownMenuItem
                      key={theme.id}
                      className={`
                        flex items-center justify-between text-xs cursor-pointer py-1.5 px-2 rounded transition-all duration-200
                        ${isSelected 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "hover:bg-white/10 hover:text-white"
                        }
                        ${isCurrentlyChanging ? "opacity-70" : ""}
                      `}
                      onClick={() => handleThemeChange(theme)}
                      disabled={changingTheme !== null || isChanging || disabled}
                    >
                      {/* Theme Name */}
                      <span className="font-medium leading-none">
                        {isCurrentlyChanging ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Switching...</span>
                          </div>
                        ) : (
                          theme.name
                        )}
                      </span>
                      

                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>

            {/* Loading Indicator */}
            {isOperationInProgress && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <div className="w-0.5 h-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 