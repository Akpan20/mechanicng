import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMechanic } from '@/hooks/useMechanics'
import { useSubmitQuote } from '@/hooks/useQuotes'
import { useReviews, useCreateReview, useDeleteReview } from '@/hooks/useReviews'
import { useAppSelector } from '@/store/hooks'
import { selectUser, selectProfile } from '@/store/authSlice'
import { PRICE_LABELS } from '@/lib/constants'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import AdSlot from '@/components/ads/AdSlot'
import DOMPurify from 'dompurify'

// ── Schemas ───────────────────────────────────────────────────────────────────

const quoteSchema = z.object({
  customer_name:  z.string().min(2, 'Name required'),
  customer_phone: z.string().min(10, 'Valid phone number required'),
  customer_email: z.string().email().optional().or(z.literal('')),
  service:        z.string().min(1, 'Select a service'),
  note:           z.string().optional(),
})
type QuoteForm = z.infer<typeof quoteSchema>

const reviewSchema = z.object({
  rating:  z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
})
type ReviewForm = z.infer<typeof reviewSchema>

// ── Star picker ───────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (_: number) => void }) { // eslint-disable-line no-unused-vars
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          className={`text-2xl transition-colors ${i <= (hover || value) ? 'text-amber-400' : 'text-gray-700'}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}>
          ★
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MechanicProfilePage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const user       = useAppSelector(selectUser)
  const profile    = useAppSelector(selectProfile)

  const { data: mechanic, isLoading } = useMechanic(id)
  console.log('mechanic data:', mechanic)
  const submitQuote = useSubmitQuote()

  const [showQuote, setShowQuote] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Reviews
  const { data: reviewsData, isLoading: loadingReviews, page, setPage } = useReviews(id ?? '', 5)
  const createReview = useCreateReview(id ?? '')
  const deleteReview = useDeleteReview(id ?? '')

  // Quote form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
  })

  // Review form
  const { register: regReview, handleSubmit: handleReviewSubmit, setValue: setReviewValue,
          reset: resetReview, formState: { errors: reviewErrors }, control: reviewControl } =
    useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, comment: '' } })

  const ratingValue = useWatch({ control: reviewControl, name: 'rating' })

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loader" /></div>
  if (!mechanic) return <div className="text-center py-20 text-gray-500">Mechanic not found.</div>

  const waNum = (mechanic.whatsapp || mechanic.phone || '').replace(/\D/g, '')
  const lat = mechanic.lat
  const lng = mechanic.lng
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  const onQuoteSubmit = async (data: QuoteForm) => {
    await submitQuote.mutateAsync({ ...data, mechanic_id: mechanic.id, status: 'pending' })
    reset()
    setShowQuote(false)
    toast.success('Quote request sent!')
  }

  const onReviewSubmit = async (data: ReviewForm) => {
    try {
      await createReview.mutate(data)
      resetReview()
      setShowReviewForm(false)
      toast.success('Review submitted!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to submit review')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await deleteReview.mutateAsync(reviewId)
      toast.success('Review deleted')
    } catch {
      toast.error('Failed to delete review')
    }
  }

  const reviews    = reviewsData?.reviews    ?? []
  const totalPages = reviewsData?.totalPages ?? 1

  return (
    <>
      <Helmet>
        <title>{mechanic.name} – MechanicNG</title>
        <meta name="description" content={mechanic.bio ?? `${mechanic.name} in ${mechanic.city}.`} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-5 text-sm">← Back</button>

        {/* ── Profile card ── */}
        <div className="card overflow-hidden mb-4">
          <div className={`p-7 ${mechanic.type === 'mobile'
            ? 'bg-gradient-to-br from-purple-950 to-indigo-950'
            : 'bg-gradient-to-br from-orange-950 to-stone-950'}`}>
            <div className="flex gap-5 items-start flex-wrap">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                mechanic.type === 'mobile' ? 'bg-purple-500/30' : 'bg-brand-500/30'}`}>
                {mechanic.type === 'mobile' ? '🚗' : '🏪'}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl font-extrabold">{mechanic.name}</h1>
                  {mechanic.verified && <span className="badge bg-emerald-500/20 text-emerald-400">✓ Verified</span>}
                  {mechanic.plan === 'pro'      && <span className="badge bg-emerald-500/20 text-emerald-400">Pro</span>}
                  {mechanic.plan === 'standard' && <span className="badge bg-brand-500/20 text-brand-500">Standard</span>}
                </div>
                <p className="text-gray-400 mb-2">📍 {mechanic.area && `${mechanic.area}, `}{mechanic.city}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-base ${i <= Math.round(mechanic.rating) ? 'text-amber-400' : 'text-gray-700'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {mechanic.rating > 0
                      ? `${mechanic.rating} · ${mechanic.reviewCount} review${mechanic.reviewCount !== 1 ? 's' : ''}`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-gray-800">
            <a href={`tel:${mechanic.phone}`}
              className="btn-primary flex items-center justify-center gap-2 text-sm py-3 no-underline">
              📞 Call
            </a>
            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl py-3 text-sm hover:-translate-y-0.5 transition-all no-underline">
              💬 WhatsApp
            </a>
            <a href={mapsUrl} target="_blank" rel="noreferrer"
              className="btn-outline flex items-center justify-center gap-2 text-sm py-3 no-underline">
              🗺️ Directions
            </a>
            <button onClick={() => setShowQuote(true)}
              className="flex items-center justify-center gap-2 bg-purple-500/20 border-2 border-purple-500/50 text-purple-400 font-bold rounded-xl py-3 text-sm hover:bg-purple-500/30 transition-all">
              📋 Get Quote
            </button>
          </div>

          {/* Details grid */}
          <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-800">
            {([
              ['🕐 Hours',  mechanic.hours],
              ['📍 Type',   mechanic.type === 'mobile' ? `Mobile${mechanic.service_radius ? ` · ${mechanic.service_radius}km radius` : ''}` : 'Auto Shop'],
              ['💰 Pricing', PRICE_LABELS[mechanic.priceRange]],
              ['📞 Phone',  mechanic.phone],
            ] as const).map(([label, value]) => (
              <div key={label} className="bg-gray-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-gray-200 font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {mechanic.bio && (
            <div className="p-6 border-b border-gray-800">
              <p className="section-title mb-3">About</p>
              {/* Sanitized bio */}
              <p className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mechanic.bio) }} />
            </div>
          )}

          <div className="p-6">
            <p className="section-title mb-3">Services Offered</p>
            <div className="flex flex-wrap gap-2">
              {mechanic.services.map(s => <span key={s} className="tag text-sm py-1.5 px-3">{s}</span>)}
            </div>
          </div>
        </div>

        <AdSlot placement="profile_bottom" cityContext={mechanic.city} className="mb-4" />

        {/* ── Reviews ── */}
        <div className="card overflow-hidden mb-4">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <p className="section-title mb-0.5">Reviews</p>
              <p className="text-xs text-gray-500">{mechanic.reviewCount} review{mechanic.reviewCount !== 1 ? 's' : ''}</p>
            </div>
            {user && !showReviewForm && (
              <button onClick={() => setShowReviewForm(true)} className="btn-primary text-sm py-2 px-4">
                + Write a Review
              </button>
            )}
            {!user && (
              <span className="text-xs text-gray-500">
                <a href="/login" className="text-brand-500 hover:underline">Sign in</a> to leave a review
              </span>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <div className="p-6 border-b border-gray-800 bg-gray-900/50">
              <h3 className="font-bold mb-4">Your Review</h3>
              <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-4">
                <div>
                  <label className="section-title block mb-2">Rating *</label>
                  <StarPicker value={ratingValue} onChange={v => setReviewValue('rating', v, { shouldValidate: true })} />
                  {reviewErrors.rating && <p className="text-red-400 text-xs mt-1">Please select a rating</p>}
                </div>
                <div>
                  <label className="section-title block mb-2">Comment *</label>
                  <textarea className="input resize-none w-full" rows={4}
                    placeholder="Share your experience with this mechanic..."
                    {...regReview('comment')} />
                  {reviewErrors.comment && <p className="text-red-400 text-xs mt-1">{reviewErrors.comment.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowReviewForm(false); resetReview() }}
                    className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={createReview.isPending} className="btn-primary flex-1">
                    {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Review list */}
          {loadingReviews ? (
            <div className="flex justify-center py-10"><div className="loader" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-3xl mb-2">⭐</p>
              <p>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reviews.map(r => (
                <div key={r.id} className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-white">{r.userName}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-sm ${i <= r.rating ? 'text-amber-400' : 'text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">
                        {new Date(r.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {(user?.id === r.userId || profile?.role === 'admin') && (
                        <button onClick={() => handleDeleteReview(r.id)}
                          disabled={deleteReview.isPending}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Sanitized review comment */}
                  <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(r.comment) }} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-3">
              <button className="btn text-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <button className="btn text-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</button>
            </div>
          )}
        </div>

        {/* ── Quote modal ── */}
        {showQuote && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowQuote(false)}>
            <div className="card w-full max-w-md p-7 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold">Request a Quote</h2>
                <button onClick={() => setShowQuote(false)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleSubmit(onQuoteSubmit)} className="space-y-4">
                <div>
                  <label className="section-title block mb-2">Your Name *</label>
                  <input className="input" {...register('customer_name')} placeholder="Full name" />
                  {errors.customer_name && <p className="text-red-400 text-xs mt-1">{errors.customer_name.message}</p>}
                </div>
                <div>
                  <label className="section-title block mb-2">Phone Number *</label>
                  <input className="input" {...register('customer_phone')} placeholder="0801 234 5678" />
                  {errors.customer_phone && <p className="text-red-400 text-xs mt-1">{errors.customer_phone.message}</p>}
                </div>
                <div>
                  <label className="section-title block mb-2">Email (optional)</label>
                  <input className="input" type="email" {...register('customer_email')} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="section-title block mb-2">Service Needed *</label>
                  <select className="input" {...register('service')}>
                    <option value="">Select a service</option>
                    {mechanic.services.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {errors.service && <p className="text-red-400 text-xs mt-1">{errors.service.message}</p>}
                </div>
                <div>
                  <label className="section-title block mb-2">Notes (optional)</label>
                  <textarea className="input resize-none" rows={3} {...register('note')} placeholder="Describe the issue..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowQuote(false)} className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={submitQuote.isLoading} className="btn-primary flex-1">
                    {submitQuote.isLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}