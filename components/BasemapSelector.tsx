"use client"

import { useState, useCallback, useMemo } from "react"
import { Map, Satellite, Globe, ChevronDown, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MAP_THEMES } from "../config/constants"
import type { MapTheme } from "../types"

interface BasemapSelectorProps {
  currentTheme: MapTheme
  onThemeChange: (theme: MapTheme) => void
  isChanging?: boolean
}

// Optimized theme configuration with memoization
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

// Utility functions with memoization
const getThemeConfig = <T extends keyof typeof THEME_CONFIG>(themeId: string, configType: T) => {
  const config = THEME_CONFIG[configType] as Record<string, any>
  return config[themeId] || config.default
}

export function BasemapSelector({ currentTheme, onThemeChange, isChanging = false }: BasemapSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [changingTheme, setChangingTheme] = useState<string | null>(null)

  // Memoized current theme configuration
  const currentThemeConfig = useMemo(() => ({
    Icon: getThemeConfig(currentTheme.id, 'icons'),
    preview: getThemeConfig(currentTheme.id, 'previews'),
    description: getThemeConfig(currentTheme.id, 'descriptions')
  }), [currentTheme.id])

  // Optimized theme change handler with proper error handling
  const handleThemeChange = useCallback(async (theme: MapTheme) => {
    if (changingTheme || isChanging || theme.id === currentTheme.id) return
    
    try {
      setChangingTheme(theme.id)
      await onThemeChange(theme)
      
      // Provide visual feedback
      setTimeout(() => {
        setChangingTheme(null)
        setIsOpen(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to change theme:', error)
      setChangingTheme(null)
    }
  }, [changingTheme, isChanging, currentTheme.id, onThemeChange])

  // Memoized theme items to prevent unnecessary re-renders
  const themeItems = useMemo(() => {
    return MAP_THEMES.map((theme) => {
      const ThemeIcon = getThemeConfig(theme.id, 'icons')
      const preview = getThemeConfig(theme.id, 'previews')
      const description = getThemeConfig(theme.id, 'descriptions')
      const isSelected = currentTheme.id === theme.id
      const isCurrentlyChanging = changingTheme === theme.id
      
      return {
        theme,
        ThemeIcon,
        preview,
        description,
        isSelected,
        isCurrentlyChanging
      }
    })
  }, [currentTheme.id, changingTheme])

  // Optimized button state
  const buttonState = useMemo(() => ({
    disabled: isChanging || changingTheme !== null,
    icon: isChanging ? Loader2 : currentThemeConfig.Icon,
    text: isChanging ? "Switching..." : currentTheme.name,
    showSpinner: isChanging
  }), [isChanging, changingTheme, currentThemeConfig.Icon, currentTheme.name])

  return (
    <div className="absolute bottom-20 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={buttonState.disabled}
            className="h-12 px-4 bg-black/50 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl hover:bg-black/70 transition-all duration-300 text-white hover:scale-105 flex items-center gap-3 min-w-[160px]"
            aria-label={`Current basemap: ${currentTheme.name}`}
          >
            <buttonState.icon className={`w-4 h-4 ${buttonState.showSpinner ? 'animate-spin' : ''}`} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium leading-none">
                {buttonState.text}
              </span>
              <span className="text-xs text-white/60 leading-none mt-0.5">
                Basemap
              </span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="bg-black/90 backdrop-blur-md border-white/20 text-white min-w-[280px] p-2"
          sideOffset={8}
        >
          <div className="text-xs text-white/60 uppercase tracking-wide font-medium px-2 py-1 mb-2">
            Select Basemap
          </div>
          
          {themeItems.map(({ theme, ThemeIcon, preview, description, isSelected, isCurrentlyChanging }) => (
            <DropdownMenuItem
              key={theme.id}
              className={`flex items-center gap-3 text-sm cursor-pointer py-3 px-2 rounded-lg transition-all duration-200 ${
                isSelected 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "hover:bg-white/10 hover:text-white border border-transparent"
              } ${isCurrentlyChanging ? "opacity-70" : ""}`}
              onClick={() => handleThemeChange(theme)}
              disabled={changingTheme !== null || isChanging}
              aria-label={`Switch to ${theme.name} basemap`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-shrink-0">
                  {isCurrentlyChanging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThemeIcon className="w-4 h-4" />
                  )}
                </div>
                
                <div className={`w-8 h-6 rounded border border-white/20 shadow-sm flex-shrink-0 ${preview}`} />
                
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium leading-none truncate">{theme.name}</span>
                  <span className="text-xs text-white/60 leading-none mt-1 truncate">
                    {description}
                  </span>
                </div>
                
                {isSelected && !isCurrentlyChanging && (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs text-white/50 px-2 py-1 flex items-center gap-1">
              <span>💡</span>
              <span>Data layers are preserved when switching themes</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 