import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMechanics } from '@/hooks/useMechanics'
import MechanicCard from '@/components/mechanic/MechanicCard'
import AdSlot from '@/components/ads/AdSlot'
import {
  SERVICES, SITE_STATS, BRAND_COLOR, HERO_GRADIENT, CTA_GRADIENT, BRAND_GRADIENT,
} from '@/lib/constants'
import { useAppDispatch } from '@/store/hooks'
import { setQuery, setResults, setHasSearched } from '@/store/searchSlice'

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

type StatItem =
  | { icon: string; label: string; static: string }
  | { icon: string; label: string; value: number; suffix: string }

export default function HomePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { data: featured = [] } = useMechanics()
  const featuredPro = featured.filter(m => m.plan === 'pro').slice(0, 3)

  const handleServiceFilter = (service: string) => {
    dispatch(setQuery(service))
    dispatch(setResults(featured.filter(m => m.services.includes(service))))
    dispatch(setHasSearched(true))
    navigate('/search')
  }

  const stats: StatItem[] = [
    { icon: '🔧', value: featured.length,     suffix: '+', label: 'Mechanics' },
    { icon: '🏙️', value: SITE_STATS.cities,   suffix: '+', label: 'Cities'    },
    { icon: '⭐', static: SITE_STATS.avgRating,             label: 'Avg Rating' },
    { icon: '✓',  value: SITE_STATS.verified,  suffix: '%', label: 'Verified'   },
  ]

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
        minHeight: 'clamp(480px, 80vh, 720px)',
        display: 'flex',
        alignItems: 'center',
      }}>
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

          {/* CTA buttons */}
          <Reveal delay={210}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-sm mx-auto mb-8 sm:mb-10">
              <Link to="/search" className="btn-primary text-center text-sm sm:text-base flex items-center justify-center gap-2">
                🔍 Find a Mechanic
              </Link>
              <Link to="/search" className="btn-outline text-center text-sm sm:text-base flex items-center justify-center gap-2">
                🗺️ View on Map
              </Link>
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
          FEATURED MECHANICS
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