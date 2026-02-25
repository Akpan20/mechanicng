import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Mechanic, SearchFilters, Coordinates } from '@/types'

interface SearchState {
  query: string
  filters: SearchFilters
  userLocation: Coordinates | null
  results: Mechanic[]
  hasSearched: boolean
}

const DEFAULT_FILTERS: SearchFilters = {
  city: '',
  service: '',
  type: '',
  openNow: false,
  priceRange: '',
  minRating: 0,
}

const initialState: SearchState = {
  query: '',
  filters: DEFAULT_FILTERS,
  userLocation: null,
  results: [],
  hasSearched: false,
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
    },
    setFilters(state, action: PayloadAction<Partial<SearchFilters>>) {
      state.filters = { ...state.filters, ...action.payload }
    },
    setUserLocation(state, action: PayloadAction<Coordinates | null>) {
      state.userLocation = action.payload
    },
    setResults(state, action: PayloadAction<Mechanic[]>) {
      state.results = action.payload
    },
    setHasSearched(state, action: PayloadAction<boolean>) {
      state.hasSearched = action.payload
    },
    resetFilters(state) {
      state.filters = DEFAULT_FILTERS
    },
  },
})

export const {
  setQuery,
  setFilters,
  setUserLocation,
  setResults,
  setHasSearched,
  resetFilters,
} = searchSlice.actions
export default searchSlice.reducer

// Selectors
export const selectQuery = (state: { search: SearchState }) => state.search.query
export const selectFilters = (state: { search: SearchState }) => state.search.filters
export const selectUserLocation = (state: { search: SearchState }) => state.search.userLocation
export const selectResults = (state: { search: SearchState }) => state.search.results
export const selectHasSearched = (state: { search: SearchState }) => state.search.hasSearched