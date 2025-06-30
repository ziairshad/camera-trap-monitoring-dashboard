"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Camera, MapTheme } from "../types"
import { MAPBOX_TOKEN, ABU_DHABI_CENTER, MAP_THEMES } from "../config/constants"

interface UseMapboxProps {
  cameras: Camera[]
  initialThemeIndex?: number
  currentTheme?: MapTheme
  isGlobeView?: boolean
  onToggleLayer?: (layerId: string, visible: boolean) => void
  visibleLayers?: {
    heatmap: boolean
    rfi: boolean
    reports: boolean
    targets: boolean
    layers: boolean
  }
  reportSubfilters?: {
    system: boolean
    legacy: boolean
  }
  rfiSubfilters?: {
    high: boolean
    medium: boolean
    low: boolean
  }
  selectedCamera?: Camera | null
  onFeatureClick?: (feature: any) => void
  timeRange?: {
    start: Date
    end: Date
  }
}

export const useMapbox = ({
  cameras,
  initialThemeIndex = 0,
  currentTheme: externalCurrentTheme,
  isGlobeView = false,
  onToggleLayer,
  visibleLayers = {
    heatmap: false,
    rfi: true,
    reports: true,
    targets: true,
    layers: true
  },
  reportSubfilters = {
    system: true,
    legacy: true
  },
  rfiSubfilters = {
    high: true,
    medium: true,
    low: true
  },
  selectedCamera = null,
  onFeatureClick,
  timeRange
}: UseMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const mapboxglRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const navigationControlRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [currentTheme, setCurrentTheme] = useState(externalCurrentTheme || MAP_THEMES[initialThemeIndex])
  const [isRotating, setIsRotating] = useState(false)
  const userInteracting = useRef(false)
  const spinEnabled = useRef(false)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [originalGeoJsonData, setOriginalGeoJsonData] = useState<any>(null)
  const [highlightedFeatures, setHighlightedFeatures] = useState<Set<string>>(new Set())
  const [mouseCoordinates, setMouseCoordinates] = useState<{ lng: number; lat: number } | null>(null)
  const [isStyleChanging, setIsStyleChanging] = useState(false)

  // Add layer state preservation for optimized basemap changes
  const layerStateRef = useRef<{
    dataLoaded: boolean
    imagesLoaded: boolean
    clickHandlersAdded: boolean
    currentData: any
    layerVisibility: Record<string, boolean>
  }>({
    dataLoaded: false,
    imagesLoaded: false,
    clickHandlersAdded: false,
    currentData: null,
    layerVisibility: {}
  })

  // Cache for loaded images to prevent re-loading
  const imageCache = useRef<Set<string>>(new Set())

  // Rotation disabled - keeping minimal implementation for compatibility
  const spinGlobe = useCallback(() => {
    return
  }, [])

  const toggleRotation = useCallback(() => {
    return
  }, [])

  // Optimized function to prepare filtered data without recreating layers
  const prepareFilteredData = useCallback((data: any) => {
    let filteredData = data
    if (timeRange) {
      filteredData = {
        ...data,
        features: data.features.filter((feature: any) => {
          const featureType = feature.properties?.type
          const timestamp = feature.properties?.timestamp
          
          if (featureType === 'Target') return true
          if (!timestamp) return true
          
          const featureDate = new Date(timestamp)
          return featureDate >= timeRange.start && featureDate <= timeRange.end
        })
      }
    }

    // Apply report subfilters
    filteredData = {
      ...filteredData,
      features: filteredData.features.filter((feature: any) => {
        const featureType = feature.properties?.type
        const source = feature.properties?.source
        
        if (featureType === 'Report') {
          if (source === 'System' && !reportSubfilters.system) return false
          if (source === 'Legacy' && !reportSubfilters.legacy) return false
        }
        
        return true
      })
    }

    // Apply RFI priority subfilters
    filteredData = {
      ...filteredData,
      features: filteredData.features.filter((feature: any) => {
        const featureType = feature.properties?.type
        const priority = feature.properties?.priority
        
        if (featureType === 'RFI') {
          if (priority === 'High' && !rfiSubfilters.high) return false
          if (priority === 'Medium' && !rfiSubfilters.medium) return false
          if (priority === 'Low' && !rfiSubfilters.low) return false
        }
        
        return true
      })
    }

    return filteredData
  }, [timeRange, reportSubfilters, rfiSubfilters])

  // Optimized function to add/restore layers with state preservation
  const addMapDataAndLayers = useCallback(async () => {
    if (!map.current || isStyleChanging) return

    try {
      console.log('🔄 Optimized layer restoration starting...')
      
      let data = layerStateRef.current.currentData
      
      // Only fetch data if we haven't loaded it yet or if filters changed
      if (!layerStateRef.current.dataLoaded || !data) {
        console.log('📊 Fetching GeoJSON data...')
        const response = await fetch('/global_map_data_biased.geojson')
        data = await response.json()
        setOriginalGeoJsonData(data)
        layerStateRef.current.currentData = data
        layerStateRef.current.dataLoaded = true
        console.log('📊 GeoJSON data cached:', data.features?.length, 'features')
      } else {
        console.log('📊 Using cached GeoJSON data')
      }

      const filteredData = prepareFilteredData(data)

      // Check if source exists, if not add it
      if (!map.current.getSource('rfi-data')) {
        console.log('➕ Adding GeoJSON source...')
        map.current.addSource('rfi-data', {
          type: 'geojson',
          data: filteredData
        })
      } else {
        console.log('🔄 Updating existing GeoJSON source...')
        const source = map.current.getSource('rfi-data') as any
        source.setData(filteredData)
      }

      // Store current layer visibility before restoration
      const currentVisibility = { ...visibleLayers }
      layerStateRef.current.layerVisibility = currentVisibility

      // Add polygon layers if they don't exist
      if (!map.current.getLayer('rfi-polygons')) {
        console.log('📐 Adding polygon layers...')
        
        map.current.addLayer({
          id: 'rfi-polygons',
          type: 'fill',
          source: 'rfi-data',
          filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'RFI']],
          paint: {
            'fill-color': '#dc2626',
            'fill-opacity': 0.2,
            'fill-outline-color': '#ffffff'
          },
          layout: { visibility: currentVisibility.rfi ? 'visible' : 'none' }
        })

        map.current.addLayer({
          id: 'layers-polygons',
          type: 'fill',
          source: 'rfi-data',
          filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'Layer']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.4,
            'fill-outline-color': '#ffffff'
          },
          layout: { visibility: currentVisibility.layers ? 'visible' : 'none' }
        })

        map.current.addLayer({
          id: 'layers-polygons-outline',
          type: 'line',
          source: 'rfi-data',
          filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'Layer']],
          paint: {
            'line-color': '#ffffff',
            'line-width': 2,
            'line-opacity': 0.8
          },
          layout: { visibility: currentVisibility.layers ? 'visible' : 'none' }
        })
      }

      // Add heatmap layer if it doesn't exist
      if (!map.current.getLayer('rfi-heatmap')) {
        map.current.addLayer({
          id: 'rfi-heatmap',
          type: 'heatmap',
          source: 'rfi-data',
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 5, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 3, 5, 6],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.1, 'rgba(0, 0, 255, 0)',
              0.2, 'rgba(0, 0, 255, 0.7)',
              0.4, 'rgba(0, 255, 255, 0.7)',
              0.6, 'rgba(0, 255, 0, 0.7)',
              0.8, 'rgba(255, 255, 0, 0.7)',
              0.9, 'rgba(255, 0, 0, 0.7)',
              1, 'rgba(255, 0, 0, 1)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 5, 50],
            'heatmap-opacity': 0.9
          },
          layout: { visibility: currentVisibility.heatmap ? 'visible' : 'none' }
        })
      }

      // Add point layers with optimized image loading
      const layerConfigs = [
        { id: 'rfi-points', type: 'RFI', icon: '/data/RFI.png', iconName: 'rfi-icon', visible: currentVisibility.rfi },
        { id: 'reports-points', type: 'Report', icon: '/data/Report.png', iconName: 'report-icon', visible: currentVisibility.reports },
        { id: 'targets-points', type: 'Target', icon: '/data/Target.png', iconName: 'target-icon', visible: currentVisibility.targets }
      ]

      // Only load images that haven't been loaded yet
      const loadImagePromises = layerConfigs.map(({ id, type, icon, iconName, visible }) => {
        return new Promise<void>((resolve) => {
          // If layer already exists, just resolve
          if (map.current?.getLayer(id)) {
            console.log(`✅ Layer ${id} already exists, skipping`)
            resolve()
            return
          }
          
          // Check if image is already cached/loaded
          if (imageCache.current.has(iconName) && map.current?.hasImage(iconName)) {
            console.log(`✅ Using cached image ${iconName}`)
            // Add the layer directly with cached image
            try {
              map.current?.addLayer({
                id,
                type: 'symbol',
                source: 'rfi-data',
                filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], type]],
                layout: {
                  'icon-image': iconName,
                  'icon-size': 0.5,
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  visibility: visible ? 'visible' : 'none'
                },
                paint: {
                  'icon-opacity': 1.0
                }
              })
              console.log(`✅ Added layer ${id} with cached icon ${iconName}`)
            } catch (error) {
              console.warn(`⚠️ Failed to add layer ${id} with cached image:`, error)
            }
            resolve()
            return
          }
          
          // Load image for the first time
          map.current?.loadImage(icon, (error, image) => {
            try {
              let finalIconName = iconName
              
              if (error || !image) {
                console.warn(`⚠️ Failed to load image ${icon}:`, error)
                finalIconName = 'marker-15'
              } else {
                try {
                  if (!map.current?.hasImage(iconName)) {
                    map.current?.addImage(iconName, image)
                    imageCache.current.add(iconName)
                    console.log(`✅ Added and cached image ${iconName}`)
                  }
                } catch (imageError) {
                  console.warn(`⚠️ Failed to add image ${iconName}:`, imageError)
                  finalIconName = 'marker-15'
                }
              }
              
              try {
                map.current?.addLayer({
                  id,
                  type: 'symbol',
                  source: 'rfi-data',
                  filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], type]],
                  layout: {
                    'icon-image': finalIconName,
                    'icon-size': 0.5,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                    visibility: visible ? 'visible' : 'none'
                  },
                  paint: {
                    'icon-opacity': 1.0
                  }
                })
                
                console.log(`✅ Added layer ${id} with icon ${finalIconName}`)
              } catch (addLayerError) {
                console.warn(`⚠️ Failed to add layer ${id}:`, addLayerError)
              }
            } catch (overallError) {
              console.error(`❌ Overall error in layer creation ${id}:`, overallError)
            }
            
            resolve()
          })
        })
      })

      await Promise.all(loadImagePromises)
      
      // Only add click handlers if they haven't been added yet
      if (!layerStateRef.current.clickHandlersAdded) {
        console.log('🎯 Adding optimized click handlers...')
        
        // Add a small delay to ensure layers are fully rendered
        setTimeout(() => {

        // Add a single unified click handler that prioritizes point features over polygons
        const layerIds = ['rfi-points', 'reports-points', 'targets-points', 'rfi-polygons', 'layers-polygons']
        
        // Single click handler for the entire map
        map.current?.on('click', (e) => {
          // Query all features at the click point
          const allFeatures = map.current?.queryRenderedFeatures(e.point, { layers: layerIds })
          
          if (!allFeatures || allFeatures.length === 0) {
            console.log('🎯 Clicked on empty space, clearing highlights')
            clearFeatureHighlighting()
            return
          }
          
          console.log('🎯 Found', allFeatures.length, 'features at click point')
          
          // Prioritize point features over polygon features
          const pointFeatures = allFeatures.filter(f => {
            const layerId = f.layer?.id
            return layerId && ['rfi-points', 'reports-points', 'targets-points'].includes(layerId)
          })
          
          const polygonFeatures = allFeatures.filter(f => {
            const layerId = f.layer?.id
            return layerId && ['rfi-polygons', 'layers-polygons'].includes(layerId)
          })
          
          // Select the highest priority feature
          let selectedFeature
          if (pointFeatures.length > 0) {
            selectedFeature = pointFeatures[0]
            console.log('🎯 Prioritizing point feature:', selectedFeature.properties?.id, selectedFeature.properties?.type)
          } else if (polygonFeatures.length > 0) {
            selectedFeature = polygonFeatures[0]
            console.log('🎯 Selecting polygon feature:', selectedFeature.properties?.id, selectedFeature.properties?.type)
          }
          
          if (selectedFeature) {
            console.log('🔗 Feature properties:', selectedFeature.properties)
            handleFeatureSelection(selectedFeature)
          }
        })

        // Add mouse enter/leave handlers for cursor changes
        layerIds.forEach(layerId => {
          if (map.current?.getLayer(layerId)) {
            console.log(`✅ Adding hover handler for layer: ${layerId}`)
            
            map.current.on('mouseenter', layerId, () => {
              if (map.current) {
                map.current.getCanvas().style.cursor = 'pointer'
              }
            })

            map.current.on('mouseleave', layerId, () => {
              if (map.current) {
                map.current.getCanvas().style.cursor = ''
              }
            })
          } else {
            console.warn(`⚠️ Layer ${layerId} not found, skipping hover handler`)
          }
        })

        // Mouse coordinate tracking
        map.current?.on('mousemove', (e) => {
          const { lng, lat } = e.lngLat
          setMouseCoordinates({ lng, lat })
        })

        map.current?.on('mouseleave', () => {
          setMouseCoordinates(null)
        })

        layerStateRef.current.clickHandlersAdded = true
        console.log('✅ Click handlers added and cached')
        }, 100) // Close setTimeout with 100ms delay
      } else {
        console.log('✅ Using existing click handlers')
      }

      console.log('✅ Optimized layer restoration completed successfully')
    } catch (error) {
      console.error('❌ Error in optimized layer restoration:', error)
      
      // If it's a symbol placement error, try to recover
      if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
        console.log('🔄 Detected symbol placement error, attempting recovery...')
        
        // Wait a moment and try to reinitialize just the problematic symbol layers
        setTimeout(() => {
          try {
            // Remove potentially problematic layers
            const problematicLayers = ['rfi-points', 'reports-points', 'targets-points']
            problematicLayers.forEach(layerId => {
              if (map.current?.getLayer(layerId)) {
                try {
                  map.current.removeLayer(layerId)
                } catch (e) {
                  console.warn(`Warning removing problematic layer ${layerId}:`, e)
                }
              }
            })
            
            // Re-add them with basic markers only
            problematicLayers.forEach((layerId, index) => {
              const types = ['RFI', 'Report', 'Target']
              const visibilities = [visibleLayers.rfi, visibleLayers.reports, visibleLayers.targets]
              
              try {
                map.current?.addLayer({
                  id: layerId,
                  type: 'circle',
                  source: 'rfi-data',
                  filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'type'], types[index]]],
                  paint: {
                    'circle-radius': 6,
                    'circle-color': index === 0 ? '#dc2626' : index === 1 ? '#059669' : '#2563eb',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                  },
                  layout: { visibility: visibilities[index] ? 'visible' : 'none' }
                })
                console.log(`✅ Added fallback circle layer for ${layerId}`)
              } catch (fallbackError) {
                console.error(`❌ Even fallback failed for ${layerId}:`, fallbackError)
              }
            })
          } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError)
          }
        }, 1000) // 1 second delay for recovery
      }
    }
  }, [visibleLayers, timeRange, reportSubfilters, rfiSubfilters, prepareFilteredData])

  // Function to apply theme-appropriate atmosphere and fog settings
  const applyThemeAtmosphere = useCallback((themeId: string, forceGlobe?: boolean) => {
    if (!map.current) return
    
    // Use the forceGlobe parameter if provided, otherwise fall back to isGlobeView
    const shouldApplyAtmosphere = forceGlobe !== undefined ? forceGlobe : isGlobeView
    
    if (!shouldApplyAtmosphere) return

    switch (themeId) {
      case 'satellite':
        // Satellite - use minimal fog to avoid artifacts
        map.current.setFog({
          'star-intensity': 0,
          'horizon-blend': 0.005
        })
        break
      
      case 'streets':
        // Streets - use minimal fog to avoid artifacts
        map.current.setFog({
          'star-intensity': 0,
          'horizon-blend': 0.005
        })
        break
      
      case 'dark':
        // Dark theme with black space only
        map.current.setFog({
          'space-color': 'rgb(0, 0, 0)',
          'star-intensity': 0,
          'horizon-blend': 0.005
        })
        break
      
      case 'space42-blue':
      case 'custom':
        // GIX Blue theme - keep custom atmosphere but fix artifacts
        map.current.setFog({
          'color': 'rgb(41, 128, 255)',
          'high-color': 'rgb(41, 128, 255)',
          'space-color': 'rgb(1, 12, 32)',
          'star-intensity': 0,
          'horizon-blend': 0.005
        })
        break
      
      default:
        // Default atmosphere for unknown themes
        map.current.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6,
          'range': [0.5, 2]
        })
        break
    }
  }, [isGlobeView])

  const initializeMap = async () => {
    if (map.current || !mapContainer.current) return

    try {
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith("YOUR_MAPBOX")) {
        setMapError("Please provide a valid Mapbox token")
        setMapLoaded(true)
        return
      }

      console.log('🗺️ Initializing Mapbox...')
      console.log('🎨 Initial theme:', (externalCurrentTheme || currentTheme).name, 'with style:', (externalCurrentTheme || currentTheme).style)
      const mapboxgl = await import("mapbox-gl")
      mapboxglRef.current = mapboxgl.default
      mapboxgl.default.accessToken = MAPBOX_TOKEN

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: (externalCurrentTheme || currentTheme).style,
        center: isGlobeView ? [54.3773, 24.4539] : [54.3773, 24.4539],
        zoom: isGlobeView ? 3.2 : 5,
        pitch: 0,
        bearing: 0,
        antialias: true,
        preserveDrawingBuffer: false, // Changed to false to prevent texture caching
        projection: isGlobeView ? 'globe' : 'mercator',
        failIfMajorPerformanceCaveat: false,
        attributionControl: false,
      })

      map.current.on("error", (e: any) => {
        // Check if this is a meaningful error by looking for actual content
        const hasErrorMessage = e?.error?.message && e.error.message.trim().length > 0
        const hasType = e?.type && e.type.trim().length > 0
        const hasSourceId = e?.sourceId && e.sourceId.trim().length > 0
        const hasActualError = e?.error && Object.keys(e.error).length > 0
        const hasOtherProperties = Object.keys(e || {}).filter(key => key !== 'error').length > 0
        
        // Only log if there's meaningful content
        if (hasErrorMessage || hasType || hasSourceId || hasActualError || hasOtherProperties) {
          console.error("❌ Mapbox error:", e)
          setMapError(`Map error: ${e.error?.message || "Unknown error"}`)
        }
        // Silently ignore empty error objects
      })

      map.current.on('load', async () => {
        console.log('✅ Map loaded successfully')
      setMapLoaded(true)
        
        // Add atmosphere for globe view with theme-appropriate settings
        if (isGlobeView) {
          applyThemeAtmosphere(currentTheme.id)
        }

        // Add navigation controls
          if (!navigationControlRef.current) {
            navigationControlRef.current = new mapboxglRef.current.NavigationControl({
              showCompass: true,
              showZoom: true,
              visualizePitch: true
            })
                         map.current?.addControl(navigationControlRef.current, 'bottom-right')
          }
          
        // Add map data and layers
        await addMapDataAndLayers()
        })

      } catch (error) {
      console.error("❌ Failed to initialize Mapbox:", error)
      setMapError(`Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setMapLoaded(true)
    }
  }

  // Optimized projection transition strategies
  interface TransitionStrategy {
    name: string
    execute: (params: TransitionParams) => Promise<void>
  }

  interface TransitionParams {
    map: mapboxgl.Map
    newIsGlobeView: boolean
    currentTheme: MapTheme
    targetZoom: number
    currentCenter: mapboxgl.LngLat
    containerElement: HTMLDivElement
  }

  // Smooth transition strategy for flat-to-globe
  const smoothTransitionStrategy: TransitionStrategy = {
    name: 'smooth',
    execute: async ({ map, newIsGlobeView, currentTheme, targetZoom }) => {
      console.log('✨ Executing smooth transition strategy')
      
      // Apply atmosphere changes for immediate visual feedback
      if (newIsGlobeView && map.getProjection().name !== 'globe') {
        applyThemeAtmosphere(currentTheme.id, true)
      } else if (!newIsGlobeView) {
        map.setFog(null)
      }
      
      // Smooth zoom and camera transition
      await new Promise<void>((resolve) => {
        map.easeTo({
          zoom: targetZoom,
          pitch: 0,
          bearing: 0,
          duration: 1200,
          easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        })
        
        // Change projection during transition
        setTimeout(() => {
          try {
            (map as any).setProjection({
              name: newIsGlobeView ? 'globe' : 'mercator'
            })
            
            // Re-apply atmosphere after projection change
            if (newIsGlobeView) {
              setTimeout(() => applyThemeAtmosphere(currentTheme.id, true), 100)
            }
            
            setTimeout(resolve, 900) // Complete after transition
          } catch (error) {
            console.warn('Projection change failed, using fallback:', error)
            map.easeTo({ zoom: targetZoom, duration: 600 })
            setTimeout(resolve, 600)
          }
        }, 300)
      })
    }
  }

  // Aggressive cleanup strategy for globe-to-flat
  const aggressiveCleanupStrategy: TransitionStrategy = {
    name: 'aggressive',
    execute: async ({ map, newIsGlobeView, currentTheme, targetZoom, currentCenter, containerElement }) => {
      console.log('🚨 Executing aggressive cleanup strategy')
      
      // Store current state
      const currentState = {
        center: currentCenter,
        zoom: targetZoom,
        pitch: 0,
        bearing: 0
      }
      
      // Clean up current map instance
      await cleanupMapInstance(map, containerElement)
      
      // Re-initialize with clean state
      return reinitializeMap(containerElement, currentTheme, currentState, newIsGlobeView)
    }
  }

  // Utility functions for map management
  const cleanupMapInstance = async (map: mapboxgl.Map, container: HTMLDivElement): Promise<void> => {
    try {
      // Remove controls
      if (navigationControlRef.current) {
        map.removeControl(navigationControlRef.current)
        navigationControlRef.current = null
      }
      
      // Clear markers
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      
      // Force WebGL cleanup
      const canvas = container.querySelector('canvas')
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        if (gl?.getExtension) {
          const loseContext = gl.getExtension('WEBGL_lose_context')
          loseContext?.loseContext()
        }
      }
      
      // Remove map and clear container
      map.remove()
      container.innerHTML = ''
    } catch (error) {
      console.warn('Cleanup error:', error)
    }
  }

  const reinitializeMap = async (
    container: HTMLDivElement, 
    theme: MapTheme, 
    state: any, 
    isGlobeView: boolean
  ): Promise<void> => {
    if (!mapboxglRef.current) throw new Error('Mapbox GL not loaded')
    
    return new Promise((resolve, reject) => {
      try {
                 map.current = new mapboxglRef.current.Map({
           container,
           style: theme.style,
           center: state.center,
           zoom: state.zoom,
           pitch: state.pitch,
           bearing: state.bearing,
           antialias: true,
           preserveDrawingBuffer: false,
           projection: isGlobeView ? 'globe' : 'mercator',
           failIfMajorPerformanceCaveat: false,
           attributionControl: false,
         })

         if (!map.current) {
           reject(new Error('Failed to create map instance'))
           return
         }

         map.current.on('error', (e: any) => {
           // Check if this is a meaningful error by looking for actual content
           const hasErrorMessage = e?.error?.message && e.error.message.trim().length > 0
           const hasType = e?.type && e.type.trim().length > 0
           const hasSourceId = e?.sourceId && e.sourceId.trim().length > 0
           const hasActualError = e?.error && Object.keys(e.error).length > 0
           const hasOtherProperties = Object.keys(e || {}).filter(key => key !== 'error').length > 0
           
           // Only log and reject if there's meaningful content
           if (hasErrorMessage || hasType || hasSourceId || hasActualError || hasOtherProperties) {
             console.error('Map error:', e)
             setMapError(`Map error: ${e.error?.message || 'Unknown error'}`)
             reject(e)
           }
           // Silently ignore empty error objects during reinitialize
         })

         map.current.on('load', async () => {
          try {
            console.log('✅ Map re-initialized successfully')
            
            // Apply theme-specific settings
            if (isGlobeView) {
              // Apply atmosphere for globe view
              applyThemeAtmosphere(theme.id, true)
            } else {
              // Clear fog for flat view
              map.current?.setFog(null)
            }

            // Add navigation controls
            if (mapboxglRef.current) {
              navigationControlRef.current = new mapboxglRef.current.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
              })
              map.current?.addControl(navigationControlRef.current, 'bottom-right')
            }
            
            // Restore data and markers
            await addMapDataAndLayers()
            if (cameras.length > 0) {
              addCameraMarkers(selectedCamera?.id)
            }
            
            resolve()
          } catch (error) {
            console.error('Failed to restore map data:', error)
            reject(error)
          }
        })
      } catch (error) {
        console.error('Failed to reinitialize map:', error)
        reject(error)
      }
    })
  }

  // Optimized projection toggle function
  const toggleMapProjection = useCallback(async (newIsGlobeView: boolean) => {
    if (!map.current || !mapContainer.current) return
    
    console.log(`🌍 Starting transition to ${newIsGlobeView ? 'globe' : 'flat'} projection`)
    
    try {
      const currentThemeToUse = externalCurrentTheme || currentTheme
      const currentZoom = map.current.getZoom()
      const currentProjection = map.current.getProjection()
      const currentCenter = map.current.getCenter()
      const isGlobeToFlat = currentProjection.name === 'globe' && !newIsGlobeView
      
      // Calculate optimal zoom for target projection
      const targetZoom = newIsGlobeView ? 
        Math.max(Math.min(currentZoom * 0.7, 4), 1.5) : 
        Math.max(Math.min(currentZoom * 1.3, 8), 3)
      
      const transitionParams: TransitionParams = {
        map: map.current,
        newIsGlobeView,
        currentTheme: currentThemeToUse,
        targetZoom,
        currentCenter,
        containerElement: mapContainer.current
      }
      
      // Select appropriate transition strategy
      const strategy = isGlobeToFlat ? aggressiveCleanupStrategy : smoothTransitionStrategy
      
      console.log(`📋 Using ${strategy.name} transition strategy`)
      await strategy.execute(transitionParams)
      
      console.log('✅ Projection transition completed successfully')
      
    } catch (error: any) {
      // Check if this is a meaningful error by looking for actual content
      const hasErrorMessage = error?.message && error.message.trim().length > 0
      const hasName = error?.name && error.name.trim().length > 0
      const hasStack = error?.stack && error.stack.trim().length > 0
      const hasOtherProperties = Object.keys(error || {}).length > 0
      
      // Only log if there's meaningful content
      if (hasErrorMessage || hasName || hasStack || (hasOtherProperties && error instanceof Error)) {
        console.error('❌ Projection transition failed:', error)
        setMapError(`Transition error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      // Silently ignore empty error objects during projection transitions
    }
  }, [currentTheme, externalCurrentTheme, applyThemeAtmosphere, addMapDataAndLayers, cameras, selectedCamera])

  // Optimized theme change function
  const changeMapStyle = useCallback(async (newTheme: MapTheme) => {
    if (!map.current || isStyleChanging) {
      console.log('🎨 Style change blocked - map not ready or change in progress')
      return
    }
    
    // Double-check we're not changing to the same theme
    if (currentTheme.id === newTheme.id) {
      console.log('🎨 Style change blocked - already using this theme')
      return
    }
    
    console.log('🎨 Changing map style to:', newTheme.name)
    setIsStyleChanging(true)
    setCurrentTheme(newTheme)
    
    try {
      // Use promise-based approach for better error handling
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Style change timeout'))
        }, 10000) // 10 second timeout
        
        const handleStyleData = async () => {
          try {
            clearTimeout(timeout)
            console.log('🎨 Style loaded, restoring layers...')
            
            // For satellite style, add extra delay to ensure all tiles are loaded
            if (newTheme.id === 'satellite') {
              console.log('🛰️ Satellite style detected, waiting for tiles to load...')
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            // Apply theme-specific atmosphere
            if (isGlobeView) {
              applyThemeAtmosphere(newTheme.id)
            }
            
            // Restore data layers with retry logic
            try {
              await addMapDataAndLayers()
            } catch (layerError) {
              console.warn('⚠️ First attempt to add layers failed, retrying...', layerError)
              // Retry once after a short delay
              await new Promise(resolve => setTimeout(resolve, 200))
              await addMapDataAndLayers()
            }
            
            // Clean up event listener
            map.current?.off('styledata', handleStyleData)
            resolve()
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }
        
        map.current?.on('styledata', handleStyleData)
        map.current?.setStyle(newTheme.style)
      })
      
      console.log('✅ Style change completed successfully')
    } catch (error) {
      console.error('❌ Error changing map style:', error)
      setMapError(`Style change error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStyleChanging(false)
    }
  }, [isGlobeView, addMapDataAndLayers, isStyleChanging, applyThemeAtmosphere])

  // Camera marker functions
  const addCameraMarkers = (selectedCameraId?: number | null) => {
    if (!map.current || !mapboxglRef.current) return

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      try {
        marker.remove()
      } catch (e) {
        console.warn("Error removing marker:", e)
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

    markerElement.addEventListener("click", (e) => {
      e.stopPropagation()
      window.dispatchEvent(new CustomEvent("cameraMarkerClick", { detail: { cameraId: camera.id } }))
    })

    const innerDot = document.createElement("div")
    innerDot.className = "camera-marker-dot"

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
        background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(16px);
      color: white;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 140px;
      font-size: 12px;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">${camera.name}</div>
        <div style="margin-bottom: 4px;">Status: <span style="color: ${camera.status === 'active' ? '#10b981' : '#ef4444'}">${camera.status}</span></div>
        <div style="margin-bottom: 4px;">Area: ${camera.area}</div>
        <div style="margin-bottom: 4px;">Battery: ${camera.battery}%</div>
        <div>Last: ${camera.lastDetection}</div>
    </div>
  `)
  }

  const updateMarkerHighlight = (selectedCameraId?: number | null) => {
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

      element.style.zIndex = isSelected ? "1000" : "100"
    })
  }

  // Feature interaction functions
  const getRelatedFeatureIds = useCallback((feature: any) => {
    if (!feature?.properties) {
      console.log('⚠️ No feature properties found')
      return new Set<string>()
    }
    
    const relatedIds = new Set<string>()
    const props = feature.properties
    
    // Always add the clicked feature's own ID
    relatedIds.add(props.id)
    console.log('🔍 Processing feature:', props.id, 'type:', props.type)
    
    const addArrayToSet = (arr: any, arrayName: string) => {
      // Handle different data formats (vector tiles, GeoJSON, etc.)
      let arrayToProcess = arr
      
      // If it's a string representation of an array, try to parse it
      if (typeof arr === 'string' && arr.startsWith('[') && arr.endsWith(']')) {
        try {
          arrayToProcess = JSON.parse(arr)
        } catch (e) {
          console.log(`⚠️ Failed to parse ${arrayName} as JSON:`, arr)
          return
        }
      }
      
      // Check if it's an array or array-like object
      if (Array.isArray(arrayToProcess)) {
        console.log(`📝 Adding ${arrayToProcess.length} IDs from ${arrayName}:`, arrayToProcess)
        arrayToProcess.forEach(id => relatedIds.add(id))
      } else if (arrayToProcess && typeof arrayToProcess === 'object' && arrayToProcess.length !== undefined) {
        // Handle array-like objects (like from vector tiles)
        console.log(`📝 Adding ${arrayToProcess.length} IDs from array-like ${arrayName}:`, arrayToProcess)
        for (let i = 0; i < arrayToProcess.length; i++) {
          relatedIds.add(arrayToProcess[i])
        }
      } else if (arrayToProcess && arrayToProcess !== '') {
        // Single value case
        console.log(`📝 Adding single ID from ${arrayName}:`, arrayToProcess)
        relatedIds.add(arrayToProcess)
      } else {
        console.log(`⚠️ ${arrayName} is not an array or is undefined/empty:`, arr, typeof arr)
      }
    }
    
    switch (props.type) {
      case 'RFI':
        addArrayToSet(props.assigned_targets, 'assigned_targets')
        addArrayToSet(props.related_reports, 'related_reports')
        break
      case 'Report':
        addArrayToSet(props.related_rfis, 'related_rfis')
        addArrayToSet(props.related_targets, 'related_targets')
        break
      case 'Target':
        addArrayToSet(props.related_rfis, 'related_rfis')
        addArrayToSet(props.related_reports, 'related_reports')
        break
      default:
        console.log('⚠️ Unknown feature type:', props.type)
    }
    
    console.log('🎯 Total related IDs found:', Array.from(relatedIds))
    return relatedIds
  }, [])

  const applyFeatureHighlighting = useCallback((relatedIds: Set<string>) => {
    if (!map.current) {
      console.log('⚠️ Map not available for highlighting')
      return
    }
    
    console.log('🎨 Applying highlighting for IDs:', Array.from(relatedIds))
    
    const layerConfigs = [
      { id: 'rfi-points', property: 'id', type: 'symbol' },
      { id: 'rfi-polygons', property: 'id', type: 'fill' },
      { id: 'reports-points', property: 'id', type: 'symbol' },
      { id: 'targets-points', property: 'id', type: 'symbol' },
      { id: 'layers-polygons', property: 'id', type: 'fill' }
    ]
    
    layerConfigs.forEach(({ id: layerId, property, type }) => {
      if (map.current?.getLayer(layerId)) {
        console.log(`✅ Applying highlighting to layer: ${layerId}`)
        const highlightFilter = ['in', ['get', property], ['literal', Array.from(relatedIds)]]
        
        if (type === 'symbol') {
          map.current.setPaintProperty(layerId, 'icon-opacity', [
            'case', highlightFilter, 1.0, 0.2
          ])
          
          const baseSize = 0.5
          map.current.setLayoutProperty(layerId, 'icon-size', [
            'case', highlightFilter, baseSize * 1.5, baseSize
          ])
        } else {
          map.current.setPaintProperty(layerId, 'fill-opacity', [
            'case', highlightFilter, 0.8, 0.1
          ])
          
          map.current.setPaintProperty(layerId, 'fill-outline-color', [
            'case', highlightFilter, '#ffffff', '#666666'
          ])
        }
      } else {
        console.log(`⚠️ Layer ${layerId} not found for highlighting`)
      }
    })
    
    console.log('✨ Highlighting applied successfully')
  }, [])

  const clearFeatureHighlighting = useCallback(() => {
    if (!map.current) {
      console.log('⚠️ Map not available for clearing highlighting')
      return
    }
    
    console.log('🧹 Clearing feature highlighting')
    
    const layerConfigs = [
      { id: 'rfi-points', baseSize: 0.5, type: 'symbol' },
      { id: 'reports-points', baseSize: 0.5, type: 'symbol' },
      { id: 'targets-points', baseSize: 0.5, type: 'symbol' },
      { id: 'rfi-polygons', type: 'fill' },
      { id: 'layers-polygons', type: 'fill' }
    ]
    
    layerConfigs.forEach(({ id: layerId, baseSize, type }) => {
      if (map.current?.getLayer(layerId)) {
        console.log(`✅ Clearing highlighting from layer: ${layerId}`)
        if (type === 'symbol') {
          map.current.setPaintProperty(layerId, 'icon-opacity', 1.0)
          map.current.setLayoutProperty(layerId, 'icon-size', baseSize)
        } else {
          const originalOpacity = layerId === 'rfi-polygons' ? 0.2 : 0.4
          map.current.setPaintProperty(layerId, 'fill-opacity', originalOpacity)
          map.current.setPaintProperty(layerId, 'fill-outline-color', '#ffffff')
        }
      } else {
        console.log(`⚠️ Layer ${layerId} not found for clearing highlighting`)
      }
    })
    
    setHighlightedFeatures(new Set())
    setSelectedFeature(null)
    console.log('✨ Highlighting cleared successfully')
  }, [])

  const handleFeatureSelection = useCallback((feature: any) => {
    console.log('🎯 handleFeatureSelection called with:', feature?.properties?.id, feature?.properties?.type)
    
    if (!feature) {
      console.log('⚠️ No feature provided, clearing highlighting')
      clearFeatureHighlighting()
      return
    }
    
    console.log('🔍 Getting related feature IDs...')
    const relatedIds = getRelatedFeatureIds(feature)
    
    console.log('📝 Setting selected feature and highlighting...')
    setSelectedFeature(feature)
    setHighlightedFeatures(relatedIds)
    applyFeatureHighlighting(relatedIds)
    
    if (onFeatureClick) {
      console.log('📞 Calling onFeatureClick callback')
      onFeatureClick(feature)
    }
    
    console.log('✅ Feature selection completed')
  }, [getRelatedFeatureIds, applyFeatureHighlighting, clearFeatureHighlighting, onFeatureClick])

  // Utility functions
  const flyToCamera = (camera: Camera) => {
    if (!map.current) return
    
    map.current.flyTo({
      center: [camera.lng, camera.lat],
      zoom: 12,
      duration: 2000
    })
  }

  const flyToLocation = (coordinates: [number, number], zoom: number = 10) => {
    if (!map.current) return
    
    map.current.flyTo({
      center: coordinates,
      zoom,
      duration: 2000
    })
  }

  const updateTimelineFilter = useCallback((startDate: Date, endDate: Date) => {
    if (!map.current || !originalGeoJsonData) return

    let filteredData = {
      ...originalGeoJsonData,
      features: originalGeoJsonData.features.filter((feature: any) => {
        const featureType = feature.properties?.type
        const timestamp = feature.properties?.timestamp
        
        if (featureType === 'Target') return true
        if (!timestamp) return true
        
        const featureDate = new Date(timestamp)
        return featureDate >= startDate && featureDate <= endDate
      })
    }

    // Apply report subfilters
    filteredData = {
      ...filteredData,
      features: filteredData.features.filter((feature: any) => {
        const featureType = feature.properties?.type
        const source = feature.properties?.source
        
        if (featureType === 'Report') {
          if (source === 'System' && !reportSubfilters.system) return false
          if (source === 'Legacy' && !reportSubfilters.legacy) return false
        }
        
        return true
      })
    }

    const source = map.current.getSource('rfi-data') as any
    if (source) {
      source.setData(filteredData)
    }
  }, [originalGeoJsonData, reportSubfilters])

  const cleanup = () => {
    try {
      if (map.current) {
        if (navigationControlRef.current) {
          try {
            map.current.removeControl(navigationControlRef.current)
            navigationControlRef.current = null
          } catch (e) {
            console.warn("Error removing navigation control:", e)
          }
        }
        
        markersRef.current.forEach(({ marker }) => {
          try {
            marker.remove()
          } catch (e) {
            console.warn("Error removing marker:", e)
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

  // Effects
  useEffect(() => {
    initializeMap()
    return cleanup
  }, [])

  // Sync external theme with internal theme state
  useEffect(() => {
    if (externalCurrentTheme && externalCurrentTheme.id !== currentTheme.id) {
      console.log('🎨 Syncing external theme:', externalCurrentTheme.name)
      changeMapStyle(externalCurrentTheme)
    }
  }, [externalCurrentTheme, currentTheme.id, changeMapStyle])

  // Initial markers when map loads
  useEffect(() => {
    if (mapLoaded && cameras.length > 0 && markersRef.current.length === 0) {
      addCameraMarkers(selectedCamera?.id)
    }
  }, [mapLoaded, cameras])

  // Update marker highlights when selection changes
  useEffect(() => {
    if (mapLoaded && markersRef.current.length > 0) {
      updateMarkerHighlight(selectedCamera?.id)
    }
  }, [selectedCamera])

  // Update layer visibility when visibleLayers changes
  useEffect(() => {
    if (!map.current) return

    const layerVisibilityMap = {
      'rfi-heatmap': visibleLayers.heatmap,
      'rfi-points': visibleLayers.rfi,
      'rfi-polygons': visibleLayers.rfi,
      'reports-points': visibleLayers.reports,
      'targets-points': visibleLayers.targets,
      'layers-polygons': visibleLayers.layers,
      'layers-polygons-outline': visibleLayers.layers
    }

    Object.entries(layerVisibilityMap).forEach(([layerId, visible]) => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        )
      }
    })
  }, [visibleLayers])

  // Update data source when report subfilters change
  useEffect(() => {
    if (!map.current || !originalGeoJsonData) return

    let filteredData = originalGeoJsonData
    if (timeRange) {
      filteredData = {
        ...originalGeoJsonData,
        features: originalGeoJsonData.features.filter((feature: any) => {
          const featureType = feature.properties?.type
          const timestamp = feature.properties?.timestamp
          
          if (featureType === 'Target') return true
          if (!timestamp) return true
          
          const featureDate = new Date(timestamp)
          return featureDate >= timeRange.start && featureDate <= timeRange.end
        })
      }
    }

    filteredData = {
      ...filteredData,
      features: filteredData.features.filter((feature: any) => {
        const featureType = feature.properties?.type
        const source = feature.properties?.source
        
        if (featureType === 'Report') {
          if (source === 'System' && !reportSubfilters.system) return false
          if (source === 'Legacy' && !reportSubfilters.legacy) return false
        }
        
        return true
      })
    }

    const source = map.current.getSource('rfi-data') as any
    if (source) {
      source.setData(filteredData)
    }
  }, [reportSubfilters, timeRange, originalGeoJsonData])

  return {
    mapContainer,
    mapLoaded,
    mapError,
    currentTheme,
    changeMapStyle,
    flyToCamera,
    flyToLocation,
    isRotating,
    toggleRotation,
    toggleMapProjection,
    selectedFeature,
    setSelectedFeature,
    map: map.current,
    updateTimelineFilter,
    clearFeatureHighlighting,
    highlightedFeatures,
    originalGeoJsonData,
    mouseCoordinates
  }
}
