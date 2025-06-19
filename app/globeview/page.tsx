"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMapbox } from '@/hooks/useMapbox'
import { Header } from "@/components/Header"
import { MAP_THEMES } from "@/config/constants"
import type { MapTheme } from "@/types"
import MapControls from '@/components/MapControls'
import GlobeControls from '@/components/GlobeControls'
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
  const [wasRotatingBeforeFeatureClick, setWasRotatingBeforeFeatureClick] = useState(false)
  const hasHandledCurrentFeature = useRef(false)
  const [timeRange, setTimeRange] = useState<{start: Date, end: Date} | undefined>(undefined)

  // Handle layer toggle
  const handleToggleLayer = useCallback((layerId: string, visible: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: visible
    }))
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
    highlightedFeatures
  } = useMapbox({
    cameras: [],
    initialThemeIndex: 1,
    isGlobeView: true,
    selectedCamera: null,
    onToggleLayer: handleToggleLayer,
    visibleLayers,
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

  // Watch for selectedFeature changes to handle rotation pause/resume
  useEffect(() => {
    if (selectedFeature && !hasHandledCurrentFeature.current) {
      // New feature was selected - check if we need to pause rotation
      if (isRotating) {
        console.log('Feature selected, pausing rotation');
        setWasRotatingBeforeFeatureClick(true);
        toggleRotation();
      }
      hasHandledCurrentFeature.current = true;
    } else if (!selectedFeature) {
      // Feature was deselected - reset the handler flag
      hasHandledCurrentFeature.current = false;
    }
  }, [selectedFeature, isRotating, toggleRotation])

  // Handle feature card close - resume rotation if it was rotating before
  const handleFeatureCardClose = useCallback(() => {
    setSelectedFeature(null);
    clearFeatureHighlighting(); // Clear feature highlighting when card is closed
    hasHandledCurrentFeature.current = false; // Reset the handler flag
    if (wasRotatingBeforeFeatureClick && !isRotating) {
      console.log('Resuming rotation after feature card close');
      toggleRotation(); // Resume rotation
      setWasRotatingBeforeFeatureClick(false);
    }
  }, [wasRotatingBeforeFeatureClick, isRotating, toggleRotation, setSelectedFeature, clearFeatureHighlighting])

  // Handle timeline filter changes
  const handleTimeRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setTimeRange({ start: startDate, end: endDate })
    if (updateTimelineFilter) {
      updateTimelineFilter(startDate, endDate)
    }
  }, [updateTimelineFilter])

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
        visibleLayers={visibleLayers}
      />

      <GlobeControls
        isRotating={isRotating}
        onToggleRotation={toggleRotation}
      />

      <GlobeTimelineFilter
        onTimeRangeChange={handleTimeRangeChange}
      />
    </div>
  )
} 