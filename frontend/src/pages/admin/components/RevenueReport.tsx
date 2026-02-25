// src/pages/admin/components/RevenueReport.tsx
import type { AdCampaign, AdStatus } from '@/types/ads'

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-400',
  active:   'bg-emerald-500/20 text-emerald-400',
  paused:   'bg-blue-500/20 text-blue-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired:  'bg-gray-700 text-gray-400',
}

interface RevenueItem {
  id: string
  name: string
  advertiser: string
  format: string
  status: AdStatus
  total_billed: number | string
  impressions: number
  clicks: number
  ctr_pct: number
  start_date: string
  end_date: string
}

interface RevenueReportProps {
  revenue: RevenueItem[]
  campaigns: AdCampaign[]
}

export default function RevenueReport({ revenue, campaigns }: RevenueReportProps) {
  const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.total_billed ?? 0), 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions ?? 0), 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks ?? 0), 0)
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

  if (revenue.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-500">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold mb-3">No revenue data yet</h3>
        <p>Revenue will appear here once campaigns start generating billable activity.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">Revenue & Performance Report</h2>
        <p className="text-sm text-gray-500 mt-1">
          Summary of billed amounts, impressions, and engagement
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-900/40 border-b border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Advertiser</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Format</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Billed (₦)</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Impressions</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Clicks</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">CTR</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
            </tr>
          </thead>
          <tbody>
            {revenue.map(item => (
              <tr
                key={item.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-100">{item.name}</td>
                <td className="px-6 py-4 text-gray-400">{item.advertiser}</td>
                <td className="px-6 py-4 capitalize text-gray-400">{item.format}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-700 text-gray-300'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                  ₦{Number(item.total_billed).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono text-gray-300">{item.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 font-mono text-gray-300">{item.clicks.toLocaleString()}</td>
                <td className="px-6 py-4 font-mono text-blue-400">{item.ctr_pct.toFixed(2)}%</td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {item.start_date} → {item.end_date}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-900/60">
            <tr className="border-t-2 border-gray-700">
              <td colSpan={4} className="px-6 py-4 font-bold text-gray-200">Totals</td>
              <td className="px-6 py-4 font-bold font-mono text-emerald-400">
                ₦{totalRevenue.toLocaleString()}
              </td>
              <td className="px-6 py-4 font-bold font-mono text-gray-200">
                {totalImpressions.toLocaleString()}
              </td>
              <td className="px-6 py-4 font-bold font-mono text-gray-200">
                {totalClicks.toLocaleString()}
              </td>
              <td className="px-6 py-4 font-bold font-mono text-blue-400">
                {overallCTR}%
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}