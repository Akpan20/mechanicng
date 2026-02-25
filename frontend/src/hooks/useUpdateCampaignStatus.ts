import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { changeCampaignStatus } from '@/store/adsSlice'
import type { AdStatus } from '@/types/ads'

interface UpdateStatusParams {
  id: string
  status: AdStatus
}

export function useUpdateCampaignStatus() {
  const dispatch = useDispatch<any>()

  const mutate = useCallback(
    ({ id, status }: UpdateStatusParams) => {
      return dispatch(changeCampaignStatus({ id, status })).unwrap()
    },
    [dispatch]
  )

  return {
    mutate,
  }
}