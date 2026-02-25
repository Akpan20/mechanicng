import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  setUser,
  setProfile,
  setLoading,
  resetAuth,
  selectUser,
  selectProfile,
  selectIsLoading,
  selectIsAdmin,
  selectIsMechanic,
} from '@/store/authSlice'
import { getProfile } from '@/lib/api/auth'

export function useAuthInit() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { dispatch(setLoading(false)); return }

    getProfile()
      .then(profile => {
        dispatch(setUser({ id: profile.id, email: profile.email }))
        dispatch(setProfile(profile))
      })
      .catch(() => {
        // Token invalid or expired — clear it
        dispatch(resetAuth())
      })
      .finally(() => dispatch(setLoading(false)))
  }, [dispatch])
}

export function useAuth() {
  const user        = useSelector(selectUser)
  const profile     = useSelector(selectProfile)
  const isLoading   = useSelector(selectIsLoading)
  const isAdmin     = useSelector(selectIsAdmin)
  const isMechanic  = useSelector(selectIsMechanic)

  const dispatch = useDispatch<AppDispatch>()

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isMechanic,
    logout: () => dispatch(resetAuth()),
  }
}