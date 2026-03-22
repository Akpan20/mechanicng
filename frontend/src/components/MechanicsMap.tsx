import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { proMarker, standardMarker, userMarker } from '@/lib/mapIcons'
import { formatDistance } from '@/lib/geo'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, DEFAULT_LOCATION_LABEL } from '@/lib/constants'
import type { Mechanic } from '@/types'

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], DEFAULT_MAP_ZOOM) }, [map, lat, lng])
  return null
}

interface Props {
  mechanics:    Mechanic[]
  userLocation?: { lat: number; lng: number }
}

export default function MechanicsMap({ mechanics, userLocation }: Props) {
  const center = userLocation ?? DEFAULT_MAP_CENTER

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      style={{ height: '420px', width: '100%' }}
      className="rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <>
          <Recenter lat={userLocation.lat} lng={userLocation.lng} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}>
            <Popup>📍 {DEFAULT_LOCATION_LABEL}</Popup>
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
              {m.phone && (
                <p className="text-sm text-gray-500 mb-2">{m.phone}</p>
              )}
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