import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createSelector } from '@reduxjs/toolkit'
import {
  getAdsForPlacement,
  getAllCampaigns,
  getAllAdvertisers,
  getRevenueSummary,
  updateCampaignStatus,
  deleteCampaign,
  deleteAdvertiser,
} from '@/lib/api/ads'
import type { AdCampaign, AdStatus, AdAdminStats, Advertiser, AdPlacement } from '@/types/ads'
import type { RootState } from '@/store'

// ─── State ────────────────────────────────────────────────────

interface AdsState {
  slots: Record<string, AdCampaign[]>
  slotsLoading: Record<string, boolean>
  campaigns: AdCampaign[]
  campaignsLoading: boolean
  advertisers: Advertiser[]
  advertisersLoading: boolean
  stats: AdAdminStats | null
  statsLoading: boolean
  error: string | null
}

const initialState: AdsState = {
  slots:              {},
  slotsLoading:       {},
  campaigns:          [],
  campaignsLoading:   false,
  advertisers:        [],
  advertisersLoading: false,
  stats:              null,
  statsLoading:       false,
  error:              null,
}

// ─── Thunks ───────────────────────────────────────────────────

export const fetchAdSlot = createAsyncThunk(
  'ads/fetchAdSlot',
  async ({ placement, city }: { placement: AdPlacement; city?: string }) => {
    const ads = await getAdsForPlacement(placement, city)
    return { key: `${placement}:${city ?? ''}`, ads }
  }
)

export const fetchAllCampaigns = createAsyncThunk(
  'ads/fetchAllCampaigns',
  async () => getAllCampaigns()
)

export const fetchAllAdvertisers = createAsyncThunk(
  'ads/fetchAllAdvertisers',
  async () => getAllAdvertisers()
)

export const fetchAdStats = createAsyncThunk(
  'ads/fetchAdStats',
  async () => getRevenueSummary()
)

export const changeCampaignStatus = createAsyncThunk(
  'ads/changeCampaignStatus',
  async ({ id, status }: { id: string; status: AdStatus }) => {
    await updateCampaignStatus(id, status)
    return { id, status }
  }
)

export const removeCampaign = createAsyncThunk(
  'ads/removeCampaign',
  async (id: string) => {
    await deleteCampaign(id)
    return id
  }
)

export const removeAdvertiser = createAsyncThunk(
  'ads/removeAdvertiser',
  async (id: string) => {
    await deleteAdvertiser(id)
    return id
  }
)

