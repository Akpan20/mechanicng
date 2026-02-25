import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAdStats, selectAdStats, selectAdsError } from '@/store/adsSlice'

export function useRevenueStats() {
  const dispatch = useDispatch<any>()
  const stats = useSelector(selectAdStats)
  const error = useSelector(selectAdsError)

  useEffect(() => {
    if (!stats) {
      dispatch(fetchAdStats())
    }
  }, [dispatch, stats])

  return {
    data: stats,
    isLoading: useSelector((state: any) => state.ads.statsLoading),
    error,
  }
}