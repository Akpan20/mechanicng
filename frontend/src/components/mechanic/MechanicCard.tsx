import { Link } from 'react-router-dom'
import { formatDistance } from '@/lib/geo'
import type { Mechanic } from '@/types'
import { PRICE_LABELS } from '@/lib/constants'

interface Props { mechanic: Mechanic; className?: string }

export default function MechanicCard({ mechanic: m, className = '' }: Props) {
  const hasDistance = m.distance != null && !isNaN(m.distance)
  const hasRating = m.rating > 0
  const isOpen = m.status === 'approved'

  return (
    <Link to={`/mechanic/${m.id}`} className={`card block p-5 cursor-pointer group ${className}`}>

      {/* Plan badge */}
      {m.plan !== 'free' && (
        <div className="flex justify-end mb-2">
          <span className={`badge ${m.plan === 'pro' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-500'}`}>
            {m.plan === 'pro' ? '⭐ Pro' : 'Standard'}
          </span>
        </div>
      )}

      {/* Avatar + Name */}
      <div className="flex gap-3.5 items-start mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${m.type === 'mobile' ? 'bg-purple-500/20' : 'bg-brand-500/20'}`}>
          {m.type === 'mobile' ? '🚗' : '🏪'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-gray-100 truncate group-hover:text-brand-500 transition-colors">
              {m.name}
            </h3>
            {m.verified && <span className="text-emerald-400 text-sm">✓</span>}
          </div>
          <p className="text-gray-500 text-sm">
            📍 {m.area ? `${m.area}, ` : ''}{m.city ?? 'Location unknown'}
            {hasDistance && (
              <span className="ml-1 text-brand-500/80">{formatDistance(m.distance!)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        {hasRating && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`text-sm ${i <= Math.round(m.rating) ? 'text-amber-400' : 'text-gray-700'}`}>
                ★
              </span>
            ))}
          </div>
        )}
        <span className="text-sm text-gray-400">
          {hasRating ? `${m.rating.toFixed(1)} (${m.review_count})` : 'No reviews yet'}
        </span>
      </div>

      {/* Services */}
      {m.services?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {m.services.slice(0, 3).map(s => (
            <span key={s} className="tag">{s}</span>
          ))}
          {m.services.length > 3 && (
            <span className="tag">+{m.services.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isOpen ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isOpen ? '🟢 Open' : '🔴 Unavailable'}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">
            {m.type === 'mobile' ? '📱 Mobile' : '🏪 Shop'}
          </span>
        </div>
        {PRICE_LABELS[m.priceRange] && (
          <span className="text-gray-500">{PRICE_LABELS[m.priceRange]}</span>
        )}
      </div>

    </Link>
  )
}