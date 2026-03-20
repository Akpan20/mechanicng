// components/ads/AdSenseUnit.tsx
import { useEffect, useRef } from 'react';

interface Props {
  slotId: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;

export default function AdSenseUnit({
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: Props) {
  const insRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Skip if publisher ID missing or slot ID empty
    if (!PUBLISHER_ID || !slotId?.trim()) {
      if (import.meta.env.DEV && !PUBLISHER_ID) {
        console.warn('[AdSense] Missing VITE_ADSENSE_PUBLISHER_ID');
      }
      if (import.meta.env.DEV && !slotId?.trim()) {
        console.warn('[AdSense] Missing slotId');
      }
      return;
    }

    // Push only once
    if (initialized.current) return;
    initialized.current = true;

    const pushAd = () => {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (err) {
        if (import.meta.env.DEV) console.error('[AdSense] push error:', err);
      }
    };

    // Ensure DOM is ready
    Promise.resolve().then(pushAd);
  }, [slotId]); // re‑run if slotId changes (uncommon)

  // Dev placeholder when publisher ID missing
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
      );
    }
    return null;
  }

  // Optional: validate slot ID (should be numeric)
  if (import.meta.env.DEV && !/^\d+$/.test(slotId.trim())) {
    console.warn(`[AdSense] Invalid slot ID: "${slotId}". Must be numeric.`);
  }

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slotId.trim()}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}