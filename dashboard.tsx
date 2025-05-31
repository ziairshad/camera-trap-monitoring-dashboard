"use client"

import { useState, useEffect } from "react"
import { X, Download, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"

// Import custom hooks
import { useMapbox } from "./hooks/useMapbox"
import { useCameraSelection } from "./hooks/useCameraSelection"
import { useDetectionSelection } from "./hooks/useDetectionSelection"

// Import components
import { Header } from "./components/Header"
import { StatCards } from "./components/StatCards"
import { CameraList } from "./components/CameraList"
import { DetectionsList } from "./components/DetectionsList"
import { TimelineSliderComponent } from "./components/TimelineSlider"

// Import data and utilities
import { generateMockCameras, mockDetections, getStatCards } from "./data/mockData"
import { filterCameras, filterDetectionsByCamera, getActiveCamerasCount } from "./utils/dataFilters"
import { MAP_THEMES } from "./config/constants"
import type { MapTheme } from "./types"

// Generate mock data
const cameras = generateMockCameras(15)

// Abu Dhabi area names for camera locations
const abuDhabiAreas = [
  "Al Maryah Island",
  "Al Reem Island",
  "Saadiyat Island",
  "Yas Island",
  "Al Bateen",
  "Corniche",
  "Al Khalidiyah",
  "Al Manhal",
  "Al Nahyan",
  "Zayed Sports City",
  "Masdar City",
  "Al Raha Beach",
  "Khalifa City",
  "Al Mushrif",
  "Al Karamah",
  "Al Wathba",
  "Baniyas",
  "Al Shawamekh",
  "Al Falah City",
]

// Generate random camera locations within Abu Dhabi bounds - limited to 5 cameras
const generateRandomCameras = (count: number) => {
  const abuDhabiBounds = {
    north: 24.48,
    south: 24.42,
    east: 54.39,
    west: 54.36,
  }

  const cameras = []
  for (let i = 1; i <= count; i++) {
    const lat = abuDhabiBounds.south + Math.random() * (abuDhabiBounds.north - abuDhabiBounds.south)
    const lng = abuDhabiBounds.west + Math.random() * (abuDhabiBounds.east - abuDhabiBounds.west)
    const status = Math.random() > 0.2 ? "active" : "offline" // 80% active
    const battery = Math.floor(Math.random() * 100)
    const lastDetectionOptions = ["5m ago", "30m ago", "1h ago", "2h ago", "1d ago"]
    const area = abuDhabiAreas[Math.floor(Math.random() * abuDhabiAreas.length)]

    cameras.push({
      id: i,
      name: `Camera ${i.toString().padStart(2, "0")}`,
      status,
      lat,
      lng,
      area,
      lastDetection: lastDetectionOptions[Math.floor(Math.random() * lastDetectionOptions.length)],
      battery,
    })
  }
  return cameras
}

// Mock data for camera traps - limited to 5 cameras
const cameraTraps = generateRandomCameras(15)

// Define the main species for consistency across the dashboard
const mainSpecies = [
  { name: "Arabian Oryx", color: "#10b981" }, // emerald-400
  { name: "Desert Fox", color: "#3b82f6" }, // blue-400
  { name: "Sand Cat", color: "#eab308" }, // yellow-400
]

// Mock species detections per camera
const cameraDetections = {
  1: [
    { species: "Arabian Oryx", count: 12, lastSeen: "2h ago", confidence: 94 },
    { species: "Desert Fox", count: 8, lastSeen: "5h ago", confidence: 87 },
    { species: "Sand Cat", count: 3, lastSeen: "1d ago", confidence: 91 },
  ],
  2: [
    { species: "Desert Fox", count: 15, lastSeen: "1h ago", confidence: 89 },
    { species: "Arabian Oryx", count: 6, lastSeen: "3h ago", confidence: 92 },
  ],
  // Add more camera detections...
}

// Mock AI model configurations
const aiModelConfigs = {
  1: {
    model: "YOLOv8-Wildlife",
    version: "v2.1.3",
    confidence: 85,
    species: ["Arabian Oryx", "Desert Fox", "Sand Cat", "Fennec Fox"],
    lastUpdate: "2024-01-15",
  },
  2: {
    model: "EfficientDet-Desert",
    version: "v1.8.2",
    confidence: 80,
    species: ["Desert Fox", "Arabian Oryx", "Houbara Bustard"],
    lastUpdate: "2024-01-12",
  },
  // Add more configurations...
}

// Enhanced mock data for detections with more details - using consistent species
const recentDetections = [
  {
    id: 1,
    camera: "Camera 02",
    animal: "Arabian Oryx",
    time: "5m ago",
    confidence: 95,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 13:45:22",
    aiModel: "YOLOv8-Wildlife v2.1.3",
    boundingBox: { x: 0.2, y: 0.3, width: 0.6, height: 0.5 },
  },
  {
    id: 2,
    camera: "Camera 04",
    animal: "Sand Cat",
    time: "30m ago",
    confidence: 87,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 13:20:15",
    aiModel: "EfficientDet-Desert v1.8.2",
    boundingBox: { x: 0.4, y: 0.4, width: 0.4, height: 0.3 },
  },
  {
    id: 3,
    camera: "Camera 01",
    animal: "Desert Fox",
    time: "2h ago",
    confidence: 92,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 11:32:08",
    aiModel: "UAE-Wildlife-Custom v3.0.0",
    boundingBox: { x: 0.3, y: 0.2, width: 0.5, height: 0.6 },
  },
  {
    id: 4,
    camera: "Camera 02",
    animal: "Desert Fox",
    time: "3h ago",
    confidence: 78,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 10:15:47",
    aiModel: "YOLOv8-Wildlife v2.1.3",
    boundingBox: { x: 0.25, y: 0.35, width: 0.5, height: 0.4 },
  },
  {
    id: 5,
    camera: "Camera 05",
    animal: "Arabian Oryx",
    time: "1h ago",
    confidence: 89,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 12:05:33",
    aiModel: "Detectron2-Animals v1.5.1",
    boundingBox: { x: 0.3, y: 0.25, width: 0.45, height: 0.55 },
  },
  {
    id: 6,
    camera: "Camera 07",
    animal: "Desert Fox",
    time: "4h ago",
    confidence: 91,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 09:22:18",
    aiModel: "EfficientDet-Desert v1.8.2",
    boundingBox: { x: 0.35, y: 0.3, width: 0.4, height: 0.45 },
  },
  {
    id: 7,
    camera: "Camera 03",
    animal: "Sand Cat",
    time: "6h ago",
    confidence: 85,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 07:40:52",
    aiModel: "YOLOv8-Wildlife v2.1.3",
    boundingBox: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
  },
  {
    id: 8,
    camera: "Camera 09",
    animal: "Sand Cat",
    time: "8h ago",
    confidence: 76,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 05:15:29",
    aiModel: "UAE-Wildlife-Custom v3.0.0",
    boundingBox: { x: 0.4, y: 0.5, width: 0.3, height: 0.2 },
  },
  {
    id: 9,
    camera: "Camera 11",
    animal: "Arabian Oryx",
    time: "10h ago",
    confidence: 93,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 03:10:14",
    aiModel: "Detectron2-Animals v1.5.1",
    boundingBox: { x: 0.3, y: 0.3, width: 0.5, height: 0.5 },
  },
  {
    id: 10,
    camera: "Camera 06",
    animal: "Desert Fox",
    time: "12h ago",
    confidence: 82,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-30 01:05:38",
    aiModel: "UAE-Wildlife-Custom v3.0.0",
    boundingBox: { x: 0.35, y: 0.4, width: 0.4, height: 0.3 },
  },
  {
    id: 11,
    camera: "Camera 08",
    animal: "Arabian Oryx",
    time: "14h ago",
    confidence: 88,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-29 23:20:45",
    aiModel: "YOLOv8-Wildlife v2.1.3",
    boundingBox: { x: 0.25, y: 0.25, width: 0.55, height: 0.55 },
  },
  {
    id: 12,
    camera: "Camera 12",
    animal: "Sand Cat",
    time: "16h ago",
    confidence: 79,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-29 21:15:22",
    aiModel: "EfficientDet-Desert v1.8.2",
    boundingBox: { x: 0.4, y: 0.45, width: 0.35, height: 0.3 },
  },
  {
    id: 13,
    camera: "Camera 15",
    animal: "Desert Fox",
    time: "18h ago",
    confidence: 94,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-29 19:05:11",
    aiModel: "Detectron2-Animals v1.5.1",
    boundingBox: { x: 0.2, y: 0.3, width: 0.6, height: 0.5 },
  },
  {
    id: 14,
    camera: "Camera 10",
    animal: "Sand Cat",
    time: "20h ago",
    confidence: 86,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-29 17:30:48",
    aiModel: "YOLOv8-Wildlife v2.1.3",
    boundingBox: { x: 0.3, y: 0.35, width: 0.45, height: 0.4 },
  },
  {
    id: 15,
    camera: "Camera 13",
    animal: "Arabian Oryx",
    time: "22h ago",
    confidence: 97,
    thumbnail: "/placeholder.svg?height=60&width=60",
    fullImage: "/placeholder.svg?height=400&width=600",
    dateTime: "2024-05-29 15:10:33",
    aiModel: "UAE-Wildlife-Custom v3.0.0",
    boundingBox: { x: 0.25, y: 0.2, width: 0.55, height: 0.6 },
  },
]

// Camera Details Tabs Component
function CameraDetailsTabs({ selectedCamera }: { selectedCamera: number }) {
  const [activeTab, setActiveTab] = useState("insights")

  // Mock AI models available for cameras
  const availableModels = [
    { id: "yolo-wildlife", name: "YOLOv8-Wildlife", version: "v2.1.3", enabled: true },
    { id: "efficientdet", name: "EfficientDet-Desert", version: "v1.8.2", enabled: false },
    { id: "detectron", name: "Detectron2-Animals", version: "v1.5.1", enabled: true },
    { id: "custom-uae", name: "UAE-Wildlife-Custom", version: "v3.0.0", enabled: false },
  ]

  const [modelStates, setModelStates] = useState(
    availableModels.reduce((acc, model) => ({ ...acc, [model.id]: model.enabled }), {}),
  )

  // Mock insights data - detections over last 7 days
  const insightsData = [
    { day: "Mon", detections: 8, species: 3 },
    { day: "Tue", detections: 12, species: 4 },
    { day: "Wed", detections: 6, species: 2 },
    { day: "Thu", detections: 15, species: 5 },
    { day: "Fri", detections: 18, species: 6 },
    { day: "Sat", detections: 10, species: 4 },
    { day: "Sun", detections: 14, species: 5 },
  ]

  const maxDetections = Math.max(...insightsData.map((d) => d.detections))

  return (
    <div className="w-full">
      <div className="border-b border-white/10">
        <div className="flex -mb-px space-x-4 text-xs">
          <button
            className={`py-2 border-b-2 font-medium transition-colors ${
              activeTab === "insights"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-emerald-400/70"
            }`}
            onClick={() => setActiveTab("insights")}
          >
            Insights
          </button>
          <button
            className={`py-2 border-b-2 font-medium transition-colors ${
              activeTab === "ai"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-emerald-400/70"
            }`}
            onClick={() => setActiveTab("ai")}
          >
            AI Models
          </button>
        </div>
      </div>

      <div className="pt-3">
        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-2">
            <div className="w-full h-32 bg-white/5 rounded-md p-3 relative">
              {/* SVG Line Chart */}
              <svg className="absolute inset-3" viewBox="0 0 280 100" preserveAspectRatio="none">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="280" height="100" fill="url(#grid)" />

                {/* Species lines */}
                {/* Arabian Oryx - Green */}
                <polyline
                  fill="none"
                  stroke={mainSpecies[0].color}
                  strokeWidth="1.5"
                  points="0,70 40,50 80,80 120,30 160,20 200,60 240,35"
                />

                {/* Desert Fox - Blue */}
                <polyline
                  fill="none"
                  stroke={mainSpecies[1].color}
                  strokeWidth="1.5"
                  points="0,85 40,75 80,90 120,65 160,45 200,70 240,55"
                />

                {/* Sand Cat - Yellow */}
                <polyline
                  fill="none"
                  stroke={mainSpecies[2].color}
                  strokeWidth="1.5"
                  points="0,90 40,85 80,95 120,80 160,70 200,85 240,75"
                />

                {/* Data points */}
                <circle cx="0" cy="70" r="2" fill={mainSpecies[0].color} />
                <circle cx="40" cy="50" r="2" fill={mainSpecies[0].color} />
                <circle cx="80" cy="80" r="2" fill={mainSpecies[0].color} />
                <circle cx="120" cy="30" r="2" fill={mainSpecies[0].color} />
                <circle cx="160" cy="20" r="2" fill={mainSpecies[0].color} />
                <circle cx="200" cy="60" r="2" fill={mainSpecies[0].color} />
                <circle cx="240" cy="35" r="2" fill={mainSpecies[0].color} />

                <circle cx="0" cy="85" r="2" fill={mainSpecies[1].color} />
                <circle cx="40" cy="75" r="2" fill={mainSpecies[1].color} />
                <circle cx="80" cy="90" r="2" fill={mainSpecies[1].color} />
                <circle cx="120" cy="65" r="2" fill={mainSpecies[1].color} />
                <circle cx="160" cy="45" r="2" fill={mainSpecies[1].color} />
                <circle cx="200" cy="70" r="2" fill={mainSpecies[1].color} />
                <circle cx="240" cy="55" r="2" fill={mainSpecies[1].color} />

                <circle cx="0" cy="90" r="2" fill={mainSpecies[2].color} />
                <circle cx="40" cy="85" r="2" fill={mainSpecies[2].color} />
                <circle cx="80" cy="95" r="2" fill={mainSpecies[2].color} />
                <circle cx="120" cy="80" r="2" fill={mainSpecies[2].color} />
                <circle cx="160" cy="70" r="2" fill={mainSpecies[2].color} />
                <circle cx="200" cy="85" r="2" fill={mainSpecies[2].color} />
                <circle cx="240" cy="75" r="2" fill={mainSpecies[2].color} />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-3 bottom-6 flex flex-col justify-between text-[8px] text-gray-400">
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-6 right-3 flex justify-between text-[8px] text-gray-400">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Chart title */}
              <div className="absolute top-0 left-0 text-[8px] text-gray-400">Detections</div>
            </div>

            {/* Legend */}
            <div className="flex justify-between text-[10px] mb-2">
              {mainSpecies.map((species, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: species.color }}></div>
                  <span className="text-gray-400">{species.name}</span>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <div className="text-gray-400">Total Species</div>
                <div className="text-emerald-400 font-medium">{mainSpecies.length}</div>
              </div>
              <div className="bg-white/5 p-2 rounded">
                <div className="text-gray-400">Peak Day</div>
                <div className="text-emerald-400 font-medium">Friday</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Models Tab */}
        {activeTab === "ai" && (
          <div className="flex flex-col h-full">
            <div className="space-y-2 flex-1 overflow-y-auto">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{model.name}</p>
                    <p className="text-[10px] text-gray-400">{model.version}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="relative">
                      <button
                        onClick={() => setModelStates((prev) => ({ ...prev, [model.id]: !prev[model.id] }))}
                        className={`block w-8 h-4 rounded-full cursor-pointer transition-colors ${
                          modelStates[model.id] ? "bg-emerald-400" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`block w-3 h-3 bg-white rounded-full shadow transform transition-transform ${
                            modelStates[model.id] ? "translate-x-4" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 mt-2">
              Active models: {Object.values(modelStates).filter(Boolean).length} of {availableModels.length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Detection Detail Component
function DetectionDetail({ detection, onClose }: { detection: any; onClose: () => void }) {
  // Function to handle image download
  const handleDownload = () => {
    // In a real app, this would trigger a download of the actual image
    const link = document.createElement("a")
    link.href = detection.fullImage
    link.download = `${detection.animal}_${detection.dateTime.replace(/[: ]/g, "-")}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white h-[calc(50vh-100px)] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-emerald-400" />
            Detection Details
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto flex-1 p-3">
        {/* Image with annotation */}
        <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden">
          <img
            src={detection.fullImage || "/placeholder.svg"}
            alt={detection.animal}
            className="w-full h-full object-cover"
          />
          {/* Bounding box overlay */}
          <div
            className="absolute border-2 border-emerald-400 rounded-sm pointer-events-none"
            style={{
              left: `${detection.boundingBox.x * 100}%`,
              top: `${detection.boundingBox.y * 100}%`,
              width: `${detection.boundingBox.width * 100}%`,
              height: `${detection.boundingBox.height * 100}%`,
            }}
          >
            <div className="absolute -top-5 -left-1 bg-emerald-400 text-black text-xs px-1 py-0.5 rounded">
              {detection.animal}
            </div>
          </div>
        </div>

        {/* Detection information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-emerald-400">{detection.animal}</h3>
            <Badge variant="outline" className="border-emerald-400/50 text-emerald-400 text-xs">
              {detection.confidence}% confidence
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">Camera</div>
              <div className="text-white font-medium">{detection.camera}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">Date & Time</div>
              <div className="text-white font-medium">{detection.dateTime}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">AI Model</div>
              <div className="text-white font-medium">{detection.aiModel}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">Relative Time</div>
              <div className="text-white font-medium">{detection.time}</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-2 border-emerald-400/50 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 bg-transparent"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3 mr-2" /> Download Image
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function CameraTrapDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null)
  const [currentMapTheme, setCurrentMapTheme] = useState<MapTheme>(MAP_THEMES[0]) // Default to Dark theme (index 0)

  // Custom hooks for state management
  const { mapContainer, mapLoaded, mapError, flyToCamera } = useMapbox(cameras, selectedCamera, currentMapTheme)
  const { handleCameraSelect, getSelectedCameraData } = useCameraSelection(cameras)
  const { selectedDetection, handleDetectionSelect, handleCloseDetectionDetail } = useDetectionSelection()

  // Derived data
  const filteredCameras = filterCameras(cameras, searchTerm)
  const filteredDetections = filterDetectionsByCamera(mockDetections, selectedCamera, cameras)
  const activeCamerasCount = getActiveCamerasCount(cameras)
  const statCards = getStatCards(activeCamerasCount)
  const selectedCameraData = getSelectedCameraData()

  // Enhanced camera selection with map interaction
  const handleCameraSelectWithMap = (cameraId: number) => {
    const newSelectedCamera = handleCameraSelect(cameraId)
    if (newSelectedCamera) {
      const camera = cameras.find((c) => c.id === newSelectedCamera)
      if (camera) {
        flyToCamera(camera)
      }
    }
    setSelectedCamera(newSelectedCamera) // This will be null if deselected
  }

  // Add event listener for marker clicks
  useEffect(() => {
    const handleMarkerClick = (event: CustomEvent) => {
      const cameraId = event.detail.cameraId
      handleCameraSelectWithMap(cameraId)
    }

    window.addEventListener("cameraMarkerClick", handleMarkerClick as EventListener)

    return () => {
      window.removeEventListener("cameraMarkerClick", handleMarkerClick as EventListener)
    }
  }, []) // Removed handleCameraSelectWithMap from dependencies

  // Handle map theme change
  const handleMapThemeChange = (theme: MapTheme) => {
    setCurrentMapTheme(theme)
  }

  return (
    <TooltipProvider>
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
        <Header mapError={mapError} currentMapTheme={currentMapTheme} onMapThemeChange={handleMapThemeChange} />

        {/* Main Content */}
        <div className="absolute inset-0 z-20" style={{ top: "52px", pointerEvents: "none" }}>
          {/* Statistics Cards */}
          <StatCards stats={statCards} />

          {/* Main Content Area */}
          <div className="px-3 mt-2 flex h-[calc(100vh-120px)] pointer-events-none">
            {/* Left Sidebar - Camera List */}
            <div className="w-72 mr-3 space-y-3 pointer-events-auto">
              <CameraList
                cameras={filteredCameras}
                selectedCamera={selectedCamera}
                onCameraSelect={handleCameraSelectWithMap}
              />

              {/* Camera Details Widget - Only show when camera is selected */}
              {selectedCamera && selectedCameraData && (
                <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white h-[calc(50vh-100px)] flex flex-col">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Info className="h-4 w-4 text-emerald-400" />
                        Camera Details
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedCamera(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 overflow-y-auto flex-1 p-3">
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-gray-400">Name:</span> {selectedCameraData.name}
                      </p>
                      <p>
                        <span className="text-gray-400">Location:</span> {selectedCameraData.area}
                      </p>
                      <p>
                        <span className="text-gray-400">Coordinates:</span> {selectedCameraData.lat.toFixed(4)},{" "}
                        {selectedCameraData.lng.toFixed(4)}
                      </p>
                      <p>
                        <span className="text-gray-400">Last Image:</span> {selectedCameraData.lastDetection}
                      </p>
                      <p>
                        <span className="text-gray-400">Status:</span> {selectedCameraData.status}
                      </p>
                      <p>
                        <span className="text-gray-400">Battery:</span> {selectedCameraData.battery}%
                      </p>
                    </div>

                    {/* Add the tabs component */}
                    <CameraDetailsTabs selectedCamera={selectedCamera} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center Map Area - Spacer - Allow pointer events to pass through */}
            <div className="flex-1 pointer-events-none"></div>

            {/* Right Sidebar - Detections List */}
            <div className="w-80 ml-3 space-y-3 pointer-events-auto">
              <DetectionsList
                detections={filteredDetections}
                selectedDetection={selectedDetection}
                selectedCamera={selectedCamera}
                onDetectionSelect={handleDetectionSelect}
              />

              {/* Detection Detail Widget */}
              {selectedDetection && (
                <DetectionDetail detection={selectedDetection} onClose={handleCloseDetectionDetail} />
              )}
            </div>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="pointer-events-none">
          <TimelineSliderComponent />
        </div>

        {/* Global Styles */}
        <style jsx global>{`
          @keyframes cameraPulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.4;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.3);
              opacity: 0.1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.4;
            }
          }
          
          .camera-marker-dot {
            transition: width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease;
          }
          
          .camera-marker:hover .camera-marker-dot {
            width: 14px !important;
            height: 14px !important;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.8) !important;
          }
          
          .camera-popup .mapboxgl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 12px !important;
          }
          
          .camera-popup .mapboxgl-popup-tip {
            border-top-color: rgba(0, 0, 0, 0.2) !important;
            filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.3));
          }
          
          .mapboxgl-marker {
            position: absolute !important;
          }

          .timeline-slider-track {
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
          }
        `}</style>
      </div>
    </TooltipProvider>
  )
}
