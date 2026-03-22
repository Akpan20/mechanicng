import type { Plan, PlanId } from '@/types'
import type { AdStatus } from '@/types/ads'

export const SERVICES = [
  'Oil Change', 'Brake Repair', 'Tire Change', 'Engine Repair',
  'Electrical', 'AC Repair', 'Suspension', 'Transmission',
  'Battery Replacement', 'Wheel Alignment', 'Body Work', 'Diagnostics',
  'Clutch Repair', 'Exhaust System', 'Fuel System', 'Radiator',
]

export const NIGERIAN_CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Benin City',
  'Enugu', 'Kaduna', 'Owerri', 'Warri', 'Uyo', 'Calabar', 'Ilorin',
  'Abeokuta', 'Asaba', 'Akure', 'Bauchi', 'Maiduguri', 'Jos', 'Sokoto',
]

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceNGN: 0,
    paystackPlanCode: '',
    features: [
      'Basic listing profile',
      'Phone number displayed',
      'Appear in city search',
      '1 service category',
      'Standard search ranking',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceNGN: 2500,
    paystackPlanCode: 'PLN_g3l6r7yijv7wt8j',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      'Up to 8 photos',
      'WhatsApp button',
      'Up to 8 service categories',
      'Customer reviews & ratings',
      'Priority city ranking',
      'Quote inbox (20/month)',
      'Business hours display',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceNGN: 6000,
    paystackPlanCode: 'PLN_pro_mechanicng',
    badge: 'Best Value',
    features: [
      'Everything in Standard',
      'Unlimited photos',
      'Verified badge',
      'Top of search results',
      'Unlimited quote inbox',
      'Analytics dashboard',
      'Homepage featured listing',
      'Unlimited service categories',
      'Priority support',
      'Social media sharing tools',
    ],
  },
]

export const PLAN_COLORS: Record<PlanId, string> = {
  free: '#6b7280',
  standard: '#f97316',
  pro: '#10b981',
}

export const PRICE_LABELS = {
  low: '₦ Budget',
  mid: '₦₦ Mid-Range',
  high: '₦₦₦ Premium',
}

export const MECHANIC_TYPE_LABELS = {
  shop: '🏪 Auto Shop',
  mobile: '🚗 Mobile Mechanic',
}

export const STATUS_COLORS: Record<AdStatus, string> = {
  pending:  'bg-amber-500/20 text-amber-400',
  active:   'bg-emerald-500/20 text-emerald-400',
  paused:   'bg-blue-500/20 text-blue-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired:  'bg-gray-700 text-gray-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  ended:    'bg-gray-700 text-gray-400',
}

export const CONSENT_KEY = 'mechanicng_cookie_consent'
export type ConsentState = 'accepted' | 'declined' | null
export function getConsent(): ConsentState {
  return localStorage.getItem(CONSENT_KEY) as ConsentState
}

// src/lib/constants.ts — add at the bottom
export const SITE_STATS = {
  cities:    15,
  avgRating: '4.6',
  verified:  100,
} as const

export const BRAND_COLOR      = 'rgb(249,115,22)'
export const BRAND_COLOR_DARK = 'rgb(239,68,68)'

export const HERO_GRADIENT = `
  radial-gradient(ellipse 120% 70% at 50% -5%,  rgba(249,115,22,0.13) 0%, transparent 65%),
  radial-gradient(ellipse 50%  50% at 85%  85%, rgba(239,68,68,0.07)  0%, transparent 60%)
`
export const CTA_GRADIENT = 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(239,68,68,0.03) 100%)'
export const BRAND_GRADIENT = 'linear-gradient(130deg, rgb(249,115,22) 0%, rgb(239,68,68) 100%)'

export const DEFAULT_MAP_CENTER = { lat: 9.0765, lng: 7.3986 }
export const DEFAULT_MAP_ZOOM   = 12
export const DEFAULT_LOCATION_LABEL = 'Abuja'

export const GEO_TIMEOUT_MS       = 10000
export const GEO_FALLBACK_LABEL   = 'Abuja'