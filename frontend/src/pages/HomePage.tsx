import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useMechanics } from '@/hooks/useMechanics'
import { attachDistances } from '@/lib/geo'
import MechanicCard from '@/components/mechanic/MechanicCard'
import AdSlot from '@/components/ads/AdSlot'
import { SERVICES, NIGERIAN_CITIES } from '@/lib/constants'
import { useAppDispatch } from '@/store/hooks'
import { setQuery, setUserLocation, setResults, setHasSearched } from '@/store/searchSlice'

// ── Intersection-based reveal ─────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  )
}

// ── Animated number counter ───────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0; const step = to / 40
      const t = setInterval(() => {
        n += step; if (n >= to) { setVal(to); clearInterval(t) } else setVal(Math.floor(n))
      }, 28)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val}{suffix}</span>
}

export default function HomePage() {
  const [city, setCity]         = useState('')
  const [focused, setFocused]   = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { loading: geoLoading, getLocation } = useGeolocation()
  const { data: featured = [] }              = useMechanics()
  const featuredPro = featured.filter(m => m.plan === 'pro').slice(0, 3)

  const handleCitySearch = () => {
    if (!city.trim()) return
    dispatch(setQuery(city))
    dispatch(setResults(featured.filter(m =>
      m.city.toLowerCase().includes(city.toLowerCase()) ||
      m.area?.toLowerCase().includes(city.toLowerCase())
    )))
    dispatch(setHasSearched(true))
    navigate('/search')
  }

  const handleUseLocation = async () => {
    const coords = await getLocation()
    if (coords) {
      dispatch(setUserLocation(coords))
      dispatch(setResults(attachDistances(featured, coords)))
      dispatch(setHasSearched(true))
      navigate('/search')
    }
  }

  const stats = [
    { icon: '🔧', value: featured.length, suffix: '+', label: 'Mechanics' },
    { icon: '🏙️', value: 15,              suffix: '+', label: 'Cities'    },
    { icon: '⭐', value: 0, suffix: '', label: 'Avg Rating', fixed: '4.6' },
    { icon: '✓',  value: 100, suffix: '%', label: 'Verified' },
  ]

  return (
    <>
      <Helmet>
        <title>MechanicNG – Find a Trusted Mechanic Near You in Nigeria</title>
        <meta name="description" content="Nigeria's #1 mechanic directory. Find verified auto mechanics near you." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      {/* ══════════════════════════════════════════════════════
          HERO — mobile: stacked, md: centered wide
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{
        background: `
          radial-gradient(ellipse 120% 70% at 50% -5%,  rgba(249,115,22,0.13) 0%, transparent 65%),
          radial-gradient(ellipse 50%  50% at 85%  85%, rgba(239,68,68,0.07) 0%, transparent 60%)
        `,
        minHeight: 'clamp(540px, 90vh, 820px)',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Subtle dot-grid texture */}
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
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: 'rgb(249,115,22)' }}>
              🔧 Nigeria's #1 Mechanic Directory
            </span>
          </Reveal>

          {/* Headline — fluid type, never overflows on mobile */}
          <Reveal delay={70}>
            <h1 className="font-extrabold leading-[1.05] tracking-tight mb-4 sm:mb-5"
              style={{ fontSize: 'clamp(2rem, 9vw, 5.5rem)' }}>
              Find a Trusted<br />
              <span style={{
                background: 'linear-gradient(130deg, rgb(249,115,22) 0%, rgb(239,68,68) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
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

          {/* ── Search card ── */}
          <Reveal delay={210}>
            <div className="rounded-2xl p-4 sm:p-5 max-w-lg mx-auto mb-8 sm:mb-10"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)' }}>

              {/* Input + button row */}
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
                  <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">📍</span>
                  <datalist id="cities">{NIGERIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                {/* Full label on ≥sm, icon only on xs */}
                <button className="btn-primary text-sm sm:text-base px-3 sm:px-5 whitespace-nowrap" onClick={handleCitySearch}>
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">🔍</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                <div className="flex-1 h-px bg-gray-800" /><span>or</span><div className="flex-1 h-px bg-gray-800" />
              </div>

              <button onClick={handleUseLocation} disabled={geoLoading}
                className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
                {geoLoading
                  ? <><span className="loader w-4 h-4" /> Getting location…</>
                  : <><span>📍</span> Use My Current Location</>}
              </button>
            </div>
          </Reveal>

          {/* Ad slot */}
          <Reveal delay={260}>
            <div className="max-w-lg mx-auto mb-8 sm:mb-10">
              <AdSlot placement="homepage_hero" />
            </div>
          </Reveal>

          {/* Stats — 2×2 on mobile, 4×1 on sm+ */}
          <Reveal delay={320}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-sm sm:max-w-none mx-auto">
              {stats.map(({ icon, value, suffix, label, fixed }) => (
                <div key={label} className="text-center">
                  <div className="mb-1" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>{icon}</div>
                  <div className="font-extrabold font-mono" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', color: 'rgb(249,115,22)' }}>
                    {fixed ?? <Counter to={value} suffix={suffix} />}
                  </div>
                  <div className="text-xs text-gray-500 font-semibold mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BROWSE BY SERVICE
          mobile: horizontal scroll chips
          md+: wrapping pill grid
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Reveal>
          <p className="section-title mb-1 sm:mb-2">Browse by Service</p>
          <h2 className="font-bold mb-5" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.875rem)' }}>
            What do you need fixed?
          </h2>
        </Reveal>

        {/* Mobile: horizontally scrollable. md+: wraps */}
        <Reveal delay={80}>
          <div
            className="flex gap-2 md:flex-wrap -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {SERVICES.map(s => (
              <button key={s}
                onClick={() => {
                  dispatch(setResults(featured.filter(m => m.services.includes(s))))
                  dispatch(setHasSearched(true))
                  navigate('/search')
                }}
                className="flex-shrink-0 md:flex-shrink rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm
                  font-semibold text-gray-300 whitespace-nowrap transition-all duration-200
                  bg-surface-800 border border-gray-800 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/5">
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Mid ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10">
        <AdSlot placement="homepage_mid" />
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURED MECHANICS
          mobile: 1 col, sm: 2 col, lg: 3 col
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
          mobile: stacked, sm+: side-by-side buttons
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-gray-800 py-14 sm:py-16 px-4"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(239,68,68,0.03) 100%)' }}>
        {/* Decorative glow */}
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
              Get discovered by thousands of Nigerian drivers daily. Create your free listing and start growing your customer base.
            </p>
            {/* Stacked on mobile, row on sm+ */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <a href="/signup"  className="btn-primary text-center text-sm sm:text-base">Create Free Listing</a>
              <a href="/pricing" className="btn-outline text-center text-sm sm:text-base">View Plans & Pricing</a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}