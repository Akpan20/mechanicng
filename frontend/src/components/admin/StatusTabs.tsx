import { FC } from 'react'

export type CampaignStatus = 'pending' | 'active' | 'paused' | 'ended' | 'rejected'

interface StatusCounts {
  pending: number
  active: number
  paused: number
  ended: number
  rejected: number
}

interface StatusTabsProps {
  selected: CampaignStatus | 'all'
  counts: StatusCounts
  onChange: (status: CampaignStatus | 'all') => void // eslint-disable-line no-unused-vars
}

const statusLabels: Record<CampaignStatus | 'all', string> = {
  all: 'All',
  pending: 'Pending',
  active: 'Active',
  paused: 'Paused',
  ended: 'Ended',
  rejected: 'Rejected',
}

const statusColors: Record<CampaignStatus | 'all', string> = {
  all: 'text-gray-400',
  pending: 'text-amber-400',
  active: 'text-emerald-400',
  paused: 'text-blue-400',
  ended: 'text-purple-400',
  rejected: 'text-red-400',
}

export const StatusTabs: FC<StatusTabsProps> = ({ selected, counts, onChange }) => {
  const tabs = (Object.keys(statusLabels) as Array<CampaignStatus | 'all'>).map(status => ({
    status,
    label: statusLabels[status],
    count: status === 'all' 
      ? Object.values(counts).reduce((a, b) => a + b, 0) 
      : counts[status as CampaignStatus],
    color: statusColors[status],
  }))

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {tabs.map(({ status, label, count, color }) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
            selected === status
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600'
          }`}
        >
          <span className={selected === status ? 'text-white' : color}>{label}</span>
          {count > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              selected === status ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}