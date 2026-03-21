import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Profile } from '@/types'

export interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  user:      AuthUser | null
  profile:   Profile | null
  isLoading: boolean
}

const initialState: AuthState = {
  user:      null,
  profile:   null,
  isLoading: true,
}

// ─── Async logout ─────────────────────────────────────────────
// Thunk so components can await it and redirect after completion
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token')
  sessionStorage.clear()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
    setProfile(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    resetAuth(state) {
      state.user      = null
      state.profile   = null
      state.isLoading = false
      localStorage.removeItem('token')
      sessionStorage.clear()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, (state) => {
      state.user      = null
      state.profile   = null
      state.isLoading = false
    })
  },
})

export const { setUser, setProfile, setLoading, resetAuth } = authSlice.actions
export default authSlice.reducer

// ─── Selectors ────────────────────────────────────────────────
export const selectUser       = (state: { auth: AuthState }) => state.auth.user
export const selectProfile    = (state: { auth: AuthState }) => state.auth.profile
export const selectIsLoading  = (state: { auth: AuthState }) => state.auth.isLoading
export const selectIsAdmin    = (state: { auth: AuthState }) => state.auth.profile?.role === 'admin'
export const selectIsMechanic = (state: { auth: AuthState }) => state.auth.profile?.role === 'mechanic'