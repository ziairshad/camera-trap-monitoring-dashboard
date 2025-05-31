import type { Camera, Detection } from "../types"

export const filterCameras = (cameras: Camera[], searchTerm: string): Camera[] => {
  return cameras.filter((camera) => camera.name.toLowerCase().includes(searchTerm.toLowerCase()))
}

export const filterDetectionsByCamera = (
  detections: Detection[],
  selectedCamera: number | null,
  cameras: Camera[],
): Detection[] => {
  if (!selectedCamera) return detections

  const selectedCameraData = cameras.find((c) => c.id === selectedCamera)
  return selectedCameraData
    ? detections.filter((detection) => detection.camera === selectedCameraData.name)
    : detections
}

export const getActiveCamerasCount = (cameras: Camera[]): number => {
  return cameras.filter((camera) => camera.status === "active").length
}
