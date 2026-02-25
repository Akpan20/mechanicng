// Centralized React Query keys for cache management
export const queryKeys = {
  mechanics: {
    all: ['mechanics'] as const,
    approved: () => [...queryKeys.mechanics.all, 'approved'] as const,
    byId: (id: string) => [...queryKeys.mechanics.all, id] as const,
    pending: () => [...queryKeys.mechanics.all, 'pending'] as const,
    byUser: (userId: string) => [...queryKeys.mechanics.all, 'user', userId] as const,
    search: (filters: object) => [...queryKeys.mechanics.all, 'search', filters] as const,
  },
  reviews: {
    byMechanic: (mechanicId: string) => ['reviews', mechanicId] as const,
  },
  quotes: {
    byMechanic: (mechanicId: string) => ['quotes', mechanicId] as const,
  },
  profile: {
    current: ['profile', 'current'] as const,
    byId: (id: string) => ['profile', id] as const,
  },
  subscription: {
    byMechanic: (mechanicId: string) => ['subscription', mechanicId] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
  },
}
