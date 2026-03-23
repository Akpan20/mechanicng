import type { Coordinates, Mechanic } from '@/types'

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function toRad(deg: number): number { return (deg * Math.PI) / 180 }

export function attachDistances(mechanics: Mechanic[], userLoc: Coordinates): Mechanic[] {
  return mechanics
    .map(m => ({
      ...m,
      distance: (m.lat != null && m.lng != null)
        ? haversineDistance(userLoc, { lat: m.lat, lng: m.lng })
        : undefined
    }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`
  return `${km.toFixed(1)}km away`
}

export async function reverseGeocode(coords: Coordinates): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
    )
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.state || 'Your location'
  } catch {
    return 'Your location'
  }
}

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Nigeria')}&format=json&limit=1`
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    return null
  } catch {
    return null
  }
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => {
        let message = 'Could not get your location'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable it in your browser or phone settings.'
            break
          case err.POSITION_UNAVAILABLE:
            message = 'Location unavailable. Please try again or search by city.'
            break
          case err.TIMEOUT:
            message = 'Location request timed out. Please try again.'
            break
        }
        reject(new Error(message))
      },
      {
        timeout:            15000,  // longer for mobile networks
        enableHighAccuracy: false,  // true causes timeouts on many Android devices
        maximumAge:         60000,  // accept cached position up to 1 min old
      }
    )
  })
}