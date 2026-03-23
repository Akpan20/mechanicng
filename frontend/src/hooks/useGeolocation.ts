// src/hooks/useGeolocation.ts
import { useState, useCallback } from 'react'
import { getCurrentPosition, reverseGeocode } from '@/lib/geo'
import { GEO_FALLBACK_LABEL } from '@/lib/constants'
import type { Coordinates } from '@/types'

export function useGeolocation() {
  const [location,      setLocation]      = useState<Coordinates | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const getLocation = useCallback(async (): Promise<{ coords: Coordinates | null; error: string | null }> => {
    setLoading(true)
    setError(null)
    try {
      const coords = await getCurrentPosition()
      setLocation(coords)
      const label = await reverseGeocode(coords)
      setLocationLabel(label || GEO_FALLBACK_LABEL)
      return { coords, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not get location'
      setError(msg)
      return { coords: null, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  return { location, locationLabel, loading, error, getLocation }
}