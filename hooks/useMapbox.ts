"use client"

import { useEffect, useRef, useState } from "react"
import type { Camera, MapTheme } from "../types"
import { MAPBOX_TOKEN, ABU_DHABI_CENTER, MAP_THEMES } from "../config/constants"

export const useMapbox = (cameras: Camera[], selectedCamera?: number | null, mapTheme?: MapTheme) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const mapboxglRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const initializeMap = async () => {
    if (map.current || !mapContainer.current) return

    try {
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "YOUR_MAPBOX_PUBLIC_TOKEN_HERE") {
        setMapError("Please provide a valid Mapbox token")
        setMapLoaded(true)
        return
      }

      const mapboxgl = await import("mapbox-gl")
      await import("mapbox-gl/dist/mapbox-gl.css")

      mapboxglRef.current = mapboxgl.default
      mapboxgl.default.accessToken = MAPBOX_TOKEN

      // Use the provided theme or default to the first theme
      const themeStyle = mapTheme?.style || MAP_THEMES[0].style

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: themeStyle,
        center: ABU_DHABI_CENTER,
        zoom: 8,
        pitch: 0,
        bearing: 0,
        antialias: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
      })

      map.current.on("error", (e: any) => {
        console.error("Mapbox error details:", e)
        setMapError(`Map error: ${e.error?.message || "Unknown error"}`)
      })

      map.current.on("load", () => {
        console.log("Map fully loaded")
        setMapLoaded(true)
        setMapError(null)

        // Add markers immediately when map loads
        if (cameras.length > 0) {
          addCameraMarkers(selectedCamera)
        }

        map.current.easeTo({
          zoom: 11,
          duration: 2000,
          easing: (t: number) => t * (2 - t),
        })
      })
    } catch (error) {
      console.error("Failed to initialize Mapbox:", error)
      setMapError(`Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setMapLoaded(true)
    }
  }

  // Function to change the map style
  const changeMapStyle = (newTheme: MapTheme) => {
    if (map.current && mapLoaded) {
      try {
        map.current.setStyle(newTheme.style)

        // Re-add markers after style change
        map.current.once("style.load", () => {
          addCameraMarkers(selectedCamera)
        })
      } catch (error) {
        console.error("Error changing map style:", error)
      }
    }
  }

  const updateMarkerHighlight = (selectedCameraId?: number | null) => {
    // Update existing markers instead of recreating them
    markersRef.current.forEach(({ marker, camera, element }) => {
      const isSelected = selectedCameraId === camera.id
      const innerDot = element.querySelector(".camera-marker-dot")
      const pulseElement = element.querySelector(".camera-marker-pulse")

      if (innerDot) {
        const dotSize = isSelected ? "14px" : "10px"
        const borderWidth = isSelected ? "3px" : "1px"
        const borderColor = isSelected ? "#10b981" : "white"
        const boxShadow = isSelected
          ? "0 0 8px rgba(16, 185, 129, 0.8), 0 0 16px rgba(16, 185, 129, 0.4)"
          : "0 0 4px rgba(0,0,0,0.5)"

        innerDot.style.width = dotSize
        innerDot.style.height = dotSize
        innerDot.style.borderWidth = borderWidth
        innerDot.style.borderColor = borderColor
        innerDot.style.boxShadow = boxShadow
      }

      if (pulseElement && camera.status === "active") {
        const pulseSize = isSelected ? "20px" : "14px"
        pulseElement.style.width = pulseSize
        pulseElement.style.height = pulseSize
        pulseElement.style.opacity = isSelected ? "0.6" : "0.4"
      }

      // Update z-index
      element.style.zIndex = isSelected ? "1000" : "100"
    })
  }

  const addCameraMarkers = (selectedCameraId?: number | null) => {
    if (!map.current || !mapboxglRef.current) return

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      try {
        marker.remove()
      } catch (e) {
        console.warn("Error removing existing marker:", e)
      }
    })
    markersRef.current = []

    cameras.forEach((camera) => {
      try {
        const isSelected = selectedCameraId === camera.id
        const markerElement = createMarkerElement(camera, isSelected)
        const popup = createMarkerPopup(camera)

        const marker = new mapboxglRef.current.Marker({
          element: markerElement,
          anchor: "center",
          draggable: false,
        })
          .setLngLat([camera.lng, camera.lat])
          .setPopup(popup)

        marker.addTo(map.current)
        markersRef.current.push({ marker, camera, element: markerElement })
      } catch (error) {
        console.error(`Error adding marker for camera ${camera.name}:`, error)
      }
    })
  }

  const createMarkerElement = (camera: Camera, isSelected = false) => {
    const markerElement = document.createElement("div")
    markerElement.className = "camera-marker"
    markerElement.setAttribute("data-camera-id", camera.id.toString())

    const innerDot = document.createElement("div")
    innerDot.className = "camera-marker-dot"

    // Different styling for selected camera
    const dotSize = isSelected ? "14px" : "10px"
    const borderWidth = isSelected ? "3px" : "1px"
    const borderColor = isSelected ? "#10b981" : "white"
    const boxShadow = isSelected
      ? "0 0 8px rgba(16, 185, 129, 0.8), 0 0 16px rgba(16, 185, 129, 0.4)"
      : "0 0 4px rgba(0,0,0,0.5)"

    innerDot.style.cssText = `
      width: ${dotSize};
      height: ${dotSize};
      background-color: ${camera.status === "active" ? "#10b981" : "#ef4444"};
      border: ${borderWidth} solid ${borderColor};
      border-radius: 50%;
      box-shadow: ${boxShadow};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      transition: all 0.3s ease;
    `

    if (camera.status === "active") {
      const pulseElement = document.createElement("div")
      pulseElement.className = "camera-marker-pulse"
      const pulseSize = isSelected ? "20px" : "14px"
      pulseElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${pulseSize};
        height: ${pulseSize};
        background-color: #10b981;
        border-radius: 50%;
        opacity: ${isSelected ? 0.6 : 0.4};
        transform: translate(-50%, -50%);
        animation: cameraPulse 2s infinite;
        pointer-events: none;
        z-index: 0;
        transition: all 0.3s ease;
      `
      markerElement.appendChild(pulseElement)
    }

    markerElement.appendChild(innerDot)
    markerElement.style.cssText = `
      width: 20px;
      height: 20px;
      position: relative;
      cursor: pointer;
      z-index: ${isSelected ? 1000 : 100};
    `

    return markerElement
  }

  const createMarkerPopup = (camera: Camera) => {
    return new mapboxglRef.current.Popup({
      offset: 15,
      closeButton: false,
      closeOnClick: false,
      className: "camera-popup",
    }).setHTML(`
      <div style="
        background: rgba(17, 24, 39, 0.95);
        color: white;
        padding: 8px;
        border-radius: 6px;
        border: 1px solid rgba(75, 85, 99, 0.5);
        backdrop-filter: blur(10px);
        min-width: 120px;
        font-size: 12px;
      ">
        <div style="font-weight: bold; color: #10b981; margin-bottom: 3px;">${camera.name}</div>
        <div style="color: #d1d5db; margin-bottom: 2px;">Status: ${camera.status}</div>
        <div style="color: #d1d5db; margin-bottom: 2px;">Battery: ${camera.battery}%</div>
        <div style="color: #d1d5db;">Last: ${camera.lastDetection}</div>
      </div>
    `)
  }

  const flyToCamera = (camera: Camera) => {
    if (map.current) {
      map.current.flyTo({
        center: [camera.lng, camera.lat],
        zoom: 13,
        duration: 1000,
      })
    }
  }

  const cleanup = () => {
    try {
      if (map.current) {
        markersRef.current.forEach(({ marker }) => {
          try {
            marker.remove()
          } catch (e) {
            console.warn("Error removing existing marker:", e)
          }
        })
        markersRef.current = []
        map.current.remove()
        map.current = null
      }
    } catch (error) {
      console.error("Error cleaning up map:", error)
    }
  }

  useEffect(() => {
    initializeMap()
    return cleanup
  }, [])

  // Update map style when theme changes
  useEffect(() => {
    if (mapLoaded && mapTheme) {
      changeMapStyle(mapTheme)
    }
  }, [mapTheme, mapLoaded])

  // Initial markers when map loads and cameras are available
  useEffect(() => {
    if (mapLoaded && cameras.length > 0 && markersRef.current.length === 0) {
      addCameraMarkers(selectedCamera)
    }
  }, [mapLoaded, cameras])

  // Update marker highlights when selection changes (without recreating markers)
  useEffect(() => {
    if (mapLoaded && markersRef.current.length > 0) {
      updateMarkerHighlight(selectedCamera)
    }
  }, [selectedCamera])

  return {
    mapContainer,
    mapLoaded,
    mapError,
    flyToCamera,
  }
}
