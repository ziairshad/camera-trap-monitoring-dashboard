"use client"

import { useState } from "react"
import type { Detection } from "../types"

export const useDetectionSelection = () => {
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)

  const handleDetectionSelect = (detection: Detection) => {
    setSelectedDetection(selectedDetection?.id === detection.id ? null : detection)
  }

  const handleCloseDetectionDetail = () => {
    setSelectedDetection(null)
  }

  return {
    selectedDetection,
    handleDetectionSelect,
    handleCloseDetectionDetail,
  }
}
