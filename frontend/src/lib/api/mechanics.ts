import { api } from './client'
import type { Mechanic, MechanicStatus, SearchFilters } from '@/types'

// Strict camelCase normalization only
function normalize(m: Record<string, unknown>): Mechanic {
  return {
    ...(m as Mechanic),
    id: m.id as string,
  }
}

export async function getMechanics(
  filters?: SearchFilters & { lat?: number; lng?: number }
): Promise<Mechanic[]> {
  const params = new URLSearchParams()

  if (filters?.city)       params.set('city', filters.city)
  if (filters?.service)    params.set('service', filters.service)
  if (filters?.type)       params.set('type', filters.type)
  if (filters?.priceRange) params.set('priceRange', filters.priceRange)
  if (filters?.minRating)  params.set('minRating', String(filters.minRating))
  if (filters?.lat)        params.set('lat', String(filters.lat))
  if (filters?.lng)        params.set('lng', String(filters.lng))

  const qs = params.toString()
  const data = await api.get<Mechanic[]>(
    `/api/mechanics${qs ? `?${qs}` : ''}`
  )

  return data.map(normalize)
}

export async function getMechanicById(id: string): Promise<Mechanic> {
  const data = await api.get<Mechanic>(`/api/mechanics/${id}`)
  return normalize(data)
}

export async function getMechanicByUserId(
  userId: string
): Promise<Mechanic | null> {
  try {
    const data = await api.get<Mechanic>(
      `/api/mechanics/user/${userId}`
    )
    return normalize(data)
  } catch {
    return null
  }
}

export async function getAllMechanicsAdmin(params?: {
  city?: string
  status?: MechanicStatus
  page?: number
  limit?: number
}): Promise<{ mechanics: Mechanic[]; total: number; page: number; totalPages: number }> {
  const qs = new URLSearchParams()
  if (params?.city)   qs.set('city',   params.city)
  if (params?.status) qs.set('status', params.status)
  if (params?.page)   qs.set('page',   String(params.page))
  if (params?.limit)  qs.set('limit',  String(params.limit))

  const data = await api.get<{
    mechanics: Mechanic[]
    total: number
    page: number
    totalPages: number
  }>(`/api/admin/mechanics${qs.toString() ? `?${qs}` : ''}`)

  return { ...data, mechanics: data.mechanics.map(normalize) }
}

export async function createMechanic(
  payload: Omit<
    Mechanic,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'rating'
    | 'reviewCount'
    | 'verified'
    | 'featured'
    | 'photos'
  >
): Promise<Mechanic> {
  const data = await api.post<Mechanic>(
    '/api/mechanics',
    payload
  )
  return normalize(data)
}

export async function updateMechanic(
  id: string,
  updates: Partial<Mechanic>
): Promise<Mechanic> {
  const data = await api.patch<Mechanic>(
    `/api/mechanics/${id}`,
    updates
  )
  return normalize(data)
}

export async function updateMechanicStatus(
  id: string,
  status: MechanicStatus
): Promise<void> {
  await api.patch(`/api/mechanics/${id}/status`, { status })
}

export async function uploadMechanicPhoto(
  mechanicId: string,
  file: File
): Promise<string> {
  const token = localStorage.getItem('token')

  const form = new FormData()
  form.append('photo', file)

  const res = await fetch(
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api/mechanics/${mechanicId}/photos`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: form,
    }
  )

  if (!res.ok) throw new Error('Upload failed')

  const data = await res.json()
  return data.url as string
}