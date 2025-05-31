"use client"

import { useState, useEffect } from "react"
import { Activity, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { CameraType } from "../types"

interface CameraListProps {
  cameras: CameraType[]
  selectedCamera: number | null
  onCameraSelect: (cameraId: number) => void
}

// Skeleton component for loading state
function CameraSkeleton() {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
        <div>
          <div className="w-16 h-3 bg-gray-600 rounded mb-1"></div>
          <div className="w-20 h-2 bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="w-12 h-2 bg-gray-600 rounded"></div>
      </div>
    </div>
  )
}

export function CameraList({ cameras, selectedCamera, onCameraSelect }: CameraListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Simulate loading for 2 seconds
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
      // Small delay before showing content for smooth transition
      setTimeout(() => setShowContent(true), 100)
    }, 2000)

    return () => clearTimeout(loadingTimer)
  }, [])

  return (
    <TooltipProvider>
      <Card
        className={`bg-black/20 backdrop-blur-md border-white/10 text-white ${
          selectedCamera ? "h-[calc(50vh-100px)]" : "h-[calc(100vh-200px)]"
        } flex flex-col camera-list-animate`}
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-emerald-400" />
            Trap Cameras ({isLoading ? "..." : cameras.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 overflow-y-auto flex-1">
          {isLoading
            ? // Show skeleton loading
              Array.from({ length: 8 }).map((_, index) => <CameraSkeleton key={index} />)
            : // Show actual camera data
              cameras.map((camera, index) => (
                <div
                  key={camera.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer camera-item-animate ${
                    selectedCamera === camera.id
                      ? "bg-emerald-400/20 border border-emerald-400/30"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => onCameraSelect(camera.id)}
                >
                  <div className="flex items-center gap-2">
                    {camera.status === "active" ? (
                      <Camera className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Camera className="w-3 h-3 text-emerald-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{camera.name}</p>
                      <p className="text-xs text-gray-400">{camera.area}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end gap-1">
                          <Activity className="h-3 w-3 text-emerald-400" />
                          <p className="text-xs text-emerald-400">{camera.lastDetection}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last image received</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
        </CardContent>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUpItem {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .camera-list-animate {
            transition: all 0.6s ease-out;
          }

          .camera-item-animate {
            opacity: 0;
            animation: fadeInUpItem 0.5s ease-out forwards;
          }
        `}</style>
      </Card>
    </TooltipProvider>
  )
}
