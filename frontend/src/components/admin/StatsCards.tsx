import { FC } from 'react'

export interface CampaignStats {
  totalCampaigns: number
  activeCampaigns: number
  totalImpressions: number
  totalClicks: number
  totalSpent: number
  averageCTR: number // as percentage
}

interface StatsCardsProps {
  stats: CampaignStats
}

export const StatsCards: FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Total Campaigns', value: stats.totalCampaigns, icon: '📊' },
    { label: 'Active', value: stats.activeCampaigns, icon: '✅' },
    { label: 'Impressions', value: stats.totalImpressions.toLocaleString(), icon: '👁️' },
    { label: 'Clicks', value: stats.totalClicks.toLocaleString(), icon: '🖱️' },
    { label: 'Spent (₦)', value: stats.totalSpent.toLocaleString(), icon: '💰' },
    { label: 'CTR', value: `${stats.averageCTR.toFixed(2)}%`, icon: '📈' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="card p-4 flex items-center gap-3">
          <div className="text-3xl">{card.icon}</div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">{card.label}</p>
            <p className="text-xl font-extrabold text-white">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}