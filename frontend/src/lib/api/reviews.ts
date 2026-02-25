import { api } from './client'

export interface Review {
  id: string
  mechanicId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface ReviewsResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getReviews(
  mechanicId: string,
  params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page)  searchParams.set('page',  String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  return api.get<ReviewsResponse>(`/api/reviews/${mechanicId}?${searchParams}`)
}

export async function createReview(
  mechanicId: string,
  payload: { rating: number; comment: string }
): Promise<Review> {
  return api.post<Review>(`/api/reviews/${mechanicId}`, payload)
}

export async function updateReview(
  reviewId: string,
  payload: { rating?: number; comment?: string }
): Promise<Review> {
  return api.patch<Review>(`/api/reviews/${reviewId}`, payload)
}

export async function deleteReview(reviewId: string): Promise<void> {
  return api.delete(`/api/reviews/${reviewId}`)
}