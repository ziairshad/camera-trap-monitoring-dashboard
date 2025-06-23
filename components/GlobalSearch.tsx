"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, MapPin, Target, FileText, Map, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  type: 'Target' | 'Report' | 'RFI' | 'Layer' | 'Place'
  name: string
  coordinates: [number, number]
  properties: any
  description?: string
  context?: string[]
}

interface GlobalSearchProps {
  onResultSelect: (result: SearchResult) => void
  geoJsonData?: any
  className?: string
}

export function GlobalSearch({ onResultSelect, geoJsonData, className = '' }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Create searchable data from GeoJSON
  const searchableData = useMemo(() => {
    if (!geoJsonData?.features) return []
    
    return geoJsonData.features
      .filter((feature: any) => {
        const type = feature.properties?.type
        return ['Target', 'Report', 'RFI', 'Layer'].includes(type)
      })
      .map((feature: any) => {
        const coords = feature.geometry?.coordinates
        let searchableCoords: [number, number]
        
        // Handle different geometry types
        if (feature.geometry?.type === 'Point') {
          searchableCoords = coords
        } else if (feature.geometry?.type === 'Polygon') {
          // Use center of polygon bounds
          const flatCoords = coords[0]
          const lngs = flatCoords.map((c: number[]) => c[0])
          const lats = flatCoords.map((c: number[]) => c[1])
          searchableCoords = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
          ]
        } else {
          searchableCoords = [0, 0] // fallback
        }

        return {
          id: feature.properties?.id || feature.id || Math.random().toString(),
          type: feature.properties?.type,
          name: feature.properties?.name || feature.properties?.title || `${feature.properties?.type} ${feature.properties?.id}`,
          coordinates: searchableCoords,
          properties: feature.properties
        }
      })
  }, [geoJsonData])

  // Search places using Mapbox Geocoding API
  const searchPlaces = async (query: string): Promise<SearchResult[]> => {
    try {
      const mapboxToken = 'pk.eyJ1IjoiemlhaXJzaGFkIiwiYSI6ImNtOXNhY3lqaDAwcnEybXNlMTRmdDd4dXUifQ.-wOM1g35rjy7AXf_6ws4Ig'
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5&types=place,locality,neighborhood,address,poi`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding API error')
      }
      
      const data = await response.json()
      
      return data.features.map((feature: any) => ({
        id: feature.id,
        type: 'Place' as const,
        name: feature.place_name.split(',')[0], // Primary name
        coordinates: feature.center,
        properties: feature.properties,
        description: feature.place_name,
        context: feature.context?.map((c: any) => c.text) || []
      }))
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  // Combined search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    // Search local data features
    const localResults = searchableData.filter((item: SearchResult) => {
      const searchText = query.toLowerCase()
      return (
        item.name?.toLowerCase().includes(searchText) ||
        item.type?.toLowerCase().includes(searchText) ||
        item.id?.toLowerCase().includes(searchText) ||
        item.properties?.description?.toLowerCase().includes(searchText)
      )
    })

    // Search places using Mapbox Geocoding
    const placeResults = await searchPlaces(query)

    // Combine results with local data taking priority
    const combinedResults = [
      ...localResults.slice(0, 5), // Limit local results to 5
      ...placeResults.slice(0, 5)  // Limit place results to 5
    ]

    setSearchResults(combinedResults.slice(0, 10)) // Total limit of 10
  }

  // Handle search input
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      await performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchableData])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result)
    setSearchQuery(result.name)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get icon for feature type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Target':
        return <Target className="h-4 w-4 text-red-400" />
      case 'Report':
        return <FileText className="h-4 w-4 text-blue-400" />
      case 'RFI':
        return <MapPin className="h-4 w-4 text-yellow-400" />
      case 'Layer':
        return <Layers className="h-4 w-4 text-green-400" />
      case 'Place':
        return <MapPin className="h-4 w-4 text-purple-400" />
      default:
        return <Map className="h-4 w-4 text-gray-400" />
    }
  }

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Target':
        return 'border-red-400/50 text-red-400'
      case 'Report':
        return 'border-blue-400/50 text-blue-400'
      case 'RFI':
        return 'border-yellow-400/50 text-yellow-400'
      case 'Layer':
        return 'border-green-400/50 text-green-400'
      case 'Place':
        return 'border-purple-400/50 text-purple-400'
      default:
        return 'border-gray-400/50 text-gray-400'
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search cities, places, targets, reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2 search-glassmorphism text-white placeholder-white/60 focus:border-white/20 transition-all duration-200 w-80 rounded-lg"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 search-glassmorphism rounded-lg z-50 max-h-80 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={`p-3 cursor-pointer border-b border-white/10 last:border-b-0 transition-all duration-150 ${
                index === selectedIndex 
                  ? 'search-glassmorphism-selected' 
                  : 'search-glassmorphism-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {result.name}
                    </div>
                    <div className="text-white/60 text-xs truncate">
                      {result.type === 'Place' ? (
                        result.description || `${result.coordinates[1].toFixed(4)}, ${result.coordinates[0].toFixed(4)}`
                      ) : (
                        `ID: ${result.id} • ${result.coordinates[1].toFixed(4)}, ${result.coordinates[0].toFixed(4)}`
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`${getTypeColor(result.type)} text-xs flex-shrink-0 ml-2`}>
                  {result.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchQuery && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 search-glassmorphism rounded-lg z-50 p-4">
          <div className="text-white/60 text-sm text-center">
            No results found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  )
} 