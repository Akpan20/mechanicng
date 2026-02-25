import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllCampaigns, selectAllCampaigns, selectCampaignsLoading } from '@/store/adsSlice'

export function useAdminCampaigns() {
  const dispatch = useDispatch<any>()
  const campaigns = useSelector(selectAllCampaigns)
  const isLoading = useSelector(selectCampaignsLoading)

  useEffect(() => {
    // Fetch only if not already loaded and not currently loading
    if (campaigns.length === 0 && !isLoading) {
      dispatch(fetchAllCampaigns())
    }
  }, [dispatch, campaigns.length, isLoading])

  return {
    data: campaigns,
    isLoading,
    error: useSelector((state: any) => state.ads.error), // optional
  }
}