// CampaignRow.tsx
import type { AdCampaign } from '@/types/ads'
import { STATUS_COLORS } from '@/lib/constants'

interface Props {
  campaign: AdCampaign
  onApprove: () => void
  onReject:  () => void
  onPause:   () => void
  onResume:  () => void
  onEdit:    () => void
  onDelete:  () => void
}

export function CampaignRow({
  campaign,
  onApprove,
  onReject,
  onPause,
  onResume,
  onEdit,
  onDelete,
}: Props) {
  const { name, status, headline, impressions, clicks, start_date, end_date, price_naira, format, placements } = campaign

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00'

  return (
    <div className="bg-[#0d0d16] border border-[#1e1e2e] rounded-xl p-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-white truncate">{name}</h3>
            <span className={`badge text-xs shrink-0 ${STATUS_COLORS[status]}`}>{status}</span>
            <span className="text-xs text-gray-600 shrink-0 capitalize">{format}</span>
          </div>
          <p className="text-sm text-gray-400 truncate">{headline}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <span>📅 {start_date} → {end_date}</span>
            <span>👁 {impressions.toLocaleString()}</span>
            <span>🖱 {clicks.toLocaleString()}</span>
            <span>CTR {ctr}%</span>
            {price_naira != null && <span>₦{price_naira.toLocaleString()}</span>}
          </div>
          {placements?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {placements.map(p => (
                <span key={p} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">{p}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {status === 'pending' && (
            <>
              <button
                onClick={onApprove}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors"
              >
                ✓ Approve
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                ✕ Reject
              </button>
            </>
          )}
          {status === 'active' && (
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30 transition-colors"
            >
              ⏸ Pause
            </button>
          )}
          {status === 'paused' && (
            <button
              onClick={onResume}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-colors"
            >
              ▶ Resume
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 text-xs font-bold hover:bg-gray-700 transition-colors"
          >
            ✎ Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-500 text-xs font-bold hover:bg-red-900/40 transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  )
}