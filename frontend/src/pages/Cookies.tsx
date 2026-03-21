// src/pages/Cookies.tsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getConsent } from '@/components/CookieConsentBanner'

export default function CookiesPage() {
  const navigate = useNavigate()
  const [consent, setConsent] = useState(getConsent())

  const handleAccept = () => {
    localStorage.setItem('mechanicng_cookie_consent', 'accepted')
    setConsent('accepted')
  }

  const handleDecline = () => {
    localStorage.setItem('mechanicng_cookie_consent', 'declined')
    setConsent('declined')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors group">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        Back
      </button>

      <h1 className="text-3xl font-extrabold mb-2">Cookie Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">Cookies We Use</h2>
          <div className="space-y-4">
            <div className="card p-4">
              <p className="font-semibold text-white mb-1">Essential Cookies</p>
              <p className="text-sm text-gray-400">Required for the platform to function. These include session tokens for authentication and your last search preferences. You cannot opt out of these.</p>
            </div>
            <div className="card p-4">
              <p className="font-semibold text-white mb-1">Analytics Cookies</p>
              <p className="text-sm text-gray-400">Help us understand how visitors use the site so we can improve it. These are only activated with your consent and are anonymous and aggregated.</p>
            </div>
            <div className="card p-4">
              <p className="font-semibold text-white mb-1">Preference Cookies</p>
              <p className="text-sm text-gray-400">Remember your settings and choices, such as your last search city.</p>
            </div>
          </div>
        </section>

        {/* Live consent controls */}
        <section>
          <h2 className="text-lg font-bold text-white mb-2">Your Current Preferences</h2>
          <div className="card p-5">
            <p className="text-sm text-gray-400 mb-4">
              Current status:{' '}
              <span className={`font-semibold ${
                consent === 'accepted' ? 'text-emerald-400' :
                consent === 'declined' ? 'text-red-400' :
                'text-amber-400'
              }`}>
                {consent === 'accepted' ? '✓ Analytics accepted' :
                 consent === 'declined' ? '✗ Analytics declined' :
                 '⏳ No choice made yet'}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={consent === 'accepted'}
                className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
                Accept Analytics
              </button>
              <button
                onClick={handleDecline}
                disabled={consent === 'declined'}
                className="btn-outline text-sm py-2 px-4 disabled:opacity-50">
                Decline Analytics
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality. Most browsers allow you to view, delete, and block cookies from specific sites.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
          <p>Questions about our cookie use? Email <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.com</a>.</p>
        </section>
      </div>
    </div>
  )
}