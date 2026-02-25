/**
 * Load Google AdSense script once globally.
 * Place this in Layout.tsx.
 * Replace XXXXXXXXXXXXXXXX with your real publisher ID from AdSense dashboard.
 */
import { useEffect } from 'react'

const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'

export default function AdSenseLoader() {
  useEffect(() => {
    // Only load in production to avoid AdSense errors in dev
    if (import.meta.env.DEV) return
    if (document.querySelector(`script[data-adsense]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
    script.setAttribute('crossorigin', 'anonymous')
    script.setAttribute('data-adsense', 'true')
    document.head.appendChild(script)
  }, [])
  return null
}
