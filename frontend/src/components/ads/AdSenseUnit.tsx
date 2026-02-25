import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// Google AdSense Unit
// Renders a standard AdSense ad unit. Used as fallback when
// no paid MechanicNG ads are scheduled for a placement.
//
// SETUP: Replace VITE_ADSENSE_PUBLISHER_ID in .env.local
//   e.g. VITE_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456
// ─────────────────────────────────────────────────────────────

interface Props {
  slotId: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
}

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined

export default function AdSenseUnit({
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: Props) {
  const ref = useRef<HTMLModElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // Don't render in dev if no publisher ID configured
    if (!PUBLISHER_ID) return
    if (initialized.current) return

    initialized.current = true

    try {
      // Ensure adsbygoogle exists (safe access)
      const adsbygoogle = (window as any).adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch {
      // AdSense script not loaded yet → it will auto-init when ready
      // We intentionally ignore the error here
    }
  }, [])

  // No publisher ID → dev placeholder / prod nothing
  if (!PUBLISHER_ID) {
    if (import.meta.env.DEV) {
      return (
        <div
          className={`flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 text-gray-600 text-xs font-mono p-4 ${className}`}
          style={style}
        >
          <div className="text-center">
            <div className="text-lg mb-1">📰</div>
            <div>AdSense Placeholder</div>
            <div className="text-gray-700 mt-0.5">Slot: {slotId}</div>
            <div className="text-gray-700">Set VITE_ADSENSE_PUBLISHER_ID in .env.local</div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}