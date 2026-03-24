import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useMechanics } from '@/hooks/useMechanics'
import { attachDistances } from '@/lib/geo'
import MechanicCard from '@/components/mechanic/MechanicCard'
import AdSlot from '@/components/ads/AdSlot'
import Loader from '@/components/ui/Loader'
import {
  SERVICES, NIGERIAN_CITIES,
  SITE_STATS, BRAND_COLOR, HERO_GRADIENT, CTA_GRADIENT, BRAND_GRADIENT,
} from '@/lib/constants'
import toast from 'react-hot-toast'
import { useAppDispatch } from '@/store/hooks'
import { setQuery, setUserLocation, setResults, setHasSearched } from '@/store/searchSlice'

// ── Intersection-based reveal ─────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={className} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── Animated number counter ───────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0
      const step = to / 40
      const t = setInterval(() => {
        n += step
        if (n >= to) { setVal(to); clearInterval(t) }
        else setVal(Math.floor(n))
      }, 28)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])

  return <span ref={ref}>{val}{suffix}</span>
}

// ── Stat item type ────────────────────────────────────────────
type StatItem =
  | { icon: string; label: string; static: string }
  | { icon: string; label: string; value: number; suffix: string }

// ── Component ─────────────────────────────────────────────────
export default function HomePage() {
  const [city, setCity] = useState('')
  const [focused, setFocused] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // ── Mechanics data ───────────────────────────────────────────
  const { data: featuredRaw, isLoading: mechanicsLoading, error: mechanicsError } = useMechanics()
  const featured = useMemo(
    () => (Array.isArray(featuredRaw) ? featuredRaw : []),
    [featuredRaw]
  )
  const featuredPro = useMemo(
    () => featured.filter(m => m.plan === 'pro').slice(0, 3),
    [featured]
  )

  const { getLocation } = useGeolocation()
  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  // ── Handlers ─────────────────────────────────────────────────
  const handleCitySearch = () => {
    if (!city.trim()) {
      toast.error('Please enter a city or area')
      return
    }
    dispatch(setQuery(city))
    dispatch(setResults(
      featured.filter(m =>
        m.city.toLowerCase().includes(city.toLowerCase()) ||
        m.area?.toLowerCase().includes(city.toLowerCase())
      )
    ))
    dispatch(setHasSearched(true))
    navigate('/search')
  }

  const handleUseLocation = useCallback(async () => {
    if (!isGeolocationSupported) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('Location access requires a secure connection (HTTPS)')
      return
    }

    setIsLocating(true)

    try {
      // Permissions API check (optional)
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as const })
          if (permissionStatus.state === 'denied') {
            toast.error('Location permission denied. Please enable location access in your browser settings.')
            setIsLocating(false)
            return
          }
        } catch (_err) { /* ignore */ }
      }

      const result = await getLocation()

      if (!result.coords) {
        const errorMsg = result.error || 'Could not get your location'
        if (errorMsg.includes('denied')) toast.error('Location access denied.')
        else if (errorMsg.includes('timeout')) toast.error('Location request timed out. Please try again.')
        else toast.error(errorMsg)
        setIsLocating(false)
        return
      }

      dispatch(setUserLocation(result.coords))
      dispatch(setResults(attachDistances(featured, result.coords)))
      dispatch(setHasSearched(true))
      navigate('/search')
      toast.success('Location found! Showing nearby mechanics.')
    } catch (err) {
      console.error('Location error:', err)
      toast.error('An error occurred while getting your location')
    } finally {
      setIsLocating(false)
    }
  }, [dispatch, featured, getLocation, isGeolocationSupported, navigate])

  const handleServiceFilter = (service: string) => {
    dispatch(setQuery(service))
    dispatch(setResults(featured.filter(m => m.services.includes(service))))
    dispatch(setHasSearched(true))
    navigate('/search')
  }

  // Stats (dependent on featured.length)
  const stats: StatItem[] = [
    { icon: '🔧', value: featured.length,    suffix: '+', label: 'Mechanics' },
    { icon: '🏙️', value: SITE_STATS.cities,  suffix: '+', label: 'Cities'    },
    { icon: '⭐', static: SITE_STATS.avgRating,            label: 'Avg Rating' },
    { icon: '✓',  value: SITE_STATS.verified, suffix: '%', label: 'Verified'   },
  ]

  // ── Loading state ────────────────────────────────────────────
  if (mechanicsLoading) {
    return <Loader fullPage />
  }

  // Optional: show error if mechanics fetch failed
  if (mechanicsError) {
    // Log the error, but still show the page (fallback to empty array)
    console.error('Failed to load mechanics:', mechanicsError)
    // We can still render with empty featured array
  }

  return (
    <>
      <Helmet>
        <title>MechanicNG – Find a Trusted Mechanic Near You in Nigeria</title>
        <meta name="description" content="Nigeria's #1 mechanic directory. Find verified auto mechanics near you." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{
        background: HERO_GRADIENT,
        minHeight: 'clamp(540px, 90vh, 820px)',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 90% at 50% 0%, black 0%, transparent 100%)',
        }} />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28 text-center">

          {/* Badge */}
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-5 sm:mb-7
              text-[10px] sm:text-xs font-bold tracking-widest uppercase"
              style={{
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.25)',
                color: BRAND_COLOR,
              }}>
              🔧 Nigeria's #1 Mechanic Directory
            </span>
          </Reveal>

          {/* Headline */}
          <Reveal delay={70}>
            <h1 className="font-extrabold leading-[1.05] tracking-tight mb-4 sm:mb-5"
              style={{ fontSize: 'clamp(2rem, 9vw, 5.5rem)' }}>
              Find a Trusted<br />
              <span style={{
                background: BRAND_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Mechanic in Nigeria
              </span>
            </h1>
          </Reveal>

          {/* Subheading */}
          <Reveal delay={140}>
            <p className="text-gray-400 mb-8 sm:mb-10 leading-relaxed mx-auto max-w-lg"
              style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}>
              Browse verified mechanics and auto shops across Nigeria.
              Call, WhatsApp, get directions, or request a quote — instantly.
            </p>
          </Reveal>

          {/* Search card */}
          <Reveal delay={210}>
            <div className="rounded-2xl p-4 sm:p-5 max-w-lg mx-auto mb-8 sm:mb-10" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(10px)',
            }}>
              <div className="flex gap-2 sm:gap-3 mb-3">
                <div className="relative flex-1">
                  <input
                    className="input w-full pl-8 sm:pl-9 text-sm sm:text-base"
                    placeholder="City or area, e.g. Lekki…"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                    list="cities"
                    style={{
                      boxShadow: focused ? '0 0 0 2px rgba(249,115,22,0.4)' : 'none',
                      transition: 'box-shadow 200ms ease',
                    }}
                  />
                  <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                    📍
                  </span>
                  <datalist id="cities">
                    {NIGERIAN_CITIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <button className="btn-primary text-sm sm:text-base px-3 sm:px-5 whitespace-nowrap"
                  onClick={handleCitySearch}>
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">🔍</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span>or</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Location button */}
              <button 
                onClick={handleUseLocation} 
                disabled={isLocating || !isGeolocationSupported}
                className={`btn-outline w-full flex items-center justify-center gap-2 text-sm transition-all duration-200 ${
                  !isGeolocationSupported ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLocating ? (
                  <>
                    <span className="loader w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Getting location…</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Use my current location</span>
                  </>
                )}
              </button>
              
              {!isGeolocationSupported && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Location services not available in your browser
                </p>
              )}
            </div>
          </Reveal>

          {/* Hero ad slot */}
          <Reveal delay={260}>
            <div className="max-w-lg mx-auto mb-8 sm:mb-10">
              <AdSlot placement="homepage_hero" />
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={320}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-sm sm:max-w-none mx-auto">
              {stats.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="mb-1" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>
                    {stat.icon}
                  </div>
                  <div className="font-extrabold font-mono"
                    style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', color: BRAND_COLOR }}>
                    {'static' in stat
                      ? stat.static
                      : <Counter to={stat.value} suffix={stat.suffix} />
                    }
                  </div>
                  <div className="text-xs text-gray-500 font-semibold mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BROWSE BY SERVICE
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Reveal>
          <p className="section-title mb-1 sm:mb-2">Browse by Service</p>
          <h2 className="font-bold mb-5" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.875rem)' }}>
            What do you need fixed?
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div
            className="flex gap-2 md:flex-wrap -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {SERVICES.map(s => (
              <button key={s} onClick={() => handleServiceFilter(s)}
                className="flex-shrink-0 md:flex-shrink rounded-xl px-3 py-2 sm:px-4 sm:py-2.5
                  text-xs sm:text-sm font-semibold text-gray-300 whitespace-nowrap transition-all duration-200
                  bg-surface-800 border border-gray-800
                  hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/5">
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Mid ad slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10">
        <AdSlot placement="homepage_mid" />
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURED MECHANICS (only if there are pro mechanics)
      ══════════════════════════════════════════════════════ */}
      {featuredPro.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-14">
          <Reveal>
            <p className="section-title mb-1 sm:mb-2">Featured</p>
            <h2 className="font-bold mb-5 sm:mb-6" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.875rem)' }}>
              Top Rated Mechanics
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPro.map((m, i) => (
              <Reveal key={m.id} delay={i * 70}>
                <MechanicCard mechanic={m} className="h-full" />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          MECHANIC CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-gray-800 py-14 sm:py-16 px-4"
        style={{ background: CTA_GRADIENT }}>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />

        <Reveal>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="mb-4" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>🔩</div>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.75rem, 6vw, 2.75rem)' }}>
              Are you a mechanic?
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed max-w-md mx-auto"
              style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)' }}>
              Get discovered by thousands of Nigerian drivers daily.
              Create your free listing and start growing your customer base.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <Link to="/signup"  className="btn-primary text-center text-sm sm:text-base">
                Create Free Listing
              </Link>
              <Link to="/pricing" className="btn-outline text-center text-sm sm:text-base">
                View Plans & Pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}