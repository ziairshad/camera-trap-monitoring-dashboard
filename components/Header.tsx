import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import type { MapTheme } from "../types"
import { useClientOnly } from "@/hooks/useClientOnly"
import { useAuth } from "./AuthProvider"
import { LogOut } from "lucide-react"

interface HeaderProps {
  mapError: string | null
  currentMapTheme: MapTheme
  onMapThemeChange: (theme: MapTheme) => void
}

export function Header({ mapError, currentMapTheme, onMapThemeChange }: HeaderProps) {
  const pathname = usePathname()
  const isGlobeView = pathname === "/globeview"
  const [currentTime, setCurrentTime] = useState(new Date())
  const isMounted = useClientOnly()
  const { logout, userEmail } = useAuth()

  // Update time every second
  useEffect(() => {
    if (!isMounted) return
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [isMounted])

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 text-white">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-auto mr-1">
                  <img src="/GIX-Logo-White.svg" alt="GIX Logo" className="h-full w-auto" />
                </div>
                <h1 className="text-lg font-bold">Real-Time Monitoring Dashboard</h1>
              </div>
              <Badge variant="outline" className="border-blue-400/50 text-blue-400 text-xs font-mono">
                {isMounted ? currentTime.toLocaleTimeString('en-US', { 
                  timeZone: 'UTC',
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) + ' UTC' : '--:--:-- UTC'}
              </Badge>
              {mapError && (
                <Badge variant="outline" className="border-red-400/50 text-red-400 text-xs">
                  Map Offline
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {userEmail && (
                <span className="text-white/60 text-sm">
                  {userEmail}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white hover:bg-white/10 h-8 px-2 gap-1"
              >
                <LogOut className="h-3 w-3" />
                <span className="text-xs hidden sm:inline-block">
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
