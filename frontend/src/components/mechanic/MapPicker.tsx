// src/components/mechanic/MapPicker.tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet icon fix
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

import { DEFAULT_MAP_CENTER } from '@/lib/constants'

// ─────────────────────────────────────────────────────────────
// 🔧 Leaflet icon setup (SSR-safe)
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
}

// ─────────────────────────────────────────────────────────────
// 📍 Clickable marker
// ─────────────────────────────────────────────────────────────
interface LocationMarkerProps {
  position: [number, number]
  onChange: (lat: number, lng: number) => void
}

function LocationMarker({ position, onChange }: LocationMarkerProps) {
  useMapEvents({
    click: (e) => onChange(e.latlng.lat, e.latlng.lng),
  })
  return <Marker position={position} />
}

// ─────────────────────────────────────────────────────────────
// 🗺️ MapPicker component
// ─────────────────────────────────────────────────────────────
export interface MapPickerProps {
  lat: number | null
  lng: number | null
  onChange: (_lat: number, _lng: number) => void
}

// ✅ No explicit return type — TypeScript infers it safely
export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const position: [number, number] =
    lat != null && lng != null
      ? [lat, lng]
      : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      style={{
        height: '300px',
        width: '100%',
        borderRadius: '0.5rem',
        zIndex: 0,
      }}
      aria-label="Interactive map: click to set location"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} onChange={onChange} />
    </MapContainer>
  )
}