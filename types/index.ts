export interface Camera {
  id: number
  name: string
  status: "active" | "offline"
  lat: number
  lng: number
  area: string
  lastDetection: string
  battery: number
}

export type CameraType = Camera

export interface Detection {
  id: number
  camera: string
  animal: string
  time: string
  confidence: number
  thumbnail: string
  fullImage: string
  dateTime: string
  aiModel: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface Species {
  name: string
  color: string
}

export interface AIModel {
  id: string
  name: string
  version: string
  enabled: boolean
}

export interface StatCard {
  title: string
  value: string | number
  change: string
  changeType: "positive" | "negative"
  icon: string
  color: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapTheme {
  id: string
  name: string
  style: string
}
