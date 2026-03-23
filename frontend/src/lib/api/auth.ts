import { api } from './client'
import type { Profile, UserRole } from '@/types'

export interface AuthResponse {
  token: string
  user: Profile
}

/**
 * Sign up a new user
 * @param email - User's email address
 * @param password - User's password (min 8 chars)
 * @param fullName - User's full name
 * @param role - User role (default: 'user')
 * @param ref - Referral code (optional)
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'user',
  ref?: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/signup', {
    email,
    password,
    fullName,
    role,
    ref: ref ?? undefined,
  })
  
  localStorage.setItem('token', response.token)
  return response
}

/**
 * Sign in an existing user
 * @param email - User's email address
 * @param password - User's password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  })
  
  localStorage.setItem('token', response.token)
  return response
}

/**
 * Sign in as admin (requires admin secret)
 * @param email - Admin email
 * @param password - Admin password
 * @param adminSecret - Secret key for admin access
 */
export async function signInWithAdmin(
  email: string,
  password: string,
  adminSecret: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/admin-login', {
    email,
    password,
    adminSecret,
  })
  
  localStorage.setItem('token', response.token)
  return response
}

/**
 * Sign out the current user
 */
export function signOut(): void {
  localStorage.removeItem('token')
  // Optional: redirect to login page or clear app state
}

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<Profile> {
  return api.get<Profile>('/api/auth/me')
}

/**
 * Update the current user's profile
 * @param updates - Partial profile fields to update
 */
export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  return api.patch<Profile>('/api/auth/me', updates)
}