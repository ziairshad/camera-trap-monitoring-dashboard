"use client"

import React, { useState, useCallback } from 'react'
import { useMapbox } from '@/hooks/useMapbox'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Header } from "@/components/Header"
import { MAP_THEMES } from "@/config/constants"
import type { MapTheme } from "@/types"
import MapControls from '@/components/MapControls'
import MapControlBar from '@/components/MapControlBar'

import FeatureCard from '@/components/FeatureCard'
import GlobeTimelineFilter from '@/components/GlobeTimelineFilter'

export default function GlobeView() {
  const [currentMapTheme, setCurrentMapTheme] = useState<MapTheme>(MAP_THEMES[3])
  const [isGlobeView, setIsGlobeView] = useState(true)
  const [visibleLayers, setVisibleLayers] = useState({
    heatmap: false,
    rfi: true,
    reports: true,
    targets: true,
    layers: true
  })

  const [reportSubfilters, setReportSubfilters] = useState({
    system: true,
    legacy: true
  })

  const [rfiSubfilters, setRfiSubfilters] = useState({
    high: true,
    medium: true,
    low: true
  })

  const [timeRange, setTimeRange] = useState<{start: Date, end: Date} | undefined>(undefined)
  const [coordinateSystem, setCoordinateSystem] = useState<'dd' | 'dms'>('dd') // dd = decimal degrees, dms = degrees minutes seconds

  // Handle layer toggle
  const handleToggleLayer = useCallback((layerId: string, visible: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: visible
    }))
    
    // Handle subfilter cascading based on main layer state
    if (!visible) {
      // If main layer is turned off, turn off all its subfilters
      if (layerId === 'rfi') {
        setRfiSubfilters({
          high: false,
          medium: false,
          low: false
        })
      } else if (layerId === 'reports') {
        setReportSubfilters({
          system: false,
          legacy: false
        })
      }
    } else {
      // If main layer is turned on, turn on all its subfilters
      if (layerId === 'rfi') {
        setRfiSubfilters({
          high: true,
          medium: true,
          low: true
        })
      } else if (layerId === 'reports') {
        setReportSubfilters({
          system: true,
          legacy: true
        })
      }
    }
  }, [])

  // Handle report subfilter toggle
  const handleToggleReportSubfilter = useCallback((subfilter: 'system' | 'legacy', visible: boolean) => {
    setReportSubfilters(prev => {
      const newState = {
        ...prev,
        [subfilter]: visible
      }
      
      // If both subfilters are turned off, also turn off the main reports layer
      if (!newState.system && !newState.legacy) {
        handleToggleLayer('reports', false)
      }
      // If any subfilter is turned on and main reports layer is off, turn it on
      else if ((newState.system || newState.legacy) && !visibleLayers.reports) {
        handleToggleLayer('reports', true)
      }
      
      return newState
    })
  }, [reportSubfilters, handleToggleLayer, visibleLayers.reports])

  // Handle RFI subfilter toggle
  const handleToggleRfiSubfilter = useCallback((subfilter: 'high' | 'medium' | 'low', visible: boolean) => {
    setRfiSubfilters(prev => {
      const newState = {
        ...prev,
        [subfilter]: visible
      }
      
      // If all subfilters are turned off, also turn off the main RFI layer
      if (!newState.high && !newState.medium && !newState.low) {
        handleToggleLayer('rfi', false)
      }
      // If any subfilter is turned on and main RFI layer is off, turn it on
      else if ((newState.high || newState.medium || newState.low) && !visibleLayers.rfi) {
        handleToggleLayer('rfi', true)
      }
      
      return newState
    })
  }, [rfiSubfilters, handleToggleLayer, visibleLayers.rfi])

  const {
    mapContainer,
    mapError,
    currentTheme,
    toggleMapProjection,
    selectedFeature,
    setSelectedFeature,
    map,
    updateTimelineFilter,
    clearFeatureHighlighting,
    flyToLocation,
    originalGeoJsonData,
    mouseCoordinates
  } = useMapbox({
    cameras: [],
    initialThemeIndex: 3,
    currentTheme: currentMapTheme,
    isGlobeView: isGlobeView,
    selectedCamera: null,
    onToggleLayer: handleToggleLayer,
    visibleLayers,
    reportSubfilters,
    rfiSubfilters,
    timeRange,
    onFeatureClick: (feature) => {
      console.log('Feature clicked in GlobeView:', feature);
      // The highlighting is now handled automatically in useMapbox
    }
  })

  // Handle map view toggle
  const handleMapViewToggle = useCallback((newIsGlobeView: boolean) => {
    setIsGlobeView(newIsGlobeView)
    if (toggleMapProjection) {
      toggleMapProjection(newIsGlobeView)
    }
  }, [toggleMapProjection])

  // Handle map theme change
  const handleMapThemeChange = useCallback((theme: MapTheme) => {
    console.log('Theme change requested:', theme.name)
    setCurrentMapTheme(theme)
  }, [])

  // Handle feature card close - rotation disabled, simplified implementation
  const handleFeatureCardClose = useCallback(() => {
    setSelectedFeature(null);
    clearFeatureHighlighting(); // Clear feature highlighting when card is closed
  }, [setSelectedFeature, clearFeatureHighlighting])

  // Handle timeline filter changes
  const handleTimeRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setTimeRange({ start: startDate, end: endDate })
    if (updateTimelineFilter) {
      updateTimelineFilter(startDate, endDate)
    }
  }, [updateTimelineFilter])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onThemeChange: handleMapThemeChange,
    onProjectionToggle: handleMapViewToggle,
    themes: MAP_THEMES,
    isGlobeView,
    currentTheme: currentMapTheme,
    disabled: currentMapTheme.id !== currentTheme.id // Disable during theme changes
  })

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: { 
    id: string, 
    type: string, 
    coordinates: [number, number] 
  }) => {
    console.log('Search result selected:', result)
    
    // Fly to the location
    if (flyToLocation) {
      const zoomLevel = result.type === 'Place' ? 12 : 16
      flyToLocation(result.coordinates, zoomLevel)
    }
    
    // For data features, find and select the corresponding feature for highlighting
    if (result.type !== 'Place' && originalGeoJsonData?.features) {
      const feature = originalGeoJsonData.features.find((f: { properties?: { id?: string, type?: string } }) => 
        f.properties?.id === result.id && f.properties?.type === result.type
      )
      
      if (feature) {
        setSelectedFeature(feature)
      }
    } else if (result.type === 'Place') {
      // For places, clear any existing feature selection
      setSelectedFeature(null)
      clearFeatureHighlighting()
    }
  }, [flyToLocation, originalGeoJsonData, setSelectedFeature, clearFeatureHighlighting])

  // Helper function to convert decimal degrees to degrees, minutes, seconds
  const convertToDMS = useCallback((decimal: number, isLongitude: boolean) => {
    const abs = Math.abs(decimal)
    const degrees = Math.floor(abs)
    const minutes = Math.floor((abs - degrees) * 60)
    const seconds = ((abs - degrees) * 60 - minutes) * 60
    const direction = isLongitude ? (decimal >= 0 ? 'E' : 'W') : (decimal >= 0 ? 'N' : 'S')
    return `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`
  }, [])



  // Format coordinates based on selected system
  const formatCoordinates = useCallback((lng: number, lat: number) => {
    switch (coordinateSystem) {
      case 'dms':
        return `${convertToDMS(lng, true)} ${convertToDMS(lat, false)}`
      default: // 'dd'
        return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
    }
  }, [coordinateSystem, convertToDMS])

  // Toggle coordinate system
  const toggleCoordinateSystem = useCallback(() => {
    setCoordinateSystem(prev => {
      switch (prev) {
        case 'dd': return 'dms'
        case 'dms': return 'dd'
        default: return 'dd'
      }
    })
  }, [])

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Mapbox Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full pointer-events-auto z-10 transition-all duration-1000 ease-out"
        style={{
          background: mapError
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)"
            : "transparent",
        }}
      />

      {/* Loading Overlay for Basemap Changes */}
      {currentMapTheme.id !== currentTheme.id && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl">
            <div className="w-5 h-5 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin"></div>
            <div className="text-white">
              <div className="text-sm font-medium">Switching to {currentMapTheme.name}</div>
              <div className="text-xs text-white/60 mt-0.5">Preserving data layers...</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        mapError={mapError} 
        geoJsonData={originalGeoJsonData}
        onSearchResultSelect={handleSearchResultSelect}
      />

      {/* Unified Map Control Bar */}
      <MapControlBar
        currentTheme={currentMapTheme}
        onThemeChange={handleMapThemeChange}
        isGlobeView={isGlobeView}
        onProjectionToggle={handleMapViewToggle}
        isChanging={currentMapTheme.id !== currentTheme.id}
      />

      {/* Feature Details Card */}
      {selectedFeature && map && (
        <FeatureCard
          feature={selectedFeature}
          onClose={handleFeatureCardClose}
          map={map}
        />
      )}

      <MapControls 
        onToggleLayer={handleToggleLayer}
        onToggleReportSubfilter={handleToggleReportSubfilter}
        onToggleRfiSubfilter={handleToggleRfiSubfilter}
        visibleLayers={visibleLayers}
        reportSubfilters={reportSubfilters}
        rfiSubfilters={rfiSubfilters}
      />

      <GlobeTimelineFilter
        onTimeRangeChange={handleTimeRangeChange}
      />

      {/* Coordinate Display */}
      {mouseCoordinates && (
        <div className="fixed bottom-4 right-20 z-50 pointer-events-auto">
          <div 
            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono shadow-lg cursor-pointer hover:bg-black/30 transition-all duration-200"
            onClick={toggleCoordinateSystem}
            title={`Click to switch coordinate system (Current: ${coordinateSystem.toUpperCase()})`}
          >
            <div className="flex items-center gap-2">
              <span className="text-white/60 font-sans text-[10px] uppercase tracking-wide">
                {coordinateSystem}
              </span>
              <span className="text-white">
                {formatCoordinates(mouseCoordinates.lng, mouseCoordinates.lat)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 