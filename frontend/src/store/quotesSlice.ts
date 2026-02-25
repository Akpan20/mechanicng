import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { submitQuote, getQuotesByMechanic, updateQuoteStatus } from '@/lib/api/quotes'
import type { QuoteRequest } from '@/types'

// --- Slice State ---
interface QuotesState {
  items: QuoteRequest[]
  loading: boolean
  error: string | null
  submitLoading: boolean
  submitError: string | null
  updateLoading: boolean
  updateError: string | null
}

const initialState: QuotesState = {
  items: [],
  loading: false,
  error: null,
  submitLoading: false,
  submitError: null,
  updateLoading: false,
  updateError: null,
}

export const fetchQuotesByMechanic = createAsyncThunk(
  'quotes/fetchByMechanic',
  async (mechanicId: string, { rejectWithValue }) => {
    try {
      return await getQuotesByMechanic(mechanicId)
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

export const submitNewQuote = createAsyncThunk(
  'quotes/submit',
  async (quoteData: Omit<QuoteRequest, 'id' | 'created_at'>, { rejectWithValue }) => {
    try {
      return await submitQuote(quoteData)
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

export const updateQuoteStatusThunk = createAsyncThunk(
  'quotes/updateStatus',
  async (
    { id, status, mechanicId }: { id: string; status: QuoteRequest['status']; mechanicId: string },
    { rejectWithValue }
  ) => {
    try {
      const updated = (await updateQuoteStatus(id, status) as unknown) as QuoteRequest
      return { ...updated, mechanicId } as QuoteRequest & { mechanicId: string }
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    clearQuotes: (state) => {
      state.items = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch quotes
      .addCase(fetchQuotesByMechanic.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuotesByMechanic.fulfilled, (state, action: PayloadAction<QuoteRequest[]>) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchQuotesByMechanic.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Submit quote
      .addCase(submitNewQuote.pending, (state) => {
        state.submitLoading = true
        state.submitError = null
      })
      .addCase(submitNewQuote.fulfilled, (state) => {
        state.submitLoading = false
        // We don't have mechanicId, so we don't push the new quote automatically.
        // A refetch will happen when the mechanic's quotes are next requested.
      })
      .addCase(submitNewQuote.rejected, (state, action) => {
        state.submitLoading = false
        state.submitError = action.payload as string
      })
      // Update quote status
      .addCase(updateQuoteStatusThunk.pending, (state) => {
        state.updateLoading = true
        state.updateError = null
      })
      .addCase(updateQuoteStatusThunk.fulfilled, (state, action: PayloadAction<QuoteRequest & { mechanicId: string }>) => {
        state.updateLoading = false
        const updated = action.payload
        const index = state.items.findIndex(q => q.id === updated.id)
        if (index !== -1) {
          state.items[index] = updated
        }
      })
      .addCase(updateQuoteStatusThunk.rejected, (state, action) => {
        state.updateLoading = false
        state.updateError = action.payload as string
      })
  },
})

export const { clearQuotes } = quotesSlice.actions
export default quotesSlice.reducer