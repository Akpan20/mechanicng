import type { Advertiser } from '@/types/ads'

interface Props {
  advertiser: Advertiser
  campaignCount: number
  onDelete: () => void
}

export default function AdvertiserCard({ advertiser: a, campaignCount, onDelete }: Props) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-100">{a.businessName}</h3>          {/* ✅ camelCase */}
          {a.industry && <p className="text-xs text-brand-500 font-semibold">{a.industry}</p>}
        </div>
        <span className="badge bg-brand-500/10 text-brand-500 text-xs">
          {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-400 mb-4">
        <p>👤 {a.contactName}</p>                                                {/* ✅ camelCase */}
        <p>✉️ {a.email}</p>
        <p>📞 {a.phone}</p>
        {a.website && <p className="truncate">🌐 {a.website}</p>}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">
          {new Date(a.createdAt).toLocaleDateString('en-NG')}                     {/* ✅ camelCase */}
        </span>
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-400 transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}