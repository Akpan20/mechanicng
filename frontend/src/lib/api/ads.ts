import { api } from './client'
import type { AdCampaign, AdAdminStats, Advertiser, AdPlacement, AdStatus, CampaignFormData } from '@/types/ads'

// ─── Field mapping helper ─────────────────────────────────────

function toBackendPayload(data: Partial<CampaignFormData>) {
  return {
    advertiserId:    data.advertiser_id,
    name:            data.name,
    format:          data.format,
    placements:      data.placements,
    headline:        data.headline,
    bodyText:        data.body_text,
    ctaLabel:        data.cta_label,
    ctaUrl:          data.cta_url,
    imageUrl:        data.image_url,
    logoUrl:         data.logo_url,
    backgroundColor: data.background_color,
    accentColor:     data.accent_color,
    targetCities:    data.target_cities,
    targetServices:  data.target_services,
    startDate:       data.start_date,
    endDate:         data.end_date,
    priceNgn:        data.price_naira,
    billingType:     data.billing_type,
    cpmRate:         data.cpm_rate,
    cpcRate:         data.cpc_rate,
    budgetCap:       data.budget_cap,
    adminNotes:      data.admin_notes,
  }
}

// ─── Public ───────────────────────────────────────────────────

export async function getAdsForPlacement(placement: AdPlacement, cityContext?: string, limit = 3): Promise<AdCampaign[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cityContext) params.set('city', cityContext)
  return api.get<AdCampaign[]>(`/api/ads/placement/${placement}?${params}`)
}

export function recordImpression(campaignId: string): void {
  api.post('/api/ads/impression', { campaignId }).catch(() => {})
}

export async function recordClick(campaignId: string): Promise<void> {
  await api.post('/api/ads/click', { campaignId })
}

// ─── Admin: Campaigns ─────────────────────────────────────────

export async function getAllCampaigns(): Promise<AdCampaign[]> {
  return api.get<AdCampaign[]>('/api/ads/admin/campaigns')
}

export const getAllCampaignsAdmin = getAllCampaigns

export async function createCampaign(payload: CampaignFormData): Promise<AdCampaign> {
  return api.post<AdCampaign>('/api/ads/admin/campaigns', toBackendPayload(payload))
}

export async function updateCampaign(id: string, updates: Partial<CampaignFormData>): Promise<AdCampaign> {
  return api.patch<AdCampaign>(`/api/ads/admin/campaigns/${id}`, toBackendPayload(updates))
}

export async function updateCampaignStatus(id: string, status: AdStatus): Promise<void> {
  await api.patch(`/api/ads/admin/campaigns/${id}/status`, { status })
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/api/ads/admin/campaigns/${id}`)
}

// ─── Admin: Advertisers ───────────────────────────────────────

export async function getAllAdvertisers(): Promise<Advertiser[]> {
  return api.get<Advertiser[]>('/api/ads/admin/advertisers')
}

export async function createAdvertiser(payload: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>): Promise<Advertiser> {
  return api.post<Advertiser>('/api/ads/admin/advertisers', payload)
}

export async function updateAdvertiser(
  id: string,
  updates: Partial<Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>>
): Promise<Advertiser> {
  return api.patch<Advertiser>(`/api/ads/admin/advertisers/${id}`, updates)
}

export async function deleteAdvertiser(id: string): Promise<void> {
  await api.delete(`/api/ads/admin/advertisers/${id}`)
}

// ─── Admin: Stats ─────────────────────────────────────────────

export async function getRevenueSummary(): Promise<AdAdminStats> {
  return api.get<AdAdminStats>('/api/ads/admin/stats')
}