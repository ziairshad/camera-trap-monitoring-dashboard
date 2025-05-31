"use client"

import { useState, useEffect } from "react"
import { Scan } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Detection } from "../types"

interface DetectionsListProps {
  detections: Detection[]
  selectedDetection: Detection | null
  selectedCamera: number | null
  onDetectionSelect: (detection: Detection) => void
}

// Skeleton component for loading state
function DetectionSkeleton() {
  return (
    <div className="p-2 rounded-lg bg-white/5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="w-20 h-3 bg-gray-600 rounded"></div>
            <div className="w-8 h-4 bg-gray-600 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-16 h-2 bg-gray-700 rounded"></div>
            <div className="w-10 h-2 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DetectionsList({
  detections,
  selectedDetection,
  selectedCamera,
  onDetectionSelect,
}: DetectionsListProps) {
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
    <Card
      className={`bg-black/20 backdrop-blur-md border-white/10 text-white ${
        selectedDetection ? "h-[calc(50vh-100px)]" : "h-[calc(100vh-200px)]"
      } flex flex-col detections-list-animate`}
      style={{
        opacity: showContent ? 1 : 0,
        transform: showContent ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scan className="h-4 w-4 text-emerald-400" />
          Recent Detections {selectedCamera && !isLoading && `(${detections.length})`}
          {isLoading && "..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto flex-1">
        {isLoading
          ? // Show skeleton loading
            Array.from({ length: 6 }).map((_, index) => <DetectionSkeleton key={index} />)
          : // Show actual detection data
            detections.map((detection, index) => (
              <div
                key={detection.id}
                className={`p-2 rounded-lg transition-colors cursor-pointer detection-item-animate ${
                  selectedDetection?.id === detection.id
                    ? "bg-emerald-400/20 border border-emerald-400/30"
                    : "bg-white/5 hover:bg-white/10"
                }`}
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
                onClick={() => onDetectionSelect(detection)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <img
                      src={detection.thumbnail || "/placeholder.svg"}
                      alt={detection.animal}
                      className="w-12 h-12 rounded-lg object-cover border border-white/20"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=60&width=60&text=${encodeURIComponent(detection.animal)}`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-emerald-400 truncate">{detection.animal}</p>
                      <Badge
                        variant="outline"
                        className="border-emerald-400/50 text-emerald-400 text-xs ml-2 flex-shrink-0"
                      >
                        {detection.confidence}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="truncate">{detection.camera}</span>
                      <span className="flex-shrink-0 ml-2">{detection.time}</span>
                    </div>
                  </div>
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

        .detections-list-animate {
          transition: all 0.6s ease-out;
        }

        .detection-item-animate {
          opacity: 0;
          animation: fadeInUpItem 0.5s ease-out forwards;
        }
      `}</style>
    </Card>
  )
}
