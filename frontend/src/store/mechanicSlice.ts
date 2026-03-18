import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getMechanics,
  getMechanicById,
  getMechanicByUserId,
  getAllMechanicsAdmin,
  createMechanic,
  updateMechanic,
  updateMechanicStatus,
} from '@/lib/api/mechanics'
import type { Mechanic, SearchFilters, MechanicStatus } from '@/types'

// ─── State ────────────────────────────────────────────────────

interface MechanicsState {
  // Search results
  results: Mechanic[]
  resultsLoading: boolean

  // Single mechanic cache — keyed by id
  byId: Record<string, Mechanic>
  byIdLoading: Record<string, boolean>

  // Current user's own mechanic listing
  myMechanic: Mechanic | null
  myMechanicLoading: boolean

  // Admin list with pagination
  all: Mechanic[]
  allTotal: number
  allPage: number
  allTotalPages: number
  allLoading: boolean

  error: string | null
}

const initialState: MechanicsState = {
  results:           [],
  resultsLoading:    false,
  byId:              {},
  byIdLoading:       {},
  myMechanic:        null,
  myMechanicLoading: false,
  all:               [],
  allTotal:          0,
  allPage:           1,
  allTotalPages:     1,
  allLoading:        false,
  error:             null,
}

// ─── Thunks ───────────────────────────────────────────────────

export const fetchMechanics = createAsyncThunk(
  'mechanics/fetchMechanics',
  async (filters?: SearchFilters) => getMechanics(filters)
)

export const fetchMechanicById = createAsyncThunk(
  'mechanics/fetchMechanicById',
  async (id: string) => getMechanicById(id)
)

export const fetchMyMechanic = createAsyncThunk(
  'mechanics/fetchMyMechanic',
  async (userId: string) => getMechanicByUserId(userId)
)

export const fetchAllMechanicsAdmin = createAsyncThunk(
  'mechanics/fetchAllMechanicsAdmin',
  async () => getAllMechanicsAdmin()
)

export const addMechanic = createAsyncThunk(
  'mechanics/addMechanic',
  async (payload: Parameters<typeof createMechanic>[0]) => createMechanic(payload)
)

export const editMechanic = createAsyncThunk(
  'mechanics/editMechanic',
  async ({ id, updates }: { id: string; updates: Partial<Mechanic> }) =>
    updateMechanic(id, updates)
)

export const changeMechanicStatus = createAsyncThunk(
  'mechanics/changeMechanicStatus',
  async ({ id, status }: { id: string; status: MechanicStatus }) => {
    await updateMechanicStatus(id, status)
    return { id, status }
  }
)

// ─── Slice ────────────────────────────────────────────────────

