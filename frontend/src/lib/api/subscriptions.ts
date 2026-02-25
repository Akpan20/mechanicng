import { api } from './client'
import type { Subscription } from '@/types'

export async function getSubscription(mechanicId: string): Promise<Subscription | null> {
  try { return await api.get<Subscription>(`/api/subscriptions/${mechanicId}`) }
  catch { return null }
}
