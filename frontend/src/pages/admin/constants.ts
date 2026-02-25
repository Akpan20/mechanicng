import type { AdFormat, AdPlacement } from '@/types/ads'
import { NIGERIAN_CITIES as BASE_CITIES } from '@/lib/constants'

// Re-export so admin components import from one place
export { BASE_CITIES as NIGERIAN_CITIES }

export interface FormatOption {
  value: AdFormat
  label: string
  desc: string
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'spotlight', label: '🌟 Spotlight', desc: 'Large hero feature (homepage only)' },
  { value: 'banner',    label: '📰 Banner',    desc: 'Full-width leaderboard strip' },
  { value: 'card',      label: '🃏 Card',      desc: 'Sponsored card in search results' },
  { value: 'inline',    label: '▬ Inline',    desc: 'Compact text + image row' },
]

export interface PlacementOption {
  value: AdPlacement
  label: string
}

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  { value: 'homepage_hero',   label: 'Homepage — Hero section' },
  { value: 'homepage_mid',    label: 'Homepage — Mid section' },
  { value: 'search_top',      label: 'Search Results — Top' },
  { value: 'search_inline',   label: 'Search Results — Between cards' },
  { value: 'profile_sidebar', label: 'Mechanic Profile — Sidebar' },
  { value: 'profile_bottom',  label: 'Mechanic Profile — Bottom' },
  { value: 'global_footer',   label: 'Global — Footer' },
]

export const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-400',
  active:   'bg-emerald-500/20 text-emerald-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  paused:   'bg-blue-500/20 text-blue-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired:  'bg-gray-700 text-gray-400',
  ended:    'bg-gray-700 text-gray-400',
}