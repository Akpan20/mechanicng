/* eslint-disable no-undef */ // RequestInit and other globals are TypeScript types

import { store } from '@/store'
import { logout } from '@/store/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  public status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Handle 401 Unauthorized – token expired or invalid
  if (res.status === 401) {
    store.dispatch(logout())
    window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) throw new ApiError(res.status, data.error ?? `HTTP ${res.status}`)
  return data as T
}

export const api = {
  get:    <T>(path: string)                      => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)       => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)       => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                      => request<T>(path, { method: 'DELETE' }),
}