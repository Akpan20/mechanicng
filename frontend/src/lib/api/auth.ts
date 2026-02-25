import { api } from './client'
import type { Profile, UserRole } from '@/types'

export interface AuthResponse {
  token: string
  user: Profile
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'user'
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/signup', { email, password, fullName, role })
  localStorage.setItem('token', res.token)
  return res
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
  localStorage.setItem('token', res.token)
  return res
}

export async function signInWithAdmin(
  email: string,
  password: string,
  fullName: string,
  adminSecret: string
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
    fullName,
    adminSecret,
  })
  localStorage.setItem('token', res.token)
  return res
}

export function signOut(): void {
  localStorage.removeItem('token')
}

export async function getProfile(): Promise<Profile> {
  return api.get<Profile>('/api/auth/me')
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  return api.patch<Profile>('/api/auth/me', updates)
}
