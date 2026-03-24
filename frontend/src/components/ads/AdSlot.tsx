import { useEffect, useRef, useState, useMemo } from 'react';
import { useAdSlot } from '@/hooks/useAds';
import { recordImpression } from '@/lib/api/ads';
import { BannerAd, CardAd, InlineAd, SpotlightAd } from './AdCreatives';
import AdSenseUnit from './AdSenseUnit';
import type { AdSlotProps, AdPlacement } from '@/types/ads';

const ADSENSE_SLOTS: Partial<Record<AdPlacement, string>> = {
  homepage_hero:   import.meta.env.VITE_ADSENSE_SLOT_HOME_HERO,
  homepage_mid:    import.meta.env.VITE_ADSENSE_SLOT_HOME_MID,
  search_top:      import.meta.env.VITE_ADSENSE_SLOT_SEARCH_TOP,
  search_inline:   import.meta.env.VITE_ADSENSE_SLOT_SEARCH_INLINE,
  profile_sidebar: import.meta.env.VITE_ADSENSE_SLOT_PROFILE_SIDE,
  profile_bottom:  import.meta.env.VITE_ADSENSE_SLOT_PROFILE_BOT,
  global_footer:   import.meta.env.VITE_ADSENSE_SLOT_FOOTER,
};

const ADSENSE_FORMATS: Record<AdPlacement, 'auto' | 'rectangle' | 'horizontal'> = {
  homepage_hero:   'horizontal',
  homepage_mid:    'horizontal',
  search_top:      'horizontal',
  search_inline:   'rectangle',
  profile_sidebar: 'rectangle',
  profile_bottom:  'horizontal',
  global_footer:   'horizontal',
};

// ── Animation wrapper ─────────────────────────────────────────

interface AnimatedAdProps {
  children: React.ReactNode;
  delay?: number;
}

function AnimatedAd({ children, delay = 0 }: AnimatedAdProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionProperty: 'opacity, transform',
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {visible && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'adShimmer 0.8s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 1,
              borderRadius: '16px',
            }}
          />
        )}
        {children}
      </div>

      <style>{`
        @keyframes adShimmer {
          0%   { background-position: 200% center; opacity: 1; }
          100% { background-position: -200% center; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Rotating multi‑ad carousel ────────────────────────────────

function AdCarousel({
  campaigns,
  placement,
  cityContext,
}: {
  campaigns: any[];
  placement: AdPlacement;
  cityContext?: string;
}) {
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (safeCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % safeCampaigns.length);
        setFading(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [safeCampaigns.length]);

  const campaign = safeCampaigns[current];
  if (!campaign) return null;

  return (
    <div
      style={{
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
    >
      {campaign.format === 'banner' && (
        <BannerAd campaign={campaign} placement={placement} cityContext={cityContext} />
      )}
      {campaign.format === 'card' && (
        <CardAd campaign={campaign} placement={placement} cityContext={cityContext} />
      )}
      {campaign.format === 'inline' && (
        <InlineAd campaign={campaign} placement={placement} cityContext={cityContext} />
      )}
      {campaign.format === 'spotlight' && (
        <SpotlightAd campaign={campaign} placement={placement} cityContext={cityContext} />
      )}

      {safeCampaigns.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
          {safeCampaigns.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setFading(true);
                setTimeout(() => {
                  setCurrent(i);
                  setFading(false);
                }, 300);
              }}
              style={{
                width: i === current ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === current ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdSlot ───────────────────────────────────────────────

export default function AdSlot({ placement, cityContext, className = '', adsenseSlotId }: AdSlotProps) {
  const { ads: rawAds = [], isLoading } = useAdSlot(placement, cityContext);
  // ✅ Stabilize campaigns reference to avoid unnecessary effect re-runs
  const campaigns = useMemo(() => (Array.isArray(rawAds) ? rawAds : []), [rawAds]);
  const impressionFired = useRef<Set<string>>(new Set());

  useEffect(() => {
    campaigns.forEach((c) => {
      if (c?.id && !impressionFired.current.has(c.id)) {
        impressionFired.current.add(c.id);
        // ✅ Wrap in Promise.resolve to handle both void and Promise returns
        Promise.resolve(recordImpression(c.id)).catch(() => {});
      }
    });
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className={className}>
        <div
          style={{
            height: '90px',
            borderRadius: '16px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes skeletonPulse {
              0%   { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Render custom campaigns if available
  if (campaigns.length > 0) {
    return (
      <AnimatedAd>
        <div key={`custom-${placement}`} className={className}>
          <AdCarousel campaigns={campaigns} placement={placement} cityContext={cityContext} />
        </div>
      </AnimatedAd>
    );
  }

  const slotId = adsenseSlotId ?? ADSENSE_SLOTS[placement];
  if (slotId) {
    return (
      <AnimatedAd>
        <div key={`adsense-${slotId}`} className={className}>
          <AdSenseUnit
            slotId={slotId}
            format={ADSENSE_FORMATS[placement] ?? 'auto'}
            className="min-h-[90px]"
          />
        </div>
      </AnimatedAd>
    );
  }

  return null;
}

// ── SearchResultsWithAds ──────────────────────────────────────

interface SearchAdsProps {
  children: React.ReactNode[];
  cityContext?: string;
  injectEvery?: number;
}

export function SearchResultsWithAds({
  children,
  cityContext,
  injectEvery = 5,
}: SearchAdsProps) {
  const { ads: rawAds = [] } = useAdSlot('search_inline', cityContext);
  const campaigns = Array.isArray(rawAds) ? rawAds : [];
  const inlineSlotId = ADSENSE_SLOTS['search_inline'];

  const isValidAdSense = inlineSlotId && /^\d+$/.test(inlineSlotId);

  let adIndex = 0;
  const result: React.ReactNode[] = [];

  children.forEach((child, i) => {
    result.push(child);

    if ((i + 1) % injectEvery === 0) {
      if (campaigns[adIndex]) {
        const campaign = campaigns[adIndex];
        result.push(
          <AnimatedAd key={`internal-ad-${campaign.id}-${i}`} delay={100}>
            <CardAd campaign={campaign} placement="search_inline" cityContext={cityContext} />
          </AnimatedAd>
        );
        adIndex++;
      } else if (isValidAdSense) {
        const format = ADSENSE_FORMATS['search_inline'] ?? 'rectangle';
        result.push(
          <AnimatedAd key={`adsense-inline-${i}`} delay={100}>
            <div className="rounded-2xl overflow-hidden bg-white/5">
              <AdSenseUnit
                slotId={inlineSlotId as string}
                format={format}
                className="min-h-[200px]"
              />
            </div>
          </AnimatedAd>
        );
      }
    }
  });

  return <>{result}</>;
}