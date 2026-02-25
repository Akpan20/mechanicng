import { api } from './client'
import type { QuoteRequest } from '@/types'

export async function submitQuote(payload: Omit<QuoteRequest, 'id'|'created_at'|'status'>): Promise<QuoteRequest> {
  return api.post<QuoteRequest>('/api/quotes', payload)
}

export async function getQuotesByMechanic(mechanicId: string): Promise<QuoteRequest[]> {
  return api.get<QuoteRequest[]>(`/api/quotes/mechanic/${mechanicId}`)
}

export async function updateQuoteStatus(id: string, status: QuoteRequest['status']): Promise<void> {
  await api.patch(`/api/quotes/${id}/status`, { status })
}
