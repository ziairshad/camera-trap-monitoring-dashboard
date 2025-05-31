"use client"

import { Check, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MAP_THEMES } from "../config/constants"
import type { MapTheme } from "../types"

interface MapThemeSelectorProps {
  currentTheme: MapTheme
  onThemeChange: (theme: MapTheme) => void
}

export function MapThemeSelector({ currentTheme, onThemeChange }: MapThemeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-transparent hover:text-white h-8 px-2 gap-1">
          <Map className="h-3 w-3" />
          <span className="text-xs hidden sm:inline-block">{currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-md border-white/10 text-white">
        {MAP_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            className={`flex items-center gap-2 text-xs cursor-pointer ${
              currentTheme.id === theme.id ? "bg-emerald-400/20 text-emerald-400" : "hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => onThemeChange(theme)}
          >
            {currentTheme.id === theme.id && <Check className="h-3 w-3" />}
            <span className={currentTheme.id === theme.id ? "ml-0" : "ml-5"}>{theme.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
