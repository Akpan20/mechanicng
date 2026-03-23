// src/hooks/useGeolocation.ts
import { useState, useCallback, useRef } from 'react'
import { getCurrentPosition, reverseGeocode } from '@/lib/geo'
import { GEO_FALLBACK_LABEL } from '@/lib/constants'
import type { Coordinates } from '@/types'

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track if we're currently processing to prevent double-clicks
  const processingRef = useRef(false)

  const getLocation = useCallback(async (): Promise<{ coords: Coordinates | null; error: string | null }> => {
    // Prevent concurrent calls
    if (processingRef.current) {
      return { coords: null, error: 'Already processing location request' }
    }
    
    processingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      // Add a small delay on mobile to ensure the permission dialog doesn't block the UI thread
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const coords = await getCurrentPosition()
      setLocation(coords)
      
      // Reverse geocode in parallel or after to not block
      const label = await reverseGeocode(coords)
      setLocationLabel(label || GEO_FALLBACK_LABEL)
      
      return { coords, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not get location'
      setError(msg)
      return { coords: null, error: msg }
    } finally {
      setLoading(false)
      processingRef.current = false
    }
  }, [])

  return { location, locationLabel, loading, error, getLocation }
}