const mechanicsSlice = createSlice({
  name: 'mechanics',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    clearResults(state) {
      state.results = []
    },
  },
  extraReducers: (builder) => {
    // ── fetchMechanics ────────────────────────────────────────
    builder
      .addCase(fetchMechanics.pending,   (state) => { state.resultsLoading = true; state.error = null })
      .addCase(fetchMechanics.fulfilled, (state, { payload }) => {
        state.results        = payload
        state.resultsLoading = false
        // Populate byId cache from search results
        payload.forEach(m => { state.byId[m.id] = m })
      })
      .addCase(fetchMechanics.rejected,  (state, { error }) => {
        state.resultsLoading = false
        state.error = error.message ?? 'Failed to load mechanics'
      })

    // ── fetchMechanicById ─────────────────────────────────────
    builder
      .addCase(fetchMechanicById.pending,   (state, { meta }) => { state.byIdLoading[meta.arg] = true })
      .addCase(fetchMechanicById.fulfilled, (state, { payload }) => {
        if (payload) {
          state.byId[payload.id]        = payload
          state.byIdLoading[payload.id] = false
        }
      })
      .addCase(fetchMechanicById.rejected,  (state, { meta, error }) => {
        state.byIdLoading[meta.arg] = false
        state.error = error.message ?? 'Failed to load mechanic'
      })

    // ── fetchMyMechanic ───────────────────────────────────────
    builder
      .addCase(fetchMyMechanic.pending,   (state) => { state.myMechanicLoading = true })
      .addCase(fetchMyMechanic.fulfilled, (state, { payload }) => {
        state.myMechanic        = payload
        state.myMechanicLoading = false
        if (payload) state.byId[payload.id] = payload
      })
      .addCase(fetchMyMechanic.rejected,  (state, { error }) => {
        state.myMechanicLoading = false
        state.error = error.message ?? 'Failed to load your listing'
      })

    // ── fetchAllMechanicsAdmin ────────────────────────────────
    builder
      .addCase(fetchAllMechanicsAdmin.pending,   (state) => { state.allLoading = true })
      .addCase(fetchAllMechanicsAdmin.fulfilled, (state, { payload }) => {
        state.all           = payload.mechanics
        state.allTotal      = payload.total
        state.allPage       = payload.page
        state.allTotalPages = payload.totalPages
        state.allLoading    = false
      })
      .addCase(fetchAllMechanicsAdmin.rejected,  (state, { error }) => {
        state.allLoading = false
        state.error = error.message ?? 'Failed to load all mechanics'
      })

    // ── addMechanic ───────────────────────────────────────────
    builder
      .addCase(addMechanic.fulfilled, (state, { payload }) => {
        state.myMechanic    = payload
        state.byId[payload.id] = payload
        state.all.unshift(payload)
      })
      .addCase(addMechanic.rejected, (state, { error }) => {
        state.error = error.message ?? 'Failed to create listing'
      })

    // ── editMechanic ──────────────────────────────────────────
    builder
      .addCase(editMechanic.fulfilled, (state, { payload }) => {
        state.byId[payload.id] = payload
        if (state.myMechanic?.id === payload.id) state.myMechanic = payload
        const idx = state.all.findIndex(m => m.id === payload.id)
        if (idx >= 0) state.all[idx] = payload
        const ridx = state.results.findIndex(m => m.id === payload.id)
        if (ridx >= 0) state.results[ridx] = payload
      })
      .addCase(editMechanic.rejected, (state, { error }) => {
        state.error = error.message ?? 'Failed to update listing'
      })

    // ── changeMechanicStatus ──────────────────────────────────
    builder.addCase(changeMechanicStatus.fulfilled, (state, { payload }) => {
      const targets = [
        state.byId[payload.id],
        state.all.find(m => m.id === payload.id),
        state.results.find(m => m.id === payload.id),
        state.myMechanic?.id === payload.id ? state.myMechanic : null,
      ]
      targets.forEach(m => { if (m) m.status = payload.status })
    })
  },
})

export const { clearError, clearResults } = mechanicsSlice.actions
export default mechanicsSlice.reducer

// ─── Selectors ────────────────────────────────────────────────

type S = { mechanics: MechanicsState }

export const selectMechanicResults   = (s: S) => s.mechanics.results
export const selectResultsLoading    = (s: S) => s.mechanics.resultsLoading
export const selectMechanicById      = (id: string) => (s: S) => s.mechanics.byId[id] ?? null
export const selectByIdLoading       = (id: string) => (s: S) => s.mechanics.byIdLoading[id] ?? false
export const selectMyMechanic        = (s: S) => s.mechanics.myMechanic
export const selectMyMechanicLoading = (s: S) => s.mechanics.myMechanicLoading
export const selectAllMechanics      = (s: S) => s.mechanics.all
export const selectAllTotal            = (s: S) => s.mechanics.allTotal
export const selectAllPage             = (s: S) => s.mechanics.allPage
export const selectAllTotalPages       = (s: S) => s.mechanics.allTotalPages
export const selectAllLoading          = (s: S) => s.mechanics.allLoading
export const selectMechanicsError      = (s: S) => s.mechanics.error