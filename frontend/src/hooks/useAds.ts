import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import {
  fetchAdSlot,
  fetchAllCampaigns,
  fetchAllAdvertisers,
  fetchAdStats,
  changeCampaignStatus,
  removeCampaign,
  removeAdvertiser,
  upsertCampaign,
  upsertAdvertiser,
  selectAdSlot,
  selectSlotLoading,
  selectAllCampaigns,
  selectCampaignsLoading,
  selectAllAdvertisers,
  selectAdStats,
  selectAdsError,
} from '@/store/adsSlice'
import { createCampaign, updateCampaign, createAdvertiser, updateAdvertiser } from '@/lib/api/ads'
import type { AdPlacement, AdStatus, CampaignFormData, Advertiser } from '@/types/ads'
import toast from 'react-hot-toast'

// ─── Public: ad slot rendering ────────────────────────────────

export function useAdSlot(placement: AdPlacement, cityContext?: string) {
  const dispatch  = useDispatch<AppDispatch>()
  const ads       = useSelector((state: RootState) => selectAdSlot(state, placement, cityContext))
  const isLoading = useSelector((state: RootState) => selectSlotLoading(state, placement, cityContext))

  useEffect(() => {
    dispatch(fetchAdSlot({ placement, city: cityContext }))
  }, [dispatch, placement, cityContext])

  return { ads, isLoading }
}

// ─── Admin: campaigns ─────────────────────────────────────────

export function useAllCampaigns() {
  const dispatch  = useDispatch<AppDispatch>()
  const campaigns = useSelector(selectAllCampaigns)
  const isLoading = useSelector(selectCampaignsLoading)

  useEffect(() => { dispatch(fetchAllCampaigns()) }, [dispatch])

  return { campaigns, isLoading }
}

export function useCreateCampaign() {
  const dispatch = useDispatch<AppDispatch>()
  return async (payload: CampaignFormData) => {
    try {
      const campaign = await createCampaign(payload)
      dispatch(upsertCampaign(campaign))
      toast.success('Campaign created!')
      return campaign
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

export function useUpdateCampaign() {
  const dispatch = useDispatch<AppDispatch>()
  return async (id: string, updates: Partial<CampaignFormData>) => {
    try {
      const campaign = await updateCampaign(id, updates)
      dispatch(upsertCampaign(campaign))
      toast.success('Campaign updated!')
      return campaign
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

export function useUpdateCampaignStatus() {
  const dispatch = useDispatch<AppDispatch>()
  return async (id: string, status: AdStatus) => {
    try {
      await dispatch(changeCampaignStatus({ id, status })).unwrap()
      toast.success(`Campaign ${status}.`)
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

export function useDeleteCampaign() {
  const dispatch = useDispatch<AppDispatch>()
  return async (id: string) => {
    try {
      await dispatch(removeCampaign(id)).unwrap()
      toast.success('Campaign deleted.')
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

// ─── Admin: advertisers ───────────────────────────────────────

export function useAllAdvertisers() {
  const dispatch    = useDispatch<AppDispatch>()
  const advertisers = useSelector(selectAllAdvertisers)

  useEffect(() => { dispatch(fetchAllAdvertisers()) }, [dispatch])

  return { advertisers }
}

export function useCreateAdvertiser() {
  const dispatch = useDispatch<AppDispatch>()
  return async (payload: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const advertiser = await createAdvertiser(payload)
      dispatch(upsertAdvertiser(advertiser))
      toast.success('Advertiser added!')
      return advertiser
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

export function useUpdateAdvertiser() {
  const dispatch = useDispatch<AppDispatch>()
  return async (id: string, updates: Partial<Advertiser>) => {
    try {
      const advertiser = await updateAdvertiser(id, updates)
      dispatch(upsertAdvertiser(advertiser))
      toast.success('Advertiser updated!')
      return advertiser
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

export function useDeleteAdvertiser() {
  const dispatch = useDispatch<AppDispatch>()
  return async (id: string) => {
    try {
      await dispatch(removeAdvertiser(id)).unwrap()
      toast.success('Advertiser removed.')
    } catch (err) {
      toast.error((err as Error).message)
      throw err
    }
  }
}

// ─── Admin: stats ─────────────────────────────────────────────

export function useAdRevenue() {
  const dispatch = useDispatch<AppDispatch>()
  const stats    = useSelector(selectAdStats)
  const error    = useSelector(selectAdsError)

  useEffect(() => { dispatch(fetchAdStats()) }, [dispatch])

  return { stats, error }
}