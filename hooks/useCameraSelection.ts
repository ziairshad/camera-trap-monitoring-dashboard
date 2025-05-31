"use client"

import { useState } from "react"
import type { Camera } from "../types"

export const useCameraSelection = (cameras: Camera[]) => {
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null)

  const handleCameraSelect = (cameraId: number) => {
    const newSelectedCamera = selectedCamera === cameraId ? null : cameraId
    setSelectedCamera(newSelectedCamera)
    return newSelectedCamera
  }

  const getSelectedCameraData = () => {
    return selectedCamera ? cameras.find((c) => c.id === selectedCamera) : null
  }

  return {
    selectedCamera,
    handleCameraSelect,
    getSelectedCameraData,
  }
}
