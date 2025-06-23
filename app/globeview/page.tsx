"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMapbox } from '@/hooks/useMapbox'
import { Header } from "@/components/Header"
import { MAP_THEMES } from "@/config/constants"
import type { MapTheme } from "@/types"
import MapControls from '@/components/MapControls'
import MapViewToggle from '@/components/MapViewToggle'

import FeatureCard from '@/components/FeatureCard'
import GlobeTimelineFilter from '@/components/GlobeTimelineFilter'

export default function GlobeView() {
  const [currentMapTheme, setCurrentMapTheme] = useState<MapTheme>(MAP_THEMES[1])
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

  const [timeRange, setTimeRange] = useState<{start: Date, end: Date} | undefined>(undefined)
  const [coordinateSystem, setCoordinateSystem] = useState<'dd' | 'dms' | 'utm'>('dd') // dd = decimal degrees, dms = degrees minutes seconds, utm = UTM

  // Handle layer toggle
  const handleToggleLayer = useCallback((layerId: string, visible: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: visible
    }))
  }, [])

  // Handle report subfilter toggle
  const handleToggleReportSubfilter = useCallback((subfilter: 'system' | 'legacy', visible: boolean) => {
    console.log('Report subfilter toggle:', { subfilter, visible, currentState: reportSubfilters })
    setReportSubfilters(prev => {
      const newState = {
        ...prev,
        [subfilter]: visible
      }
      console.log('New report subfilters state:', newState)
      return newState
    })
  }, [])

  const {
    mapContainer,
    mapLoaded,
    mapError,
    currentTheme,
    isRotating,
    toggleRotation,
    toggleMapProjection,
    selectedFeature,
    setSelectedFeature,
    map,
    updateTimelineFilter,
    clearFeatureHighlighting,
    highlightedFeatures,
    flyToLocation,
    originalGeoJsonData,
    mouseCoordinates
  } = useMapbox({
    cameras: [],
    initialThemeIndex: 1,
    isGlobeView: isGlobeView,
    selectedCamera: null,
    onToggleLayer: handleToggleLayer,
    visibleLayers,
    reportSubfilters,
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

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: any) => {
    console.log('Search result selected:', result)
    
    // Fly to the location
    if (flyToLocation) {
      const zoomLevel = result.type === 'Place' ? 12 : 16
      flyToLocation(result.coordinates, zoomLevel)
    }
    
    // For data features, find and select the corresponding feature for highlighting
    if (result.type !== 'Place' && originalGeoJsonData?.features) {
      const feature = originalGeoJsonData.features.find((f: any) => 
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

  // Helper function to convert decimal degrees to UTM (simplified)
  const convertToUTM = useCallback((lng: number, lat: number) => {
    // Simplified UTM conversion - in a real app you'd use a proper library like proj4
    const zone = Math.floor((lng + 180) / 6) + 1
    const hemisphere = lat >= 0 ? 'N' : 'S'
    // This is a very simplified approximation
    const easting = Math.round(((lng + 180) % 6) * 111320)
    const northing = Math.round(lat * 110540)
    return `${zone}${hemisphere} ${easting}E ${Math.abs(northing)}N`
  }, [])

  // Format coordinates based on selected system
  const formatCoordinates = useCallback((lng: number, lat: number) => {
    switch (coordinateSystem) {
      case 'dms':
        return `${convertToDMS(lng, true)} ${convertToDMS(lat, false)}`
      case 'utm':
        return convertToUTM(lng, lat)
      default: // 'dd'
        return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
    }
  }, [coordinateSystem, convertToDMS, convertToUTM])

  // Toggle coordinate system
  const toggleCoordinateSystem = useCallback(() => {
    setCoordinateSystem(prev => {
      switch (prev) {
        case 'dd': return 'dms'
        case 'dms': return 'utm'
        case 'utm': return 'dd'
        default: return 'dd'
      }
    })
  }, [])

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Mapbox Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full pointer-events-auto z-10"
        style={{
          background: mapError
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)"
            : "transparent",
        }}
      />

      {/* Header */}
      <Header 
        mapError={mapError} 
        currentMapTheme={currentMapTheme} 
        onMapThemeChange={handleMapThemeChange}
        geoJsonData={originalGeoJsonData}
        onSearchResultSelect={handleSearchResultSelect}
      />

      {/* Map View Toggle */}
      <MapViewToggle 
        isGlobeView={isGlobeView}
        onToggle={handleMapViewToggle}
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
        visibleLayers={visibleLayers}
        reportSubfilters={reportSubfilters}
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