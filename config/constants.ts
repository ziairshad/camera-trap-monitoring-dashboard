export const MAPBOX_TOKEN =
  "pk.eyJ1IjoiemlhaXJzaGFkIiwiYSI6ImNtOXNhY3lqaDAwcnEybXNlMTRmdDd4dXUifQ.-wOM1g35rjy7AXf_6ws4Ig"

export const ABU_DHABI_BOUNDS = {
  north: 24.48,
  south: 24.42,
  east: 54.39,
  west: 54.36,
}

export const ABU_DHABI_CENTER = [54.3773, 24.4539] as [number, number]

export const ABU_DHABI_AREAS = [
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
]

export const MAIN_SPECIES = [
  { name: "Arabian Oryx", color: "#10b981" },
  { name: "Desert Fox", color: "#3b82f6" },
  { name: "Sand Cat", color: "#eab308" },
]

export const AVAILABLE_AI_MODELS = [
  { id: "yolo-wildlife", name: "YOLOv8-Wildlife", version: "v2.1.3", enabled: true },
  { id: "efficientdet", name: "EfficientDet-Desert", version: "v1.8.2", enabled: false },
  { id: "detectron", name: "Detectron2-Animals", version: "v1.5.1", enabled: true },
  { id: "custom-uae", name: "UAE-Wildlife-Custom", version: "v3.0.0", enabled: false },
]

export const MAP_THEMES = [
  { id: "dark", name: "Dark", style: "mapbox://styles/mapbox/dark-v11" },
  { id: "custom", name: "Space42 Blue", style: "mapbox://styles/ziairshad/cmbafekdz00w201pa6r80984v" },
]
