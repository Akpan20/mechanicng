import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsent, CONSENT_KEY } from '@/lib/constants'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => !getConsent())

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-surface-900 border border-gray-700 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-300">
          <p className="font-semibold text-white mb-1">🍪 We use cookies</p>
          <p>
            We use essential cookies to keep you logged in, and optional analytics cookies to
            improve the platform. See our{' '}
            <Link to="/cookies" className="text-brand-500 hover:underline">Cookie Policy</Link>
            {' '}for details.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="btn-ghost text-sm px-4 py-2 border border-gray-700">
            Decline
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm px-4 py-2">
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}