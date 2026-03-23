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

export const getCurrentPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    // Debug logging for mobile
    console.log('Requesting geolocation...', {
      protocol: window.location.protocol,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent
    })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position.coords)
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        console.error('Geolocation error:', error.code, error.message)
        // Map error codes to user-friendly messages
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enable location access in your browser settings.',
          2: 'Location unavailable. Please check your GPS or try searching by city.',
          3: 'Location request timed out. Please try again or search by city.',
        }
        reject(new Error(messages[error.code] || error.message))
      },
      {
        enableHighAccuracy: false, // Set to false for faster response on mobile
        timeout: 15000,            // Increase timeout for mobile
        maximumAge: 60000          // Allow cached positions up to 1 minute
      }
    )
  })
}