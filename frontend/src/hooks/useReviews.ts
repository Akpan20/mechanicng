import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import type { AppDispatch, RootState } from '@/store'
import {
  fetchReviews,
  submitReview,
  editReview,
  removeReview,
  selectReviews,
  selectReviewsTotal,
  selectReviewsLoading,
  selectSubmitting,
  selectReviewsError,
} from '@/store/reviewsSlice'
import toast from 'react-hot-toast'

export function useReviews(mechanicId: string, limit = 5) {
  const dispatch        = useDispatch<AppDispatch>()
  const [page, setPage] = useState(1)

  const reviews    = useSelector((state: RootState) => selectReviews(state, mechanicId))
  const total      = useSelector((state: RootState) => selectReviewsTotal(state, mechanicId))
  const isLoading  = useSelector((state: RootState) => selectReviewsLoading(state, mechanicId))
  const error      = useSelector(selectReviewsError)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const load = (p: number) => {
    if (!mechanicId) return
    dispatch(fetchReviews({ mechanicId, page: p, limit }))
  }

  const handleSetPage = (updater: number | ((p: number) => number)) => { // eslint-disable-line no-unused-vars
    const next = typeof updater === 'function' ? updater(page) : updater
    setPage(next)
    load(next)
  }

  useEffect(() => {
    load(page)
  }, [mechanicId, page, limit]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: { reviews, total, totalPages, page },
    isLoading,
    error,
    page,
    setPage: handleSetPage,
  }
}

export function useCreateReview(mechanicId: string) {
  const dispatch    = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const isPending   = useSelector(selectSubmitting)

  const mutate = async (payload: { rating: number; comment: string }) => {
    try {
      await dispatch(submitReview({ mechanicId, payload: { ...payload, userName: '' } })).unwrap()
      dispatch(fetchReviews({ mechanicId, page: 1 }))

      // Optimistically bump reviewCount so header updates instantly
      queryClient.setQueryData(['mechanic', mechanicId], (old: Record<string, unknown> | undefined) => {
        if (!old) return old
        return { ...old, reviewCount: ((old.reviewCount as number) ?? 0) + 1 }
      })
      queryClient.invalidateQueries({ queryKey: ['mechanic', mechanicId] })
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to submit review')
      throw err
    }
  }

  return { mutate, mutateAsync: mutate, isPending }
}

export function useUpdateReview(mechanicId: string) {
  const dispatch  = useDispatch<AppDispatch>()
  const isPending = useSelector(selectSubmitting)

  const mutate = async ({ reviewId, ...payload }: { reviewId: string; rating?: number; comment?: string }) => {
    try {
      await dispatch(editReview({ mechanicId, reviewId, payload })).unwrap()
      toast.success('Review updated')
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to update review')
      throw err
    }
  }

  return { mutate, mutateAsync: mutate, isPending }
}

export function useDeleteReview(mechanicId: string) {
  const dispatch    = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const isPending   = useSelector(selectSubmitting)

  const mutate = async (reviewId: string) => {
    try {
      await dispatch(removeReview({ mechanicId, reviewId })).unwrap()
      dispatch(fetchReviews({ mechanicId, page: 1 }))

      // Optimistically decrement reviewCount instantly
      queryClient.setQueryData(['mechanic', mechanicId], (old: Record<string, unknown> | undefined) => {
        if (!old) return old
        return { ...old, reviewCount: Math.max(0, ((old.reviewCount as number) ?? 1) - 1) }
      })
      queryClient.invalidateQueries({ queryKey: ['mechanic', mechanicId] })
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
      toast.success('Review deleted')
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to delete review')
      throw err
    }
  }

  return { mutate, mutateAsync: mutate, isPending }
}