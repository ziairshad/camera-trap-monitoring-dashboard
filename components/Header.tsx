import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useClientOnly } from "@/hooks/useClientOnly"
import { useAuth } from "./AuthProvider"
import { LogOut } from "lucide-react"
import { GlobalSearch } from "./GlobalSearch"

interface SearchResult {
  id: string
  type: 'Target' | 'Report' | 'RFI' | 'Layer' | 'Place'
  name: string
  coordinates: [number, number]
  properties: any
}

interface HeaderProps {
  mapError: string | null
  geoJsonData?: any
  onSearchResultSelect?: (result: SearchResult) => void
}

export function Header({ mapError, geoJsonData, onSearchResultSelect }: HeaderProps) {
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
                <h1 className="text-lg font-bold">Search Map</h1>
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

            </div>
            <div className="flex items-center gap-4">
              {/* Global Search */}
              {geoJsonData && onSearchResultSelect && (
                <GlobalSearch
                  geoJsonData={geoJsonData}
                  onResultSelect={onSearchResultSelect}
                  className="hidden sm:block"
                />
              )}
              
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
    </div>
  )
}
