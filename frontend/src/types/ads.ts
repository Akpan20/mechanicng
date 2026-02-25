// ─────────────────────────────────────────────────────────────
// MechanicNG Advertising System – Type Definitions
// ─────────────────────────────────────────────────────────────

export type AdFormat = 'banner' | 'card' | 'inline' | 'spotlight'

export type AdPlacement =
  | 'homepage_hero'
  | 'homepage_mid'
  | 'search_top'
  | 'search_inline'
  | 'profile_sidebar'
  | 'profile_bottom'
  | 'global_footer'

// 'active'   = approved + currently serving
// 'approved' = approved but start_date not yet reached
// 'ended'    = past end_date
export type AdStatus =
  | 'pending'
  | 'active'
  | 'approved'
  | 'paused'
  | 'rejected'
  | 'expired'
  | 'ended'

export type BillingType = 'flat' | 'cpm' | 'cpc'

export interface Advertiser {
  id: string
  businessName: string
  contactName: string
  email: string
  phone: string
  website?: string
  industry?: string
  notes?: string
  createdAt: string
  updateAt: string
}

export interface AdCampaign {
  id: string
  advertiser_id: string

  // Identity
  name: string
  status: AdStatus
  format: AdFormat
  placements: AdPlacement[]

  // Creative — canonical fields
  headline: string
  body_text?: string
  cta_label: string
  cta_url: string
  image_url?: string
  logo_url?: string
  background_color: string
  accent_color: string

  // Aliases used in AdminAdsPanel (map to canonical fields on save)
  subtext?: string     // alias of body_text
  cta_text?: string    // alias of cta_label
  bg_color?: string    // alias of background_color
  budget_ngn?: number  // alias of budget_cap

  // Targeting
  target_cities: string[]
  target_services: string[]

  // Schedule
  start_date: string
  end_date: string

  // Pricing
  price_naira: number
  billing_type: BillingType
  cpm_rate?: number
  cpc_rate?: number
  budget_cap?: number

  // Stats
  impressions: number
  clicks: number

  // Admin
  admin_notes?: string
  approved_by?: string
  approved_at?: string

  created_at: string
  updated_at: string

  // Joined from advertisers table
  advertiser?: Advertiser
}

// Returned by getRevenueSummary() for the admin dashboard KPI cards
export interface AdAdminStats {
  revenue_this_month: number
  total_impressions: number
  total_clicks: number
  active_campaigns: number
  total_advertisers: number
  pending_approval: number
}

// Per-row shape from the ad_revenue_summary Postgres view
export interface AdRevenueSummary {
  id: string
  name: string
  advertiser: string
  format: AdFormat
  status: AdStatus
  start_date: string
  end_date: string
  total_billed: number
  billing_type: BillingType
  impressions: number
  clicks: number
  ctr_pct: number
  effective_cpc: number
  created_at: string
}

// Props for the AdSlot component
export interface AdSlotProps {
  placement: AdPlacement
  cityContext?: string
  serviceContext?: string
  className?: string
  adsenseSlotId?: string
  adsenseFormat?: string
}

// Form data for creating/editing a campaign
export interface CampaignFormData {
  advertiser_id: string
  name: string
  format: AdFormat
  placements: AdPlacement[]
  headline: string
  body_text: string
  cta_label: string
  cta_url: string
  image_url: string
  logo_url: string
  background_color: string
  accent_color: string
  target_cities: string[]
  target_services: string[]
  start_date: string
  end_date: string
  price_nairа: number
  billing_type: BillingType
  cpm_rate: number
  cpc_rate: number
  budget_cap: number
  admin_notes: string
}