import { useCallback } from 'react'
import { recordClick } from '@/lib/api/ads'
import type { AdCampaign, AdPlacement } from '@/types/ads'

// ─────────────────────────────────────────────────────────────
// Individual ad creative renderers
// One component per format: Banner, Card, Inline, Spotlight
// ─────────────────────────────────────────────────────────────

interface CreativeProps {
  campaign: AdCampaign
  placement: AdPlacement
  cityContext?: string
}

// Shared click handler
function useAdClick(campaign: AdCampaign, placement: AdPlacement, cityContext?: string) {
  return useCallback(() => {
    recordClick(campaign.id, placement, cityContext)
    window.open(campaign.cta_url, '_blank', 'noopener,noreferrer')
  }, [campaign.id, campaign.cta_url, placement, cityContext])
}

// ─── 1. BANNER AD ────────────────────────────────────────────
// Full-width leaderboard — sits above/below content sections
export function BannerAd({ campaign, placement, cityContext }: CreativeProps) {
  const handleClick = useAdClick(campaign, placement, cityContext)

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="relative w-full rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
      style={{
        background: campaign.image_url
          ? `url(${campaign.image_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${campaign.background_color}, ${campaign.accent_color}20)`,
        minHeight: 90,
        border: `1px solid ${campaign.accent_color}30`,
      }}
      aria-label={`Sponsored: ${campaign.headline}`}
    >
      {/* Overlay for text readability on image banners */}
      {campaign.image_url && (
        <div className="absolute inset-0" style={{ background: `${campaign.background_color}CC` }} />
      )}

      <div className="relative flex items-center gap-4 px-6 py-4 h-full">
        {campaign.logo_url && (
          <img src={campaign.logo_url} alt={campaign.headline} className="h-10 w-10 rounded-lg object-contain flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{campaign.headline}</p>
          {campaign.body_text && <p className="text-sm text-white/70 truncate">{campaign.body_text}</p>}
        </div>
        <button
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all group-hover:brightness-110"
          style={{ background: campaign.accent_color, color: '#fff' }}
        >
          {campaign.cta_label}
        </button>
        <AdLabel />
      </div>
    </div>
  )
}

// ─── 2. CARD AD ──────────────────────────────────────────────
// Sponsored card that visually resembles a mechanic listing
// Drops between organic search results (every Nth card)
export function CardAd({ campaign, placement, cityContext }: CreativeProps) {
  const handleClick = useAdClick(campaign, placement, cityContext)

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
      style={{
        background: campaign.background_color,
        border: `1.5px solid ${campaign.accent_color}50`,
      }}
      aria-label={`Sponsored: ${campaign.headline}`}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${campaign.accent_color}, ${campaign.accent_color}60)` }} />

      {campaign.image_url && (
        <div className="h-36 overflow-hidden">
          <img src={campaign.image_url} alt={campaign.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {campaign.logo_url ? (
            <img src={campaign.logo_url} alt="" className="w-11 h-11 rounded-xl object-contain flex-shrink-0 bg-white/5 p-1" />
          ) : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: campaign.accent_color + '20' }}>📢</div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white leading-tight">{campaign.headline}</h3>
            {campaign.body_text && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{campaign.body_text}</p>}
          </div>
        </div>

        <button
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${campaign.accent_color}, ${campaign.accent_color}cc)`, color: '#fff' }}
        >
          {campaign.cta_label} →
        </button>
      </div>

      <AdLabel absolute />
    </div>
  )
}

// ─── 3. INLINE AD ────────────────────────────────────────────
// Compact text + optional image row — fits between list items
export function InlineAd({ campaign, placement, cityContext }: CreativeProps) {
  const handleClick = useAdClick(campaign, placement, cityContext)

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="relative flex items-center gap-4 rounded-xl px-5 py-4 cursor-pointer group transition-all duration-200 hover:shadow-lg"
      style={{
        background: campaign.background_color,
        border: `1px solid ${campaign.accent_color}40`,
      }}
      aria-label={`Sponsored: ${campaign.headline}`}
    >
      {campaign.image_url ? (
        <img src={campaign.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      ) : campaign.logo_url ? (
        <img src={campaign.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain flex-shrink-0 bg-white/5 p-1.5" />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: campaign.accent_color + '20' }}>📢</div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{campaign.headline}</p>
        {campaign.body_text && <p className="text-xs text-gray-400 mt-0.5 truncate">{campaign.body_text}</p>}
      </div>

      <button
        className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
        style={{ background: campaign.accent_color, color: '#fff' }}
      >
        {campaign.cta_label}
      </button>

      <AdLabel />
    </div>
  )
}

// ─── 4. SPOTLIGHT AD ─────────────────────────────────────────
// Large hero-area feature unit for homepage — max visual impact
export function SpotlightAd({ campaign, placement, cityContext }: CreativeProps) {
  const handleClick = useAdClick(campaign, placement, cityContext)

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
      style={{
        minHeight: 220,
        background: campaign.image_url
          ? `url(${campaign.image_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${campaign.background_color} 0%, ${campaign.accent_color}30 100%)`,
        border: `1.5px solid ${campaign.accent_color}40`,
      }}
      aria-label={`Sponsored: ${campaign.headline}`}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)' }} />

      {/* Accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${campaign.accent_color}, transparent)` }} />

      <div className="relative p-8 flex flex-col justify-between h-full" style={{ minHeight: 220 }}>
        <div>
          {campaign.logo_url && (
            <img src={campaign.logo_url} alt="" className="h-10 mb-4 object-contain" />
          )}
          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">{campaign.headline}</h2>
          {campaign.body_text && <p className="text-white/80 text-base leading-relaxed max-w-lg">{campaign.body_text}</p>}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            className="px-6 py-3 rounded-xl font-bold text-base transition-all hover:brightness-110 hover:scale-105"
            style={{ background: campaign.accent_color, color: '#fff' }}
          >
            {campaign.cta_label} →
          </button>
          <span className="text-white/50 text-sm hidden sm:block">Sponsored</span>
        </div>
      </div>

      <AdLabel absolute />
    </div>
  )
}

// ─── Shared "Ad" label ───────────────────────────────────────
function AdLabel({ absolute }: { absolute?: boolean }) {
  return (
    <div className={`${absolute ? 'absolute top-2 right-2' : ''} flex-shrink-0`}>
      <span className="bg-black/60 backdrop-blur-sm text-white/60 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
        Ad
      </span>
    </div>
  )
}
