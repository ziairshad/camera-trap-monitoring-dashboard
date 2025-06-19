"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Camera, MapTheme } from "../types"
import { MAPBOX_TOKEN, ABU_DHABI_CENTER, MAP_THEMES } from "../config/constants"

interface UseMapboxProps {
  cameras: Camera[]
  initialThemeIndex?: number
  isGlobeView?: boolean
  onToggleLayer?: (layerId: string, visible: boolean) => void
  visibleLayers?: {
    heatmap: boolean
    rfi: boolean
    reports: boolean
    targets: boolean
    layers: boolean
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
  isGlobeView = false,
  onToggleLayer,
  visibleLayers = {
    heatmap: false,
    rfi: true,
    reports: true,
    targets: true,
    layers: true
  },
  selectedCamera = null,
  onFeatureClick,
  timeRange
}: UseMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const mapboxglRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [currentTheme, setCurrentTheme] = useState(MAP_THEMES[initialThemeIndex])
  const [isRotating, setIsRotating] = useState(true)
  const userInteracting = useRef(false)
  const spinEnabled = useRef(true)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [originalGeoJsonData, setOriginalGeoJsonData] = useState<any>(null)
  const [highlightedFeatures, setHighlightedFeatures] = useState<Set<string>>(new Set())

  // Rotation settings
  const secondsPerRevolution = 120
  const maxSpinZoom = 5
  const slowSpinZoom = 3

