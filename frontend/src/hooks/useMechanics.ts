import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api/client'
import { useAuth } from './useAuth'
import { getAllMechanicsAdmin } from '@/lib/api/mechanics'
import type { Mechanic, MechanicsSearchParams, MechanicStatus } from '@/types'

export function useMechanics(params: MechanicsSearchParams = {}) {
  return useQuery({
    queryKey: ['mechanics', params],
    queryFn: async (): Promise<Mechanic[]> => {
      const searchParams = new URLSearchParams()
      if (params.city)    searchParams.set('city',    params.city)
      if (params.service) searchParams.set('service', params.service)
      if (params.limit)   searchParams.set('limit',   String(params.limit))
      if (params.page)    searchParams.set('page',    String(params.page))
      return api.get<Mechanic[]>(`/api/mechanics?${searchParams.toString()}`)
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

export function useMechanic(id: string | undefined) {
  return useQuery({
    queryKey: ['mechanic', id],
    queryFn:  async () => {
      const data = await api.get<Mechanic>(`/api/mechanics/${id}`)
      return { ...data, id: (data as any)._id ?? data.id }  // normalize _id → id
    },
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyMechanic() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['my-mechanic', user?.id],
    queryFn: async (): Promise<Mechanic | null> => {
      if (!isAuthenticated) return null
      try {
        return await api.get<Mechanic>('/api/mechanics/me')
      } catch (err) {
        if ((err as ApiError).status === 404) return null
        throw err
      }
    },
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Mechanic> }) =>
      api.patch<Mechanic>(`/api/mechanics/${id}`, data),

    onSuccess: (updatedMechanic) => {
      queryClient.invalidateQueries({ queryKey: ['my-mechanic'] })
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
      queryClient.setQueryData(['my-mechanic'], updatedMechanic)
    },
  })
}

export interface AdminMechanicsResponse {
  mechanics: Mechanic[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useAllMechanicsAdmin(params: {
  city?: string
  status?: MechanicStatus
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['admin', 'mechanics', params],
    queryFn: () => getAllMechanicsAdmin(params),
  })
}

export function useUpdateMechanicStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      // ✅ fixed: was /api/admin/mechanics/${id}/status
      api.patch(`/api/mechanics/${id}/status`, { status }),

    onMutate: async ({ id, status }: { id: string; status: string }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-mechanics'] })
      const previous = queryClient.getQueriesData({ queryKey: ['admin-mechanics'] })

      for (const [queryKey, data] of previous) {
        if (!data) continue
        try {
          const d = data as AdminMechanicsResponse
          queryClient.setQueryData(queryKey, {
            ...d,
            mechanics: d.mechanics.map(m => m.id === id ? { ...m, status } : m),
          })
        } catch { /* ignore */ }
      }

      return { previous }
    },

    onError: (_err, _variables, context: { previous: [unknown, unknown][] } | undefined) => {
      if (context?.previous) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey as Parameters<typeof queryClient.setQueryData>[0], data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mechanics'] })
    },
  })
}