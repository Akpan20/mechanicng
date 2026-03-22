// backend/src/lib/geo.ts

/**
 * Geo utilities for the backend.
 * Uses Nominatim (OpenStreetMap) for geocoding.
 */

// Nominatim requires a User-Agent header
const USER_AGENT = 'MechanicNG/1.0 (contact@mechanicng.com)'

// Type definitions for Nominatim API responses
interface NominatimSearchResult {
  lat: string
  lon: string
  display_name?: string
  // other fields we don't need
}

interface NominatimReverseResult {
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
  }
}

/**
 * Convert degrees to radians.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calculate Haversine distance between two coordinates (in km).
 */
export function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Geocode a city name to approximate coordinates.
 * Returns { lat, lng } or null if not found.
 */
export async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      city + ', Nigeria'
    )}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const data = (await res.json()) as NominatimSearchResult[]
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error('geocodeCity error:', error)
    return null
  }
}

/**
 * Geocode a full address (e.g., "No. 2 Kango Road, Kuje, Abuja").
 * Returns { lat, lng } or null.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address + ', Nigeria'
    )}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const data = (await res.json()) as NominatimSearchResult[]
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error('geocodeAddress error:', error)
    return null
  }
}

/**
 * Reverse geocode coordinates to get a human-readable location name.
 * Returns a string like "Kuje, Abuja" or "Your location" on error.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const data = (await res.json()) as NominatimReverseResult
    const addr = data.address
    if (addr) {
      return addr.city || addr.town || addr.village || addr.state || 'Your location'
    }
    return 'Your location'
  } catch (error) {
    console.error('reverseGeocode error:', error)
    return 'Your location'
  }
}