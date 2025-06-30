"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { MAIN_SPECIES } from "../config/constants"

export function TimelineSliderComponent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isWeeklyMode, setIsWeeklyMode] = useState(false)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  })
  const [activeChip, setActiveChip] = useState<string>("") // Start with no active chip
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<"single" | "start" | "end" | null>(null)
  const [isMinimized, setIsMinimized] = useState(true)
  const [activeGraphTab, setActiveGraphTab] = useState("species") // New state for graph tabs

  // Date range: 30 days ago to today (1 month)
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Mock data for species detections over time
  const generateSpeciesData = () => {
    const data = []
    const dayCount = 30 // 30 days
    const hourInterval = 12 // Every 12 hours for better performance with more data
    const totalIntervals = (dayCount * 24) / hourInterval

    for (let i = 0; i < totalIntervals; i++) {
      const timestamp = new Date(startDate.getTime() + i * hourInterval * 60 * 60 * 1000)
      const entry: any = { timestamp }

      // Add random detection counts for each species
      MAIN_SPECIES.forEach((species) => {
        // Generate more realistic patterns - some species more active at certain times
        let baseCount = 0
        const hour = timestamp.getHours()
        const dayOfWeek = timestamp.getDay()

        // Arabian Oryx - more active during early morning and evening, less active on weekends
        if (species.name === "Arabian Oryx") {
          baseCount = (hour >= 5 && hour <= 9) || (hour >= 16 && hour <= 19) ? 3 : 1
          baseCount *= dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1 // Less active on weekends
        }
        // Desert Fox - more active at night, consistent throughout week
        else if (species.name === "Desert Fox") {
          baseCount = hour >= 19 || hour <= 5 ? 4 : 0.5
        }
        // Sand Cat - most active at dusk and dawn, slightly more active mid-week
        else if (species.name === "Sand Cat") {
          baseCount = (hour >= 4 && hour <= 7) || (hour >= 17 && hour <= 20) ? 2.5 : 0.8
          baseCount *= dayOfWeek >= 2 && dayOfWeek <= 4 ? 1.2 : 1 // More active mid-week
        }

        // Add randomness and seasonal variation
        const randomFactor = Math.random() * 2 + 0.5
        const seasonalFactor = 1 + 0.3 * Math.sin((i / totalIntervals) * Math.PI * 2) // Simulate seasonal changes
        entry[species.name] = Math.round(baseCount * randomFactor * seasonalFactor)
      })

      // Add AI model data
      const aiModels = ["YOLOv8", "EfficientDet", "Detectron2", "UAE-Custom"]
      aiModels.forEach((model) => {
        const baseDetections = Math.random() * 5 + 2
        entry[model] = Math.round(baseDetections * (Math.random() * 0.5 + 0.75))
      })

      data.push(entry)
    }
    return data
  }

  const [speciesData] = useState(generateSpeciesData())

  useEffect(() => {
    // Helper function to check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date): boolean => {
      return date1.toDateString() === date2.toDateString()
    }

    // Helper function to check if date ranges match
    const isDateRangeEqual = (range1: { start: Date; end: Date }, range2: { start: Date; end: Date }): boolean => {
      return isSameDay(range1.start, range2.start) && isSameDay(range1.end, range2.end)
    }

    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    let newActiveChip = ""

    if (!isWeeklyMode) {
      // Single date mode
      if (isSameDay(selectedDate, today)) newActiveChip = "today"
      else if (isSameDay(selectedDate, yesterday)) newActiveChip = "yesterday"
    } else {
      // Range mode
      const weekRange_local = { start: weekAgo, end: today }
      const monthRange = { start: startDate, end: endDate }

      if (isDateRangeEqual(weekRange, weekRange_local)) newActiveChip = "week"
      else if (isDateRangeEqual(weekRange, monthRange)) newActiveChip = "month"
    }

    // Only update if the chip actually changed
    if (newActiveChip !== activeChip) {
      setActiveChip(newActiveChip)
    }
  }, [selectedDate, isWeeklyMode, weekRange, startDate, endDate, activeChip])

  // Convert date to percentage (0-100)
  const dateToPercentage = useCallback(
    (date: Date): number => {
      const totalRange = endDate.getTime() - startDate.getTime()
      const dateOffset = date.getTime() - startDate.getTime()
      return Math.max(0, Math.min(100, (dateOffset / totalRange) * 100))
    },
    [startDate, endDate],
  )

  // Convert percentage to date
  const percentageToDate = useCallback(
    (percentage: number): Date => {
      const totalRange = endDate.getTime() - startDate.getTime()
      const dateTime = startDate.getTime() + (percentage / 100) * totalRange
      return new Date(dateTime)
    },
    [startDate, endDate],
  )

  // Snap to nearest date - updated for better precision
  const snapToNearestDate = useCallback(
    (date: Date): Date => {
      // Create date boundaries every day for more precise snapping
      const dates = []
      const totalDays = 30

      for (let i = 0; i <= totalDays; i++) {
        dates.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000))
      }

      let nearestDate = dates[0]
      let minDiff = Math.abs(date.getTime() - dates[0].getTime())

      dates.forEach((d) => {
        const diff = Math.abs(date.getTime() - d.getTime())
        if (diff < minDiff) {
          minDiff = diff
          nearestDate = d
        }
      })

      return nearestDate
    },
    [startDate],
  )

  // Format date for display
  const formatDate = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  // Generate date labels for the timeline - show weekly intervals for month view
  const generateDateLabels = () => {
    const labels = []
    const totalDays = 30
    const intervalDays = 5 // Show every 5 days for better spacing

    for (let i = 0; i <= totalDays; i += intervalDays) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const percentage = dateToPercentage(date)

      labels.push({
        date,
        percentage,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      })
    }
    return labels
  }

  const dateLabels = generateDateLabels()

  // Filter species data based on selected date range
  const getFilteredSpeciesData = () => {
    if (!isWeeklyMode) return []

    return speciesData.filter((entry) => entry.timestamp >= weekRange.start && entry.timestamp <= weekRange.end)
  }

  // Get max value for chart scaling
  const getMaxDetectionCount = () => {
    const filteredData = getFilteredSpeciesData()
    if (filteredData.length === 0) return 10

    let max = 0
    filteredData.forEach((entry) => {
      MAIN_SPECIES.forEach((species) => {
        if (entry[species.name] > max) max = entry[species.name]
      })
    })

    return Math.max(5, Math.ceil(max * 1.2)) // Add 20% padding and ensure minimum of 5
  }

  // Handle slider click
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
    const clickedDate = percentageToDate(percentage)
    const snappedDate = snapToNearestDate(clickedDate)

    if (isWeeklyMode) {
      const startPercentage = dateToPercentage(weekRange.start)
      const endPercentage = dateToPercentage(weekRange.end)
      const clickPercentage = dateToPercentage(snappedDate)

      const distToStart = Math.abs(clickPercentage - startPercentage)
      const distToEnd = Math.abs(clickPercentage - endPercentage)

      if (distToStart < distToEnd) {
        setWeekRange((prev) => ({
          ...prev,
          start: snappedDate <= prev.end ? snappedDate : prev.end,
        }))
      } else {
        setWeekRange((prev) => ({
          ...prev,
          end: snappedDate >= prev.start ? snappedDate : prev.start,
        }))
      }
    } else {
      setSelectedDate(snappedDate)
    }
    // Don't manually set activeChip here - let the useEffect handle it
  }

  // Handle mouse down on slider handles
  const handleMouseDown = (e: React.MouseEvent, target: "single" | "start" | "end") => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragTarget(target)
  }

  // Handle mouse move during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragTarget) return

      const slider = document.querySelector(".timeline-slider-track") as HTMLElement
      if (!slider) return

      const rect = slider.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const newDate = percentageToDate(percentage)
      const snappedDate = snapToNearestDate(newDate) // Add snapping during drag

      if (dragTarget === "single") {
        setSelectedDate(snappedDate)
      } else if (dragTarget === "start") {
        setWeekRange((prev) => ({
          ...prev,
          start: snappedDate <= prev.end ? snappedDate : prev.end,
        }))
      } else if (dragTarget === "end") {
        setWeekRange((prev) => ({
          ...prev,
          end: snappedDate >= prev.start ? snappedDate : prev.start,
        }))
      }
      // Don't manually set activeChip here - let the useEffect handle it
    },
    [isDragging, dragTarget, percentageToDate, snapToNearestDate],
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragTarget(null)
  }, [])

  // Handle preset buttons
  const handlePresetClick = (preset: string) => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Set the active chip immediately when clicked
    setActiveChip(preset)

    switch (preset) {
      case "today":
        setIsWeeklyMode(false)
        setSelectedDate(today)
        break
      case "yesterday":
        setIsWeeklyMode(false)
        setSelectedDate(yesterday)
        break
      case "week":
        setIsWeeklyMode(true)
        setWeekRange({
          start: weekAgo,
          end: today,
        })
        break
      case "month":
        setIsWeeklyMode(true)
        setWeekRange({
          start: startDate,
          end: endDate,
        })
        break
    }
  }

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const selectedPosition = dateToPercentage(selectedDate)
  const weekStartPosition = dateToPercentage(weekRange.start)
  const weekEndPosition = dateToPercentage(weekRange.end)

  // Format time for chart tooltip
  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Species detection chart component
  const SpeciesDetectionChart = () => {
    const filteredData = getFilteredSpeciesData()
    const maxValue = getMaxDetectionCount()

    if (filteredData.length === 0) return null

    // Calculate chart dimensions
    const width = 500 // Adjusted for better fit
    const height = 120
    const padding = { top: 10, right: 15, bottom: 20, left: 25 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Calculate scales
    const timeScale = (timestamp: Date) => {
      const rangeStart = weekRange.start.getTime()
      const rangeEnd = weekRange.end.getTime()
      const totalTime = rangeEnd - rangeStart
      const position = timestamp.getTime() - rangeStart
      return (position / totalTime) * chartWidth
    }

    const valueScale = (value: number) => {
      return chartHeight - (value / maxValue) * chartHeight
    }

    // Generate path data for each species
    const generatePath = (speciesName: string) => {
      if (filteredData.length === 0) return ""

      return filteredData
        .map((entry, i) => {
          const x = timeScale(entry.timestamp)
          const y = valueScale(entry[speciesName] || 0)
          return `${i === 0 ? "M" : "L"} ${x} ${y}`
        })
        .join(" ")
    }

    // Generate time axis ticks
    const generateTimeTicks = () => {
      const ticks = []
      const tickCount = 6

      for (let i = 0; i <= tickCount; i++) {
        const tickTime = new Date(
          weekRange.start.getTime() + (i / tickCount) * (weekRange.end.getTime() - weekRange.start.getTime()),
        )

        ticks.push({
          x: timeScale(tickTime),
          label: tickTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        })
      }

      return ticks
    }

    // Generate value axis ticks
    const generateValueTicks = () => {
      const ticks = []
      const tickCount = 4

      for (let i = 0; i <= tickCount; i++) {
        const value = (i / tickCount) * maxValue
        ticks.push({
          y: valueScale(value),
          label: Math.round(value),
        })
      }

      return ticks
    }

    const timeTicks = generateTimeTicks()
    const valueTicks = generateValueTicks()

    return (
      <div className="w-full bg-black/30 rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-medium text-gray-200">Species Detections</div>
          <div className="flex gap-2">
            {MAIN_SPECIES.map((species, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: species.color }}></div>
                <span className="text-xs text-gray-300">{species.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {valueTicks.map((tick, i) => (
                <line
                  key={`grid-${i}`}
                  x1="0"
                  y1={tick.y}
                  x2={chartWidth}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                  strokeDasharray={i > 0 ? "3 3" : ""}
                />
              ))}

              {/* Time axis */}
              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />

              {timeTicks.map((tick, i) => (
                <g key={`time-${i}`}>
                  <line
                    x1={tick.x}
                    y1={chartHeight}
                    x2={tick.x}
                    y2={chartHeight + 5}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.5"
                  />
                  <text x={tick.x} y={chartHeight + 18} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Value axis */}
              <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

              {valueTicks.map((tick, i) => (
                <g key={`value-${i}`}>
                  <line x1="-5" y1={tick.y} x2="0" y2={tick.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                  <text x="-8" y={tick.y + 3} textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="10">
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Species lines */}
              {MAIN_SPECIES.map((species, index) => (
                <path
                  key={`line-${index}`}
                  d={generatePath(species.name)}
                  fill="none"
                  stroke={species.color}
                  strokeWidth="2"
                />
              ))}

              {/* Data points */}
              {MAIN_SPECIES.map((species) =>
                filteredData.map((entry, i) => (
                  <circle
                    key={`point-${species.name}-${i}`}
                    cx={timeScale(entry.timestamp)}
                    cy={valueScale(entry[species.name] || 0)}
                    r="2.5"
                    fill={species.color}
                  />
                )),
              )}
            </g>
          </svg>
        </div>
      </div>
    )
  }

  // AI Models detection chart component
  const AIModelsChart = () => {
    const filteredData = getFilteredSpeciesData()
    if (filteredData.length === 0) return null

    const aiModels = [
      { name: "YOLOv8", color: "#8b5cf6" },
      { name: "EfficientDet", color: "#06b6d4" },
      { name: "Detectron2", color: "#f59e0b" },
      { name: "UAE-Custom", color: "#ef4444" },
    ]

    // Calculate chart dimensions
    const width = 500
    const height = 120
    const padding = { top: 10, right: 15, bottom: 20, left: 25 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Get max value for scaling
    let maxValue = 0
    filteredData.forEach((entry) => {
      aiModels.forEach((model) => {
        if (entry[model.name] > maxValue) maxValue = entry[model.name]
      })
    })
    maxValue = Math.max(5, Math.ceil(maxValue * 1.2))

    // Calculate scales
    const timeScale = (timestamp: Date) => {
      const rangeStart = weekRange.start.getTime()
      const rangeEnd = weekRange.end.getTime()
      const totalTime = rangeEnd - rangeStart
      const position = timestamp.getTime() - rangeStart
      return (position / totalTime) * chartWidth
    }

    const valueScale = (value: number) => {
      return chartHeight - (value / maxValue) * chartHeight
    }

    // Generate path data for each model
    const generatePath = (modelName: string) => {
      if (filteredData.length === 0) return ""

      return filteredData
        .map((entry, i) => {
          const x = timeScale(entry.timestamp)
          const y = valueScale(entry[modelName] || 0)
          return `${i === 0 ? "M" : "L"} ${x} ${y}`
        })
        .join(" ")
    }

    // Generate time axis ticks
    const generateTimeTicks = () => {
      const ticks = []
      const tickCount = 6

      for (let i = 0; i <= tickCount; i++) {
        const tickTime = new Date(
          weekRange.start.getTime() + (i / tickCount) * (weekRange.end.getTime() - weekRange.start.getTime()),
        )

        ticks.push({
          x: timeScale(tickTime),
          label: tickTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        })
      }

      return ticks
    }

    // Generate value axis ticks
    const generateValueTicks = () => {
      const ticks = []
      const tickCount = 4

      for (let i = 0; i <= tickCount; i++) {
        const value = (i / tickCount) * maxValue
        ticks.push({
          y: valueScale(value),
          label: Math.round(value),
        })
      }

      return ticks
    }

    const timeTicks = generateTimeTicks()
    const valueTicks = generateValueTicks()

    return (
      <div className="w-full bg-black/30 rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-medium text-gray-200">AI Model Performance</div>
          <div className="flex gap-2">
            {aiModels.map((model, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: model.color }}></div>
                <span className="text-xs text-gray-300">{model.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {valueTicks.map((tick, i) => (
                <line
                  key={`grid-${i}`}
                  x1="0"
                  y1={tick.y}
                  x2={chartWidth}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                  strokeDasharray={i > 0 ? "3 3" : ""}
                />
              ))}

              {/* Time axis */}
              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />

              {timeTicks.map((tick, i) => (
                <g key={`time-${i}`}>
                  <line
                    x1={tick.x}
                    y1={chartHeight}
                    x2={tick.x}
                    y2={chartHeight + 5}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.5"
                  />
                  <text x={tick.x} y={chartHeight + 18} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Value axis */}
              <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

              {valueTicks.map((tick, i) => (
                <g key={`value-${i}`}>
                  <line x1="-5" y1={tick.y} x2="0" y2={tick.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                  <text x="-8" y={tick.y + 3} textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="10">
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Model lines */}
              {aiModels.map((model, index) => (
                <path
                  key={`line-${index}`}
                  d={generatePath(model.name)}
                  fill="none"
                  stroke={model.color}
                  strokeWidth="2"
                />
              ))}

              {/* Data points */}
              {aiModels.map((model) =>
                filteredData.map((entry, i) => (
                  <circle
                    key={`point-${model.name}-${i}`}
                    cx={timeScale(entry.timestamp)}
                    cy={valueScale(entry[model.name] || 0)}
                    r="2.5"
                    fill={model.color}
                  />
                )),
              )}
            </g>
          </svg>
        </div>
      </div>
    )
  }

  // Species distribution pie chart
  const SpeciesDistributionChart = () => {
    const filteredData = getFilteredSpeciesData()
    if (filteredData.length === 0) return null

    // Calculate total detections per species
    const speciesTotal = MAIN_SPECIES.map((species) => {
      const total = filteredData.reduce((sum, entry) => sum + (entry[species.name] || 0), 0)
      return { name: species.name, value: total, color: species.color }
    })

    const totalDetections = speciesTotal.reduce((sum, species) => sum + species.value, 0)

    return (
      <div className="w-full bg-black/30 rounded-lg p-2">
        <div className="text-xs font-medium text-gray-200 mb-2">Species Distribution</div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {speciesTotal.map((species, index) => {
              const percentage = totalDetections > 0 ? ((species.value / totalDetections) * 100).toFixed(1) : 0
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: species.color }}></div>
                  <span className="text-xs text-gray-300">{species.name}</span>
                  <span className="text-xs text-emerald-400 font-medium">{percentage}%</span>
                </div>
              )
            })}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">{totalDetections}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
      <div
        className={`bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white shadow-lg transition-all duration-500 ease-out timeline-animate ${
          isMinimized ? "min-w-[180px]" : isWeeklyMode ? "min-w-[600px]" : "min-w-[400px]"
        }`}
      >
        {/* Header - Always Visible */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Timeline</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Date display - handle overflow when minimized */}
            <div className={`text-xs text-emerald-400 font-medium ${isMinimized ? "truncate max-w-[50px]" : ""}`}>
              {isWeeklyMode ? (
                <span>{isMinimized ? "Range" : `${formatDate(weekRange.start)} - ${formatDate(weekRange.end)}`}</span>
              ) : (
                formatDate(selectedDate)
              )}
            </div>

            {/* Minimize/Maximize Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              title={isMinimized ? "Expand Timeline" : "Minimize Timeline"}
            >
              {isMinimized ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Timeline Content - Collapsible */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            isMinimized ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100"
          }`}
        >
          <div className="px-3 pb-3">
            {/* Graph Tabs - Only show in weekly mode */}
            {isWeeklyMode && (
              <div className="mb-3">
                <div className="flex gap-1 bg-black/20 rounded-lg p-1 mb-3">
                  {[
                    { id: "species", label: "Species" },
                    { id: "models", label: "AI Models" },
                    { id: "distribution", label: "Distribution" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveGraphTab(tab.id)}
                      className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        activeGraphTab === tab.id
                          ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Chart Content */}
                <div className="transition-all duration-300">
                  {activeGraphTab === "species" && <SpeciesDetectionChart />}
                  {activeGraphTab === "models" && <AIModelsChart />}
                  {activeGraphTab === "distribution" && <SpeciesDistributionChart />}
                </div>
              </div>
            )}

            {/* Date Labels */}
            <div className="flex justify-between text-[9px] text-gray-400 mb-1.5">
              {dateLabels.map((label, index) => (
                <div key={index} className="text-center">
                  <div className="font-medium">{label.label}</div>
                  <div className="text-gray-500">{label.weekday}</div>
                </div>
              ))}
            </div>

            {/* Slider Track */}
            <div
              className="timeline-slider-track relative h-1.5 bg-white/10 rounded-full cursor-pointer"
              onClick={handleSliderClick}
            >
              {/* Progress Fill */}
              {isWeeklyMode ? (
                <div
                  className="absolute h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-200"
                  style={{
                    left: `${weekStartPosition}%`,
                    width: `${weekEndPosition - weekStartPosition}%`,
                  }}
                />
              ) : (
                <div
                  className="absolute h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${selectedPosition}%` }}
                />
              )}

              {/* Slider Handles - Add smooth transition for snapping */}
              {isWeeklyMode ? (
                <>
                  {/* Start Handle */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 border border-white rounded-full shadow-md cursor-grab hover:scale-110 transition-all duration-150"
                    style={{ left: `${weekStartPosition}%` }}
                    onMouseDown={(e) => handleMouseDown(e, "start")}
                  />

                  {/* End Handle */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 border border-white rounded-full shadow-md cursor-grab hover:scale-110 transition-all duration-150"
                    style={{ left: `${weekEndPosition}%` }}
                    onMouseDown={(e) => handleMouseDown(e, "end")}
                  />
                </>
              ) : (
                /* Single Handle */
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 border border-white rounded-full shadow-md cursor-grab hover:scale-110 transition-all duration-150"
                  style={{ left: `${selectedPosition}%` }}
                  onMouseDown={(e) => handleMouseDown(e, "single")}
                />
              )}

              {/* Date Markers - Show daily markers for better snapping visual feedback */}
              {Array.from({ length: 31 }).map((_, index) => {
                const markerDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000)
                const markerPercentage = dateToPercentage(markerDate)
                const isLabelDate = dateLabels.some(
                  (label) => Math.abs(label.date.getTime() - markerDate.getTime()) < 12 * 60 * 60 * 1000,
                )

                return (
                  <div
                    key={`marker-${index}`}
                    className={`absolute top-0 w-0.5 h-full ${isLabelDate ? "bg-white/30" : "bg-white/10"}`}
                    style={{ left: `${markerPercentage}%` }}
                  />
                )
              })}
            </div>

            {/* Preset Buttons */}
            <div className="flex justify-center gap-1.5 mt-2">
              {[
                { label: "Month", value: "month" },
                { label: "Week", value: "week" },
                { label: "Yesterday", value: "yesterday" },
                { label: "Today", value: "today" },
              ].map((button) => (
                <button
                  key={button.value}
                  onClick={() => handlePresetClick(button.value)}
                  className={`px-2.5 py-0.5 text-xs rounded-full transition-all duration-200 ${
                    activeChip === button.value
                      ? "bg-emerald-400/30 text-emerald-400 border border-emerald-400/50"
                      : "bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline-animate {
          transition: all 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
