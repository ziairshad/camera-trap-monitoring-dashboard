import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapThemeSelector } from "./MapThemeSelector"
import type { MapTheme } from "../types"

interface HeaderProps {
  mapError: string | null
  currentMapTheme: MapTheme
  onMapThemeChange: (theme: MapTheme) => void
}

export function Header({ mapError, currentMapTheme, onMapThemeChange }: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 text-white">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-auto mr-1">
                  <img src="/images/GIQ-logo.svg" alt="GIQ Logo" className="h-full w-auto" />
                </div>
                <h1 className="text-lg font-bold">Environment Agency Abu Dhabi</h1>
              </div>
              <Badge variant="outline" className="border-emerald-400/50 text-emerald-400 text-xs">
                Wildlife Monitor
              </Badge>
              {mapError && (
                <Badge variant="outline" className="border-red-400/50 text-red-400 text-xs">
                  Map Offline
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MapThemeSelector currentTheme={currentMapTheme} onThemeChange={onMapThemeChange} />
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <Bell className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