  const spinGlobe = useCallback(() => {
    if (!map.current || !isGlobeView) return

    const zoom = map.current.getZoom()
    if (spinEnabled.current && !userInteracting.current && zoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution
      if (zoom > slowSpinZoom) {
        // Slow spinning at higher zooms
        const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom)
        distancePerSecond *= zoomDif
      }
      const center = map.current.getCenter()
      center.lng -= distancePerSecond
      // Smoothly animate the map over one second.
      // When this animation is complete, it calls a 'moveend' event.
      map.current.easeTo({ center, duration: 1000, easing: (n) => n })
    }
  }, [isGlobeView])

  // Toggle rotation function
  const toggleRotation = useCallback(() => {
    setIsRotating(prev => {
      const newRotating = !prev
      spinEnabled.current = newRotating
      if (newRotating) {
        spinGlobe()
      } else {
        map.current?.stop() // Immediately end ongoing animation
      }
      return newRotating
    })
  }, [spinGlobe])

  // Update spinEnabled ref when isRotating changes
  useEffect(() => {
    spinEnabled.current = isRotating
  }, [isRotating])

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

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: currentTheme.style,
        center: isGlobeView ? [54.3773, 24.4539] : [54.3773, 24.4539],
        zoom: isGlobeView ? 3.2 : 5,
        pitch: isGlobeView ? 0 : 45,
        bearing: 0,
        antialias: true,
        preserveDrawingBuffer: true,
        projection: isGlobeView ? 'globe' : 'mercator',
        failIfMajorPerformanceCaveat: false,
      })

      map.current.on("error", (e: any) => {
        console.error("Mapbox error details:", e)
        setMapError(`Map error: ${e.error?.message || "Unknown error"}`)
      })

      // Handle map load
      map.current.on('load', async () => {
        console.log('Map loaded, initializing...')
        
        // Add atmosphere and stars for globe view
        if (isGlobeView) {
          map.current?.setFog({
            color: 'rgb(41, 128, 255)',
            'high-color': 'rgb(41, 128, 255)',
            'horizon-blend': 0.01,
            'space-color': 'rgb(1, 12, 32)',
            'star-intensity': 0.3,
            'range': [0.5, 2]
          })

                      try {
            console.log('Fetching GeoJSON data...')
            const response = await fetch('/global_map_data_biased.geojson')
            const data = await response.json()
            console.log('GeoJSON data fetched:', data)

            // Store original data for filtering
            setOriginalGeoJsonData(data)

            // Filter data by time range if provided
            let filteredData = data
            if (timeRange) {
              console.log('Filtering data by time range:', timeRange)
              filteredData = {
                ...data,
                features: data.features.filter((feature: any) => {
                  const timestamp = feature.properties?.timestamp
                  if (!timestamp) return true // Include features without timestamp
                  
                  const featureDate = new Date(timestamp)
                  return featureDate >= timeRange.start && featureDate <= timeRange.end
                })
              }
              console.log(`Filtered from ${data.features.length} to ${filteredData.features.length} features`)
            }

            console.log('Adding GeoJSON source...')
            map.current?.addSource('rfi-data', {
              type: 'geojson',
              data: filteredData
            })

            // Add heatmap layer
            console.log('Adding heatmap layer...')
            map.current?.addLayer({
              id: 'rfi-heatmap',
              type: 'heatmap',
              source: 'rfi-data',
              filter: ['==', ['geometry-type'], 'Point'],
              paint: {
                // Only show significant concentrations
                'heatmap-weight': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 0.5,
                  5, 1
                ],
                // Increase intensity for more dramatic effect
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 3,
                  5, 6
                ],
                // More dramatic color ramp for heatmap
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0, 0, 255, 0)',
                  0.1, 'rgba(0, 0, 255, 0)',
                  0.2, 'rgba(0, 0, 255, 0.7)',
                  0.4, 'rgba(0, 255, 255, 0.7)',
                  0.6, 'rgba(0, 255, 0, 0.7)',
                  0.8, 'rgba(255, 255, 0, 0.7)',
                  0.9, 'rgba(255, 0, 0, 0.7)',
                  1, 'rgba(255, 0, 0, 1)'
                ],
                // Larger radius for better regional visualization
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 15,
                  5, 50
                ],
                // Increased opacity for more dramatic effect
                'heatmap-opacity': 0.9
              },
              layout: {
                visibility: visibleLayers.heatmap ? 'visible' : 'none'
              }
            })

            // Add RFI points layer as a symbol with custom PNG icon and fallback
            console.log('Adding RFI points layer with custom icon...')
            map.current?.loadImage('/data/RFI.png', (error, image) => {
              if (error || !image) {
                console.error('Error loading RFI icon, falling back to marker-15:', error)
                // Remove old layer if it exists
                if (map.current?.getLayer('rfi-points')) {
                  map.current.removeLayer('rfi-points')
                }
                map.current?.addLayer({
                  id: 'rfi-points',
                  type: 'symbol',
                  source: 'rfi-data',
                  filter: ['all',
                    ['==', ['geometry-type'], 'Point'],
                    ['==', ['get', 'type'], 'RFI']
                  ],
                  layout: {
                    'icon-image': 'marker-15', // fallback icon
                    'icon-size': 0.5, // reasonable size
                    'icon-allow-overlap': true,
                    visibility: visibleLayers.rfi ? 'visible' : 'none'
                  }
                })
                return
              }
              if (!map.current?.hasImage('rfi-icon')) {
                map.current?.addImage('rfi-icon', image)
                console.log('Custom RFI icon added to map!')
              }
              // Remove old layer if it exists
              if (map.current?.getLayer('rfi-points')) {
                map.current.removeLayer('rfi-points')
              }
              map.current?.addLayer({
                id: 'rfi-points',
                type: 'symbol',
                source: 'rfi-data',
                filter: ['all',
                  ['==', ['geometry-type'], 'Point'],
                  ['==', ['get', 'type'], 'RFI']
                ],
                layout: {
                  'icon-image': 'rfi-icon',
                  'icon-size': 0.5, // reasonable size
                  'icon-allow-overlap': true,
                  visibility: visibleLayers.rfi ? 'visible' : 'none'
                }
              })
              console.log('RFI points layer with custom icon added!')
            })

            // Add RFI polygons layer
            console.log('Adding RFI polygons layer...')
            map.current?.addLayer({
              id: 'rfi-polygons',
              type: 'fill',
              source: 'rfi-data',
              filter: ['all',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['get', 'type'], 'RFI']
              ],
              paint: {
                'fill-color': '#dc2626', // Muted red - less bright than #ff0000
                'fill-opacity': 0.2, // Reduced opacity for subtlety
                'fill-outline-color': '#ffffff'
              },
              layout: {
                visibility: visibleLayers.rfi ? 'visible' : 'none'
              }
            })

            // Add reports layer as a symbol with custom PNG icon and fallback
            console.log('Adding reports layer with custom icon...')
            map.current?.loadImage('/data/Report.png', (error, image) => {
              if (error || !image) {
                console.error('Error loading report icon, falling back to marker-15:', error)
                // Remove old layer if it exists
                if (map.current?.getLayer('reports-points')) {
                  map.current.removeLayer('reports-points')
                }
                map.current?.addLayer({
                  id: 'reports-points',
                  type: 'symbol',
                  source: 'rfi-data',
                  filter: ['all',
                    ['==', ['geometry-type'], 'Point'],
                    ['==', ['get', 'type'], 'Report']
                  ],
                  layout: {
                    'icon-image': 'marker-15', // fallback icon
                    'icon-size': 0.5, // reasonable size
                    'icon-allow-overlap': true,
                    visibility: visibleLayers.reports ? 'visible' : 'none'
                  }
                })
                return
              }
              if (!map.current?.hasImage('report-icon')) {
                map.current?.addImage('report-icon', image)
                console.log('Custom report icon added to map!')
              }
              // Remove old layer if it exists
              if (map.current?.getLayer('reports-points')) {
                map.current.removeLayer('reports-points')
              }
              map.current?.addLayer({
                id: 'reports-points',
                type: 'symbol',
                source: 'rfi-data',
                filter: ['all',
                  ['==', ['geometry-type'], 'Point'],
                  ['==', ['get', 'type'], 'Report']
                ],
                layout: {
                  'icon-image': 'report-icon',
                  'icon-size': 0.5, // reasonable size
                  'icon-allow-overlap': true,
                  visibility: visibleLayers.reports ? 'visible' : 'none'
                }
              })
              console.log('Reports layer with custom icon added!')
            })

            // Add targets layer as a symbol with custom PNG icon and fallback
            console.log('Adding targets layer with custom icon...')
            map.current?.loadImage('/data/Target.png', (error, image) => {
              if (error || !image) {
                console.error('Error loading target icon, falling back to airport-15:', error)
                // Remove old layer if it exists
                if (map.current?.getLayer('targets-points')) {
                  map.current.removeLayer('targets-points')
                }
                map.current?.addLayer({
                  id: 'targets-points',
                  type: 'symbol',
                  source: 'rfi-data',
                  filter: ['all',
                    ['==', ['geometry-type'], 'Point'],
                    ['==', ['get', 'type'], 'Target']
                  ],
                  layout: {
                    'icon-image': 'airport-15', // fallback icon
                    'icon-size': 1.5, // larger for visibility
                    'icon-allow-overlap': true,
                    visibility: visibleLayers.targets ? 'visible' : 'none'
                  }
                })
                return
              }
              if (!map.current?.hasImage('target-icon')) {
                map.current?.addImage('target-icon', image)
                console.log('Custom target icon added to map!')
              }
              // Remove old layer if it exists
              if (map.current?.getLayer('targets-points')) {
                map.current.removeLayer('targets-points')
              }
              map.current?.addLayer({
                id: 'targets-points',
                type: 'symbol',
                source: 'rfi-data',
                filter: ['all',
                  ['==', ['geometry-type'], 'Point'],
                  ['==', ['get', 'type'], 'Target']
                ],
                layout: {
                  'icon-image': 'target-icon',
                  'icon-size': 0.5, // smaller for less obtrusive appearance
                  'icon-allow-overlap': true,
                  visibility: visibleLayers.targets ? 'visible' : 'none'
                }
              })
              console.log('Targets layer with custom icon added!')
            })

            // Add layers polygons
            console.log('Adding layers polygons...')
            map.current?.addLayer({
              id: 'layers-polygons',
              type: 'fill',
              source: 'rfi-data',
              filter: ['all',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['get', 'type'], 'Layer']
              ],
              paint: {
                'fill-color': '#0891b2', // Muted teal/cyan - much less distracting than bright yellow
                'fill-opacity': 0.25,    // Reduced opacity for subtlety
                'fill-outline-color': '#ffffff'
              },
              layout: {
                visibility: visibleLayers.layers ? 'visible' : 'none'
              }
            })
            // Add a solid white line stroke for the polygons
            map.current?.addLayer({
              id: 'layers-polygons-outline',
              type: 'line',
              source: 'rfi-data',
              filter: ['all',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['get', 'type'], 'Layer']
              ],
              paint: {
                'line-color': '#ffffff',
                'line-width': 2
              },
              layout: {
                visibility: visibleLayers.layers ? 'visible' : 'none'
              }
            })

            console.log('GeoJSON data loaded successfully')

            // Add click event listeners to all layers after a short delay to ensure layers are ready
            setTimeout(() => {
              const layerIds = ['rfi-points', 'rfi-polygons', 'reports-points', 'targets-points', 'layers-polygons'];
              console.log('Adding click listeners to layers...');
              
              layerIds.forEach(layerId => {
                if (map.current?.getLayer(layerId)) {
                  console.log(`Adding click listener to layer: ${layerId}`);
                  map.current.on('click', layerId, (e) => {
                    console.log(`Layer ${layerId} clicked:`, e.features);
                    if (e.features && e.features.length > 0) {
                      const feature = e.features[0];
                      console.log('Selected feature:', feature);
                      handleFeatureSelection(feature);
                      // Don't stop globe rotation when clicking features
                    }
                  });

                  // Change cursor on hover
                  map.current.on('mouseenter', layerId, () => {
                    if (map.current) {
                      map.current.getCanvas().style.cursor = 'pointer';
                    }
                  });

                  map.current.on('mouseleave', layerId, () => {
                    if (map.current) {
                      map.current.getCanvas().style.cursor = '';
                    }
                  });
                } else {
                  console.log(`Layer ${layerId} not found`);
                }
              });

              // Add a general click handler as fallback
              map.current?.on('click', (e) => {
                console.log('General map click:', e);
                const features = map.current?.queryRenderedFeatures(e.point, {
                  layers: layerIds
                });
                console.log('Queried features:', features);
                if (features && features.length > 0) {
                  const feature = features[0];
                  console.log('Fallback selected feature:', feature);
                  handleFeatureSelection(feature);
                  // Don't stop globe rotation when clicking features
                } else {
                  // Clear highlighting when clicking on empty space
                  console.log('Clicked on empty space, clearing highlighting');
                  clearFeatureHighlighting();
                }
              });
            }, 1000);

            // Setup globe rotation event listeners
            if (isGlobeView) {
              // Pause spinning on interaction
              map.current.on('mousedown', () => {
                userInteracting.current = true
              })

              // Restart spinning when interaction is complete
              map.current.on('mouseup', () => {
                userInteracting.current = false
                spinGlobe()
              })

              // These events account for cases where the mouse has moved
              // off the map, so 'mouseup' will not be fired.
              map.current.on('dragend', () => {
                userInteracting.current = false
                spinGlobe()
              })
              map.current.on('pitchend', () => {
                userInteracting.current = false
                spinGlobe()
              })
              map.current.on('rotateend', () => {
                userInteracting.current = false
                spinGlobe()
              })

              // When animation is complete, start spinning if there is no ongoing interaction
              map.current.on('moveend', () => {
                spinGlobe()
              })

              // Start initial rotation
              spinGlobe()
            }
          } catch (error) {
            console.error('Error loading GeoJSON:', error)
          }
        }

        // Add markers for cameras
        if (cameras.length > 0) {
          cameras.forEach(camera => {
            if (map.current) {
              const el = document.createElement('div')
              el.className = 'camera-marker'
              el.style.width = '20px'
              el.style.height = '20px'
              el.style.borderRadius = '50%'
              el.style.backgroundColor = '#dc2626' // Muted red instead of bright red
              el.style.border = '2px solid white'
              el.style.cursor = 'pointer'

              new mapboxgl.Marker(el)
                .setLngLat([camera.lng, camera.lat])
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <h3>${camera.name}</h3>
                    <p>Status: ${camera.status}</p>
                    <p>Last Update: ${new Date(camera.lastDetection).toLocaleString()}</p>
                  `))
                .addTo(map.current)
            }
          })
        }

        console.log('Map fully loaded')
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

    // Add click handler to select camera
    markerElement.addEventListener("click", (e) => {
      e.stopPropagation()
      // Dispatch custom event that the dashboard can listen to
      window.dispatchEvent(new CustomEvent("cameraMarkerClick", { detail: { cameraId: camera.id } }))
    })

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
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: white;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 140px;
      font-size: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    ">
      <div style="font-weight: bold; color: #10b981; margin-bottom: 6px; font-size: 13px;">${camera.name}</div>
      <div style="color: #d1d5db; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Status:</span> 
        <span style="color: ${camera.status === "active" ? "#10b981" : "#ef4444"};">${camera.status}</span>
      </div>
      <div style="color: #d1d5db; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>Battery:</span> 
        <span style="color: #10b981;">${camera.battery}%</span>
      </div>
      <div style="color: #d1d5db; display: flex; justify-content: space-between;">
        <span>Last:</span> 
        <span style="color: #10b981;">${camera.lastDetection}</span>
      </div>
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

  const updateTimelineFilter = useCallback((startDate: Date, endDate: Date) => {
    if (!map.current || !originalGeoJsonData) return

    console.log('Updating timeline filter:', { startDate, endDate })
    
    // Filter the original data
    const filteredData = {
      ...originalGeoJsonData,
      features: originalGeoJsonData.features.filter((feature: any) => {
        const timestamp = feature.properties?.timestamp
        if (!timestamp) return true // Include features without timestamp
        
        const featureDate = new Date(timestamp)
        return featureDate >= startDate && featureDate <= endDate
      })
    }

    console.log(`Timeline filtered from ${originalGeoJsonData.features.length} to ${filteredData.features.length} features`)

    // Update the data source
    const source = map.current.getSource('rfi-data') as any
    if (source) {
      source.setData(filteredData)
    }
  }, [originalGeoJsonData])

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
    if (mapLoaded && map.current) {
      map.current.setStyle(currentTheme.style)
    }
  }, [currentTheme, mapLoaded])

  // Initial markers when map loads and cameras are available
  useEffect(() => {
    if (mapLoaded && cameras.length > 0 && markersRef.current.length === 0) {
      addCameraMarkers(selectedCamera?.id)
    }
  }, [mapLoaded, cameras])

  // Update marker highlights when selection changes (without recreating markers)
  useEffect(() => {
    if (mapLoaded && markersRef.current.length > 0) {
      updateMarkerHighlight(selectedCamera?.id)
    }
  }, [selectedCamera])

  // Start rotation when map is loaded and in globe view
  useEffect(() => {
    if (mapLoaded && isGlobeView) {
      spinGlobe()
    }
  }, [mapLoaded, isGlobeView, spinGlobe])

  // Update layer visibility when visibleLayers changes
  useEffect(() => {
    if (!map.current) return

    // Update heatmap visibility
    if (map.current.getLayer('rfi-heatmap')) {
      map.current.setLayoutProperty(
        'rfi-heatmap',
        'visibility',
        visibleLayers.heatmap ? 'visible' : 'none'
      )
    }

    // Update RFI points visibility
    if (map.current.getLayer('rfi-points')) {
      map.current.setLayoutProperty(
        'rfi-points',
        'visibility',
        visibleLayers.rfi ? 'visible' : 'none'
      )
    }

    // Update RFI polygons visibility
    if (map.current.getLayer('rfi-polygons')) {
      map.current.setLayoutProperty(
        'rfi-polygons',
        'visibility',
        visibleLayers.rfi ? 'visible' : 'none'
      )
    }

    // Update reports visibility
    if (map.current.getLayer('reports-points')) {
      map.current.setLayoutProperty(
        'reports-points',
        'visibility',
        visibleLayers.reports ? 'visible' : 'none'
      )
    }

    // Update targets visibility
    if (map.current.getLayer('targets-points')) {
      map.current.setLayoutProperty(
        'targets-points',
        'visibility',
        visibleLayers.targets ? 'visible' : 'none'
      )
    }

    // Update layers visibility
    if (map.current.getLayer('layers-polygons')) {
      map.current.setLayoutProperty(
        'layers-polygons',
        'visibility',
        visibleLayers.layers ? 'visible' : 'none'
      )
    }
    // Update layers polygons outline (stroke) visibility
    if (map.current.getLayer('layers-polygons-outline')) {
      map.current.setLayoutProperty(
        'layers-polygons-outline',
        'visibility',
        visibleLayers.layers ? 'visible' : 'none'
      )
    }
  }, [visibleLayers])

  // Function to get related feature IDs based on the selected feature
  const getRelatedFeatureIds = useCallback((feature: any) => {
    if (!feature?.properties) return new Set<string>()
    
    const relatedIds = new Set<string>()
    const props = feature.properties
    const featureId = props.id || feature.id
    
    console.log('Getting related IDs for feature:', featureId, 'of type:', props.type)
    console.log('Feature properties:', JSON.stringify(props, null, 2))
    
    // Add the selected feature itself
    if (featureId) relatedIds.add(featureId.toString())
    
    // Helper function to safely add array items to the set
    const addArrayToSet = (arr: any, arrayName: string) => {
      console.log(`Processing ${arrayName}:`, arr)
      
      let processedArray = arr
      
      // Handle case where the value is a JSON string instead of an array
      if (typeof arr === 'string') {
        try {
          processedArray = JSON.parse(arr)
          console.log(`Parsed ${arrayName} from string:`, processedArray)
        } catch (error) {
          console.log(`Failed to parse ${arrayName} as JSON:`, error)
          return
        }
      }
      
      if (Array.isArray(processedArray)) {
        processedArray.forEach((id: string) => {
          if (id && typeof id === 'string') {
            relatedIds.add(id)
            console.log(`Added ${arrayName} ID:`, id)
          }
        })
      }
    }
    
    // Add related features based on feature type
    switch (props.type) {
      case 'RFI':
        // Add related targets and reports
        addArrayToSet(props.assigned_targets, 'assigned_targets')
        addArrayToSet(props.related_reports, 'related_reports')
        break
        
      case 'Report':
        // Add related targets and RFIs
        addArrayToSet(props.related_targets, 'related_targets')
        addArrayToSet(props.related_rfis, 'related_rfis')
        break
        
      case 'Target':
        // Add related RFIs and reports
        addArrayToSet(props.related_rfis, 'related_rfis')
        addArrayToSet(props.related_reports, 'related_reports')
        break
        
      case 'Layer':
        // Layers don't have explicit relationships, but we can add the layer itself
        break
    }
    
    console.log('Final related IDs set:', Array.from(relatedIds))
    return relatedIds
  }, [])

  // Function to apply highlighting to map layers
  const applyFeatureHighlighting = useCallback((relatedIds: Set<string>) => {
    if (!map.current) return
    
    console.log('Applying highlighting for IDs:', Array.from(relatedIds))
    
    const layerConfigs = [
      { id: 'rfi-points', property: 'id', type: 'symbol' },
      { id: 'rfi-polygons', property: 'id', type: 'fill' },
      { id: 'reports-points', property: 'id', type: 'symbol' },
      { id: 'targets-points', property: 'id', type: 'symbol' },
      { id: 'layers-polygons', property: 'id', type: 'fill' }
    ]
    
    layerConfigs.forEach(({ id: layerId, property, type }) => {
      console.log(`Checking layer: ${layerId}`)
      if (map.current?.getLayer(layerId)) {
        console.log(`Layer ${layerId} found, applying highlighting`)
        // Create filter for highlighted features
        const highlightFilter = ['in', ['get', property], ['literal', Array.from(relatedIds)]]
        console.log(`Highlight filter for ${layerId}:`, highlightFilter)
        
        // Update layer styling based on whether features are highlighted or faded
        if (type === 'symbol') {
          // For symbol layers (points)
          map.current.setPaintProperty(layerId, 'icon-opacity', [
            'case',
            highlightFilter,
            1.0, // Full opacity for highlighted features
            0.2  // Faded for non-related features
          ])
          
          // Increase size for highlighted features
          const baseSize = layerId === 'rfi-points' ? 0.5 : 
                          layerId === 'reports-points' ? 0.5 : 
                          layerId === 'targets-points' ? 0.5 : 0.5
          
          map.current.setLayoutProperty(layerId, 'icon-size', [
            'case',
            highlightFilter,
            baseSize * 1.5, // Larger for highlighted features
            baseSize         // Normal size for faded features
          ])
        } else {
          // For polygon layers
          map.current.setPaintProperty(layerId, 'fill-opacity', [
            'case',
            highlightFilter,
            0.8, // Higher opacity for highlighted features
            0.1  // Very faded for non-related features
          ])
          
          map.current.setPaintProperty(layerId, 'fill-outline-color', [
            'case',
            highlightFilter,
            '#ffffff', // White outline for highlighted features
            '#666666'  // Gray outline for faded features
          ])
        }
      } else {
        console.log(`Layer ${layerId} not found`)
      }
    })
  }, [])

  // Function to clear highlighting and restore original styling
  const clearFeatureHighlighting = useCallback(() => {
    if (!map.current) return
    
    const layerConfigs = [
      { id: 'rfi-points', baseSize: 0.5, type: 'symbol' },
      { id: 'reports-points', baseSize: 0.5, type: 'symbol' },
      { id: 'targets-points', baseSize: 0.5, type: 'symbol' },
      { id: 'rfi-polygons', baseSize: 0, type: 'fill' },
      { id: 'layers-polygons', baseSize: 0, type: 'fill' }
    ]
    
    layerConfigs.forEach(({ id: layerId, baseSize, type }) => {
      if (map.current?.getLayer(layerId)) {
        if (type === 'symbol') {
          // Restore original symbol styling
          map.current.setPaintProperty(layerId, 'icon-opacity', 1.0)
          map.current.setLayoutProperty(layerId, 'icon-size', baseSize)
        } else {
          // Restore original polygon styling
          const originalOpacity = layerId === 'rfi-polygons' ? 0.2 : 0.4
          map.current.setPaintProperty(layerId, 'fill-opacity', originalOpacity)
          map.current.setPaintProperty(layerId, 'fill-outline-color', '#ffffff')
        }
      }
    })
    
    setHighlightedFeatures(new Set())
    setSelectedFeature(null)
  }, [])

  // Function to handle feature selection and highlighting
  const handleFeatureSelection = useCallback((feature: any) => {
    console.log('Handling feature selection:', feature)
    
    if (!feature) {
      clearFeatureHighlighting()
      return
    }
    
    const relatedIds = getRelatedFeatureIds(feature)
    console.log('Related feature IDs:', relatedIds)
    
    setSelectedFeature(feature)
    setHighlightedFeatures(relatedIds)
    applyFeatureHighlighting(relatedIds)
    
    if (onFeatureClick) {
      onFeatureClick(feature)
    }
  }, [getRelatedFeatureIds, applyFeatureHighlighting, clearFeatureHighlighting, onFeatureClick])

  return {
    mapContainer,
    mapLoaded,
    mapError,
    currentTheme,
    changeMapStyle,
    flyToCamera,
    isRotating,
    toggleRotation,
    selectedFeature,
    setSelectedFeature,
    map: map.current,
    updateTimelineFilter,
    clearFeatureHighlighting,
    highlightedFeatures
  }
}
