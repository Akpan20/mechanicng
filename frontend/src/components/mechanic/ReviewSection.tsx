import { useState } from 'react'
import { useReviews, useCreateReview, useDeleteReview } from '@/hooks/useReviews'
import { useAppSelector } from '@/store/hooks'
import { selectUser, selectIsAdmin } from '@/store/authSlice'

interface Props {
  mechanicId: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (val: number) => void }) { // eslint-disable-line no-unused-vars
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-gray-600'}>★</span>
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}
      <span className="text-gray-600">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function ReviewSection({ mechanicId }: Props) {
  const user    = useAppSelector(selectUser)
  const isAdmin = useAppSelector(selectIsAdmin)

  const [page, setPage]         = useState(1)
  const [rating, setRating]     = useState(0)
  const [comment, setComment]   = useState('')
  const [showForm, setShowForm] = useState(false)

  // Fixed: useReviews returns { data: { reviews, total, totalPages, page }, isLoading, error, page, setPage }
  const { data, isLoading } = useReviews(mechanicId, page) // Fixed: second arg is page number, not options object
  const reviews = data?.reviews ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // Fixed: useCreateReview returns { mutate, mutateAsync, isPending }
  const { mutate: submitReview, isPending } = useCreateReview(mechanicId)

  const { mutate: removeReview } = useDeleteReview(mechanicId)

  const handleSubmit = async () => {
    if (rating === 0 || comment.trim().length < 10) return
    
    // Fixed: remove userName from payload, backend should get it from auth token
    await submitReview({
      rating,
      comment,
    })
    setRating(0)
    setComment('')
    setShowForm(false)
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">
          Reviews{' '}
          {total !== undefined && (
            <span className="text-gray-500 font-normal text-base">({total})</span>
          )}
        </h2>
        {user && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2">
            + Write a Review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && user && (
        <div className="card p-5 mb-5">
          <h3 className="font-bold mb-4">Your Review</h3>
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Comment</label>
            <textarea
              className="input w-full min-h-[100px] resize-y"
              placeholder="Share your experience (min 10 characters)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <p className="text-xs text-gray-600 mt-1">{comment.trim().length}/10 min</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || rating === 0 || comment.trim().length < 10}
              className="btn-primary text-sm py-2 disabled:opacity-50"
            >
              {isPending ? 'Submitting...' : 'Submit Review'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-outline text-sm py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="loader" /></div>
      ) : reviews.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>No reviews yet. Be the first to leave one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white">{r.userName}</span>
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-gray-600">
                      {new Date(r.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                </div>
                {(r.userId === user?.id || isAdmin) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this review?')) {
                        removeReview(r.id)
                      }
                    }}
                    className="text-gray-600 hover:text-red-400 text-xs transition-colors flex-shrink-0"
                    title="Delete review"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button className="btn" onClick={() => setPage(p => p + 1)} disabled={page >= (totalPages ?? 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  )
}