import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Profile } from '@/types'

// Simple user shape — no Supabase dependency
export interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
}

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
    },
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