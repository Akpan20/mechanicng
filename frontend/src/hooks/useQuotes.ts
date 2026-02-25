import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchQuotesByMechanic,
  submitNewQuote,
  updateQuoteStatusThunk,
} from '@/store/quotesSlice'
import type { QuoteRequest } from '@/types'

export function useQuotes(mechanicId: string) {
  const dispatch = useAppDispatch()
  const { items: quotes, loading, error } = useAppSelector(state => state.quotes)

  useEffect(() => {
    if (mechanicId) {
      dispatch(fetchQuotesByMechanic(mechanicId))
    }
  }, [dispatch, mechanicId])

  return {
    data: quotes,
    isLoading: loading,
    error,
    refetch: () => dispatch(fetchQuotesByMechanic(mechanicId)),
  }
}

export function useSubmitQuote() {
  const dispatch = useAppDispatch()
  const { submitLoading, submitError } = useAppSelector(state => state.quotes)

  const submit = async (quoteData: Parameters<typeof submitNewQuote>[0]) => {
    return dispatch(submitNewQuote(quoteData)).unwrap()
  }

  return {
    mutateAsync: submit,
    isLoading: submitLoading,
    error: submitError,
  }
}

export function useUpdateQuoteStatus() {
  const dispatch = useAppDispatch()
  const { updateLoading, updateError } = useAppSelector(state => state.quotes)

  const update = async (params: { id: string; status: QuoteRequest['status']; mechanicId: string }) => {
    await dispatch(updateQuoteStatusThunk(params)).unwrap()
    // Optionally refetch or show toast
  }

  return {
    mutateAsync: update,
    isLoading: updateLoading,
    error: updateError,
  }
}