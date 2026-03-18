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