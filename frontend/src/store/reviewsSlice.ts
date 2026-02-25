import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createSelector } from '@reduxjs/toolkit'
import { getReviews, createReview, updateReview, deleteReview,
} from '@/lib/api/reviews'
import type { Review } from '@/lib/api/reviews'
import type { RootState } from '@/store'

// ─── State ────────────────────────────────────────────────────

interface ReviewsState {
  // keyed by mechanicId
  byMechanic:        Record<string, Review[]>
  totalByMechanic:   Record<string, number>
  loadingByMechanic: Record<string, boolean>
  submitting:        boolean
  error:             string | null
}

const initialState: ReviewsState = {
  byMechanic:        {},
  totalByMechanic:   {},
  loadingByMechanic: {},
  submitting:        false,
  error:             null,
}

// ─── Thunks ───────────────────────────────────────────────────

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async ({ mechanicId, page, limit }: { mechanicId: string; page?: number; limit?: number }) => {
    const data = await getReviews(mechanicId, { page, limit })
    return { mechanicId, ...data }
  }
)

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({
    mechanicId,
    payload,
  }: {
    mechanicId: string
    payload: { rating: number; comment: string; userName: string }
  }) => {
    const review = await createReview(mechanicId, payload)
    return { mechanicId, review }
  }
)

export const editReview = createAsyncThunk(
  'reviews/editReview',
  async ({
    mechanicId,
    reviewId,
    payload,
  }: {
    mechanicId: string
    reviewId: string
    payload: { rating?: number; comment?: string }
  }) => {
    const review = await updateReview(reviewId, payload)
    return { mechanicId, review }
  }
)

export const removeReview = createAsyncThunk(
  'reviews/removeReview',
  async ({ mechanicId, reviewId }: { mechanicId: string; reviewId: string }) => {
    await deleteReview(reviewId)
    return { mechanicId, reviewId }
  }
)

// ─── Slice ────────────────────────────────────────────────────

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── fetchReviews ──────────────────────────────────────────
    builder
      .addCase(fetchReviews.pending, (state, { meta }) => {
        state.loadingByMechanic[meta.arg.mechanicId] = true
      })
      .addCase(fetchReviews.fulfilled, (state, { payload }) => {
        state.byMechanic[payload.mechanicId]        = payload.reviews
        state.totalByMechanic[payload.mechanicId]   = payload.total
        state.loadingByMechanic[payload.mechanicId] = false
      })
      .addCase(fetchReviews.rejected, (state, { meta, error }) => {
        state.loadingByMechanic[meta.arg.mechanicId] = false
        state.error = error.message ?? 'Failed to load reviews'
      })

    // ── submitReview ──────────────────────────────────────────
    builder
      .addCase(submitReview.pending, (state) => {
        state.submitting = true
      })
      .addCase(submitReview.fulfilled, (state, { payload }) => {
        state.submitting = false
        const existing = state.byMechanic[payload.mechanicId] ?? []
        state.byMechanic[payload.mechanicId] = [payload.review, ...existing]
        state.totalByMechanic[payload.mechanicId] =
          (state.totalByMechanic[payload.mechanicId] ?? 0) + 1
      })
      .addCase(submitReview.rejected, (state, { error }) => {
        state.submitting = false
        state.error = error.message ?? 'Failed to submit review'
      })

    // ── editReview ────────────────────────────────────────────
    builder
      .addCase(editReview.pending, (state) => {
        state.submitting = true
      })
      .addCase(editReview.fulfilled, (state, { payload }) => {
        state.submitting = false
        const reviews = state.byMechanic[payload.mechanicId] ?? []
        const idx = reviews.findIndex(r => r.id === payload.review.id)
        if (idx >= 0) reviews[idx] = payload.review
      })
      .addCase(editReview.rejected, (state, { error }) => {
        state.submitting = false
        state.error = error.message ?? 'Failed to update review'
      })

    // ── removeReview ──────────────────────────────────────────
    builder
      .addCase(removeReview.fulfilled, (state, { payload }) => {
        state.byMechanic[payload.mechanicId] =
          (state.byMechanic[payload.mechanicId] ?? []).filter(r => r.id !== payload.reviewId)
        state.totalByMechanic[payload.mechanicId] =
          Math.max(0, (state.totalByMechanic[payload.mechanicId] ?? 1) - 1)
      })
      .addCase(removeReview.rejected, (state, { error }) => {
        state.error = error.message ?? 'Failed to delete review'
      })
  },
})

export const { clearError } = reviewsSlice.actions
export default reviewsSlice.reducer

// ─── Selectors ────────────────────────────────────────────────

const selectByMechanic        = (state: RootState) => state.reviews?.byMechanic        ?? {}
const selectTotalByMechanic   = (state: RootState) => state.reviews?.totalByMechanic   ?? {}
const selectLoadingByMechanic = (state: RootState) => state.reviews?.loadingByMechanic ?? {}

export const selectReviews = createSelector(
  [selectByMechanic, (_state: RootState, mechanicId: string) => mechanicId],
  (byMechanic, mechanicId) => byMechanic[mechanicId] ?? []
)

export const selectReviewsTotal = createSelector(
  [selectTotalByMechanic, (_state: RootState, mechanicId: string) => mechanicId],
  (totalByMechanic, mechanicId) => totalByMechanic[mechanicId] ?? 0
)

export const selectReviewsLoading = createSelector(
  [selectLoadingByMechanic, (_state: RootState, mechanicId: string) => mechanicId],
  (loadingByMechanic, mechanicId) => loadingByMechanic[mechanicId] ?? false
)

export const selectSubmitting = (state: RootState) => state.reviews?.submitting ?? false
export const selectReviewsError = (state: RootState) => state.reviews?.error ?? null