export type MechanicType = 'shop' | 'mobile'
export type MechanicStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted'
export type PlanId = 'free' | 'standard' | 'pro'
export type PriceRange = 'low' | 'mid' | 'high'
export type UserRole = 'user' | 'mechanic' | 'admin'
export type QuoteStatus = 'pending' | 'responded' | 'closed'

export interface Coordinates {
  lat: number
  lng: number
}

export interface Mechanic {
  id: string
  user_id: string
  name: string
  type: MechanicType
  status: MechanicStatus
  plan: PlanId
  phone: string
  whatsapp: string
  email: string
  city: string
  area: string
  address?: string
  lat: number
  lng: number
  service_radius?: number
  services: string[]
  hours: string
  priceRange: PriceRange
  bio?: string
  photos: string[]
  rating: number
  reviewCount: number
  verified: boolean
  featured: boolean
  created_at: string
  updated_at: string
  distance?: number
}

export interface Review {
  id: string
  mechanic_id: string
  user_id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export interface QuoteRequest {
  id: string
  mechanic_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service: string
  note?: string
  status: QuoteStatus
  created_at: string
}

export interface Subscription {
  id: string
  mechanic_id: string
  plan: PlanId
  status: 'active' | 'cancelled' | 'expired' | 'trialing'
  paystack_subscription_code?: string
  paystack_customer_code?: string
  current_period_start: string
  current_period_end: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  mechanic_id?: string
  created_at: string
}

export interface SearchFilters {
  city?: string
  service?: string
  type?: MechanicType | ''
  openNow?: boolean
  priceRange?: PriceRange | ''
  minRating?: number
}

export interface MechanicsSearchParams {
  city?: string
  service?: string
  limit?: number
  page?: number
  status?: string
}

export interface Plan {
  id: PlanId
  name: string
  priceNGN: number
  paystackPlanCode: string
  features: string[]
  highlighted?: boolean
  badge?: string
}

export interface AdminStats {
  total: number
  pending: number
  approved: number
  rejected: number
  suspended: number
  byPlan: Record<PlanId, number>
  newThisMonth: number
  activeSubscriptions: number
  monthlyRevenue: number
}
