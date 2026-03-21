// src/components/MechanicsMap.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { proMarker, standardMarker, userMarker } from '@/lib/mapIcons'
import { formatDistance } from '@/lib/geo'
import type { Mechanic } from '@/types'

// Recenter map when userLocation changes
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 13) }, [map, lat, lng])
  return null
}

interface Props {
  mechanics: Mechanic[]
  userLocation?: { lat: number; lng: number }
}

export default function MechanicsMap({ mechanics, userLocation }: Props) {
  const center = userLocation ?? { lat: 9.0765, lng: 7.3986 } // Abuja default

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      className="w-full h-[420px] rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <>
          <Recenter lat={userLocation.lat} lng={userLocation.lng} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}>
            <Popup>📍 Your location</Popup>
          </Marker>
        </>
      )}

      {mechanics.filter(m => m.lat && m.lng).map(m => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={m.plan === 'pro' ? proMarker : standardMarker}
        >
          <Popup minWidth={180}>
            <div className="py-1">
              <p className="font-bold text-gray-900 mb-0.5">{m.name}</p>
              <p className="text-sm text-gray-500 mb-0.5">
                📍 {m.area ? `${m.area}, ` : ''}{m.city}
              </p>
              {m.distance != null && !isNaN(m.distance) && (
                <p className="text-sm text-orange-500 mb-1">{formatDistance(m.distance)}</p>
              )}
              <p className="text-sm text-gray-500 mb-2">{m.phone}</p>
              <Link
                to={`/mechanic/${m.id}`}
                className="text-sm text-orange-500 font-semibold hover:underline"
              >
                View profile →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}