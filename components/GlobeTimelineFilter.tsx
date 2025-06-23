"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ChevronUp, ChevronDown, Calendar, Clock } from 'lucide-react'
import { useClientOnly } from '@/hooks/useClientOnly'

interface TimelineFilterProps {
  onTimeRangeChange: (startDate: Date, endDate: Date) => void
  className?: string
}

export default function GlobeTimelineFilter({ onTimeRangeChange, className = "" }: TimelineFilterProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date(2020, 0, 1))
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date(2025, 11, 31))
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | null>(null)
  const [activePreset, setActivePreset] = useState<string>('all')
  const [isAnimating, setIsAnimating] = useState(false)
  const isMounted = useClientOnly()
  const onTimeRangeChangeRef = useRef(onTimeRangeChange)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Store current values in refs to avoid stale closures
  const currentStartDateRef = useRef(selectedStartDate)
  const currentEndDateRef = useRef(selectedEndDate)
  
  // Update refs when state changes
  useEffect(() => {
    currentStartDateRef.current = selectedStartDate
    currentEndDateRef.current = selectedEndDate
  }, [selectedStartDate, selectedEndDate])

  // Date boundaries based on the GeoJSON data (2020-2025) - memoized to prevent re-creation
  const minDate = useMemo(() => new Date(2020, 0, 1), [])
  const maxDate = useMemo(() => new Date(2025, 11, 31), [])

  // Update the ref when the callback changes
  useEffect(() => {
    onTimeRangeChangeRef.current = onTimeRangeChange
  }, [onTimeRangeChange])

  // Handle expand/collapse animation with optimized timing
  const toggleMinimized = useCallback(() => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setIsMinimized(prev => !prev)
    
    // Reset animation state after transition completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 250) // Reduced from 300ms for snappier feel
  }, [isAnimating])

  // Convert date to percentage (0-100) for slider positioning
  const dateToPercentage = useCallback((date: Date): number => {
    const totalRange = maxDate.getTime() - minDate.getTime()
    const dateOffset = date.getTime() - minDate.getTime()
    return Math.max(0, Math.min(100, (dateOffset / totalRange) * 100))
  }, [minDate, maxDate])

  // Convert percentage to date
  const percentageToDate = useCallback((percentage: number): Date => {
    const totalRange = maxDate.getTime() - minDate.getTime()
    const dateTime = minDate.getTime() + (percentage / 100) * totalRange
    return new Date(dateTime)
  }, [minDate, maxDate])

  // Snap to nearest month for cleaner selection
  const snapToNearestMonth = useCallback((date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }, [])

  // Format date for display - memoized to prevent re-calculation
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short'
    })
  }, [])

  // Handle preset selections
  const handlePresetClick = useCallback((preset: string) => {
    if (!isMounted) return
    
    const now = new Date()
    let start: Date, end: Date

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
        end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        break
      case 'last-week':
        const lastWeek = new Date(now)
        lastWeek.setDate(lastWeek.getDate() - 7)
        start = lastWeek
        end = now
        break
      case 'last-month':
        const lastMonth = new Date(now)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        start = lastMonth
        end = now
        break
      case 'last-year':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      case '2024':
        start = new Date(2024, 0, 1)
        end = new Date(2024, 11, 31)
        break
      case '2023':
        start = new Date(2023, 0, 1)
        end = new Date(2023, 11, 31)
        break
      case '2022':
        start = new Date(2022, 0, 1)
        end = new Date(2022, 11, 31)
        break
      case 'all':
      default:
        start = minDate
        end = maxDate
        break
    }

    setSelectedStartDate(start)
    setSelectedEndDate(end)
    setActivePreset(preset)
  }, [isMounted, minDate, maxDate])

  // Handle slider interactions
  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
    const clickedDate = percentageToDate(percentage)
    const snappedDate = snapToNearestMonth(clickedDate)

    const startPercentage = dateToPercentage(selectedStartDate)
    const endPercentage = dateToPercentage(selectedEndDate)
    const clickPercentage = dateToPercentage(snappedDate)

    const distToStart = Math.abs(clickPercentage - startPercentage)
    const distToEnd = Math.abs(clickPercentage - endPercentage)

    if (distToStart < distToEnd) {
      setSelectedStartDate(snappedDate <= selectedEndDate ? snappedDate : selectedEndDate)
    } else {
      setSelectedEndDate(snappedDate >= selectedStartDate ? snappedDate : selectedStartDate)
    }
    setActivePreset('')
  }, [isDragging, percentageToDate, snapToNearestMonth, dateToPercentage, selectedStartDate, selectedEndDate])

  const handleMouseDown = useCallback((e: React.MouseEvent, target: 'start' | 'end') => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragTarget(target)
    setActivePreset('')
  }, [])

  // Simplified mouse move handler - removed refs to prevent state issues
  useEffect(() => {
    if (!isMounted || !isDragging || !dragTarget) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const slider = document.querySelector('.timeline-slider-track') as HTMLElement
      if (!slider) return

      const rect = slider.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const newDate = snapToNearestMonth(percentageToDate(percentage))

      if (dragTarget === 'start') {
        setSelectedStartDate(prevStart => {
          const validDate = newDate <= selectedEndDate ? newDate : selectedEndDate
          return validDate
        })
      } else {
        setSelectedEndDate(prevEnd => {
          const validDate = newDate >= selectedStartDate ? newDate : selectedStartDate
          return validDate
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragTarget(null)
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMounted, isDragging, dragTarget, percentageToDate, snapToNearestMonth, selectedStartDate, selectedEndDate])

  // Notify parent component of time range changes
  useEffect(() => {
    if (!isMounted) return
    onTimeRangeChangeRef.current(selectedStartDate, selectedEndDate)
  }, [isMounted, selectedStartDate, selectedEndDate])

  // Generate year labels for the timeline - memoized for performance
  const yearLabels = useMemo(() => {
    const labels = []
    for (let year = 2020; year <= 2025; year++) {
      const date = new Date(year, 0, 1)
      const percentage = dateToPercentage(date)
      labels.push({
        year,
        percentage,
        label: year.toString()
      })
    }
    return labels
  }, [dateToPercentage])

  // Memoize calculated values to prevent recalculation during drag
  const startPercentage = useMemo(() => dateToPercentage(selectedStartDate), [dateToPercentage, selectedStartDate])
  const endPercentage = useMemo(() => dateToPercentage(selectedEndDate), [dateToPercentage, selectedEndDate])
  const formattedStartDate = useMemo(() => formatDate(selectedStartDate), [formatDate, selectedStartDate])
  const formattedEndDate = useMemo(() => formatDate(selectedEndDate), [formatDate, selectedEndDate])

  // Don't render until mounted on client to prevent hydration issues
  if (!isMounted) {
    return null
  }

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 ${className}`}>
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Compact Header */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Timeline Filter</h3>
                <p className="text-xs text-white/60">
                  {formattedStartDate} - {formattedEndDate}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMinimized}
              disabled={isAnimating}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              <div className={`transition-transform duration-250 ease-out ${isMinimized ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown className="w-4 h-4 text-white/80" />
              </div>
            </button>
          </div>
        </div>

        {/* Animated Content Container */}
        <div 
          ref={contentRef}
          className={`transition-all duration-250 ease-out overflow-hidden ${
            isMinimized 
              ? 'max-h-0 opacity-0' 
              : 'max-h-96 opacity-100'
          }`}
        >
          {/* Content */}
          <div className={`transition-all duration-250 ease-out ${
            isMinimized ? 'p-0' : 'p-4'
          } space-y-3`}>
            {/* Preset Buttons */}
            <div className={`flex flex-wrap gap-1.5 transition-opacity duration-200 ${
              isMinimized ? 'opacity-0' : 'opacity-100'
            }`}>
              {[
                { key: '2022', label: '2022' },
                { key: '2023', label: '2023' },
                { key: 'last-year', label: 'Last Year' },
                { key: 'this-year', label: 'This Year' },
                { key: 'last-month', label: 'Last Month' },
                { key: 'last-week', label: 'Last Week' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'today', label: 'Today' },
                { key: 'separator', label: '|' },
                { key: 'all', label: 'All Time' }
              ].map(({ key, label }) => (
                key === 'separator' ? (
                  <div key={key} className="flex items-center px-1">
                    <span className="text-white/30 text-xs">|</span>
                  </div>
                ) : (
                  <button
                    key={key}
                    onClick={() => handlePresetClick(key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                      activePreset === key
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                )
              ))}
            </div>

            {/* Timeline Slider */}
            <div className={`relative transition-opacity duration-200 ${
              isMinimized ? 'opacity-0' : 'opacity-100'
            }`}>
              {/* Year Labels */}
              <div className="flex justify-between mb-1.5">
                {yearLabels.map(({ year, label }) => (
                  <div key={year} className="text-xs text-white/50 font-mono">
                    {label}
                  </div>
                ))}
              </div>

              {/* Slider Track */}
              <div
                className="timeline-slider-track relative h-4 bg-white/10 rounded-full cursor-pointer group"
                onClick={handleSliderClick}
              >
                {/* Selected Range */}
                <div
                  className="absolute top-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg shadow-blue-500/20"
                  style={{
                    left: `${Math.min(startPercentage, endPercentage)}%`,
                    width: `${Math.abs(endPercentage - startPercentage)}%`
                  }}
                />

                {/* Start Handle */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 border border-white/20 rounded-full cursor-grab shadow-lg transition-transform duration-150 ${
                    isDragging && dragTarget === 'start' ? 'scale-110 cursor-grabbing' : 'hover:scale-110'
                  }`}
                  style={{ 
                    left: `${startPercentage}%`, 
                    marginLeft: '-8px'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'start')}
                />

                {/* End Handle */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 border border-white/20 rounded-full cursor-grab shadow-lg transition-transform duration-150 ${
                    isDragging && dragTarget === 'end' ? 'scale-110 cursor-grabbing' : 'hover:scale-110'
                  }`}
                  style={{ 
                    left: `${endPercentage}%`, 
                    marginLeft: '-8px'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'end')}
                />

                {/* Year Tick Marks */}
                {yearLabels.map(({ year, percentage }) => (
                  <div
                    key={year}
                    className="absolute top-0 w-px h-full bg-white/10"
                    style={{ left: `${percentage}%` }}
                  />
                ))}
              </div>

              {/* Range Info */}
              <div className="flex justify-between mt-2 text-xs">
                <div className="text-blue-400 font-medium">
                  {formattedStartDate}
                </div>
                <div className="text-purple-400 font-medium">
                  {formattedEndDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Active Indicator */}
        <div className="px-4 py-2 bg-black/20 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              {activePreset === 'all' ? 'All Data' : `${activePreset || 'Custom Range'}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 