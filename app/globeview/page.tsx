"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMapbox } from '@/hooks/useMapbox'
import { Header } from "@/components/Header"
import { MAP_THEMES } from "@/config/constants"
import type { MapTheme } from "@/types"
import MapControls from '@/components/MapControls'

import FeatureCard from '@/components/FeatureCard'
import GlobeTimelineFilter from '@/components/GlobeTimelineFilter'

export default function GlobeView() {
  const [currentMapTheme, setCurrentMapTheme] = useState<MapTheme>(MAP_THEMES[1])
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
    selectedFeature,
    setSelectedFeature,
    map,
    updateTimelineFilter,
    clearFeatureHighlighting,
    highlightedFeatures,
    flyToLocation,
    originalGeoJsonData
  } = useMapbox({
    cameras: [],
    initialThemeIndex: 1,
    isGlobeView: true,
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
    </div>
  )
} 