// ─── Slice ────────────────────────────────────────────────────

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    incrementImpression(state, action: PayloadAction<string>) {
      const campaign = state.campaigns.find(c => c.id === action.payload)
      if (campaign) campaign.impressions += 1
    },
    incrementClick(state, action: PayloadAction<string>) {
      const campaign = state.campaigns.find(c => c.id === action.payload)
      if (campaign) campaign.clicks += 1
    },
    clearError(state) {
      state.error = null
    },
    upsertCampaign(state, action: PayloadAction<AdCampaign>) {
      const idx = state.campaigns.findIndex(c => c.id === action.payload.id)
      if (idx >= 0) state.campaigns[idx] = action.payload
      else state.campaigns.unshift(action.payload)
    },
    upsertAdvertiser(state, action: PayloadAction<Advertiser>) {
      const idx = state.advertisers.findIndex(a => a.id === action.payload.id)
      if (idx >= 0) state.advertisers[idx] = action.payload
      else state.advertisers.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    // ── fetchAdSlot ───────────────────────────────────────────
    builder
      .addCase(fetchAdSlot.pending, (state, { meta }) => {
        const key = `${meta.arg.placement}:${meta.arg.city ?? ''}`
        state.slotsLoading[key] = true
      })
      .addCase(fetchAdSlot.fulfilled, (state, { payload }) => {
        state.slots[payload.key]        = payload.ads
        state.slotsLoading[payload.key] = false
      })
      .addCase(fetchAdSlot.rejected, (state, { meta, error }) => {
        const key = `${meta.arg.placement}:${meta.arg.city ?? ''}`
        state.slotsLoading[key] = false
        state.error = error.message ?? 'Failed to load ads'
      })

    // ── fetchAllCampaigns ─────────────────────────────────────
    builder
      .addCase(fetchAllCampaigns.pending,   (state) => { state.campaignsLoading = true })
      .addCase(fetchAllCampaigns.fulfilled, (state, { payload }) => {
        state.campaigns        = payload
        state.campaignsLoading = false
      })
      .addCase(fetchAllCampaigns.rejected,  (state, { error }) => {
        state.campaignsLoading = false
        state.error = error.message ?? 'Failed to load campaigns'
      })

    // ── fetchAllAdvertisers ───────────────────────────────────
    builder
      .addCase(fetchAllAdvertisers.pending,   (state) => { state.advertisersLoading = true })
      .addCase(fetchAllAdvertisers.fulfilled, (state, { payload }) => {
        state.advertisers        = payload
        state.advertisersLoading = false
      })
      .addCase(fetchAllAdvertisers.rejected,  (state, { error }) => {
        state.advertisersLoading = false
        state.error = error.message ?? 'Failed to load advertisers'
      })

    // ── fetchAdStats ──────────────────────────────────────────
    builder
      .addCase(fetchAdStats.pending,   (state) => { state.statsLoading = true })
      .addCase(fetchAdStats.fulfilled, (state, { payload }) => {
        state.stats        = payload
        state.statsLoading = false
      })
      .addCase(fetchAdStats.rejected,  (state, { error }) => {
        state.statsLoading = false
        state.error = error.message ?? 'Failed to load stats'
      })

    // ── changeCampaignStatus ──────────────────────────────────
    builder.addCase(changeCampaignStatus.fulfilled, (state, { payload }) => {
      const c = state.campaigns.find(x => x.id === payload.id)
      if (c) c.status = payload.status
    })

    // ── removeCampaign ────────────────────────────────────────
    builder.addCase(removeCampaign.fulfilled, (state, { payload: id }) => {
      state.campaigns = state.campaigns.filter(c => c.id !== id)
    })

    // ── removeAdvertiser ──────────────────────────────────────
    builder.addCase(removeAdvertiser.fulfilled, (state, { payload: id }) => {
      state.advertisers = state.advertisers.filter(a => a.id !== id)
      state.campaigns   = state.campaigns.filter(c => c.advertiser_id !== id)
    })
  },
})

export const {
  incrementImpression,
  incrementClick,
  clearError,
  upsertCampaign,
  upsertAdvertiser,
} = adsSlice.actions

export default adsSlice.reducer

// ─── Selectors (memoized) ────────────────────────────────────

const selectSlots        = (state: RootState) => state.ads?.slots        ?? {}
const selectSlotsLoading = (state: RootState) => state.ads?.slotsLoading ?? {}

export const selectAdSlot = createSelector(
  [
    selectSlots,
    (_state: RootState, placement: AdPlacement) => placement,
    (_state: RootState, _placement: AdPlacement, city?: string) => city,
  ],
  (slots, placement, city) => {
    const key = `${placement}:${city ?? ''}`
    return slots[key] ?? []
  }
)

export const selectSlotLoading = createSelector(
  [
    selectSlotsLoading,
    (_state: RootState, placement: AdPlacement) => placement,
    (_state: RootState, _placement: AdPlacement, city?: string) => city,
  ],
  (slotsLoading, placement, city) => {
    const key = `${placement}:${city ?? ''}`
    return slotsLoading[key] ?? false
  }
)


export const selectAllCampaigns     = (state: RootState) => state.ads?.campaigns        ?? []
export const selectCampaignsLoading = (state: RootState) => state.ads?.campaignsLoading ?? false
export const selectAllAdvertisers   = (state: RootState) => state.ads?.advertisers       ?? []
export const selectAdStats          = (state: RootState) => state.ads?.stats             ?? null
export const selectAdsError         = (state: RootState) => state.ads?.error             ?? null