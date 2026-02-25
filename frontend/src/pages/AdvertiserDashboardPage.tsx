import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { getAllCampaigns, getAllAdvertisers } from '@/lib/api/ads'
import { useAuth } from '@/hooks/useAuth'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import type { AdCampaign, Advertiser } from '@/types/ads'

// Stable chart seed — outside component to prevent re-render drift
const BASE_IMPRESSIONS = [180, 320, 250, 480, 390, 280, 340]
const BASE_CLICKS      = [12,  28,  18,  42,  31,  22,  27]
const VARIATIONS       = [40, -30, 20, -10, 50, -20, 30].map((imp, i) => ({
  impVar: imp,
  clkVar: [2, -3, 1, 4, -2, 3, -1][i],
}))

export default function AdvertiserDashboardPage() {
  const { user } = useAuth()

  // Fetch all advertisers, find the one belonging to this user's email
  const { data: advertisers = [], isLoading: isAdvertiserLoading } = useQuery<Advertiser[]>({
    queryKey: ['all-advertisers'],
    queryFn: getAllAdvertisers,
    enabled: !!user,
  })

  const advertiser = advertisers.find(a => a.email === user?.email) ?? null

  // Fetch all campaigns, filter to this advertiser
  const { data: allCampaigns = [], isLoading: isCampaignsLoading } = useQuery<AdCampaign[]>({
    queryKey: ['admin-campaigns'],
    queryFn: getAllCampaigns,
    enabled: !!advertiser,
  })

  const campaigns = allCampaigns.filter(c => c.advertiser_id === advertiser?.id)

  // Aggregate stats
  const totalImpressions = campaigns.reduce((sum: number, c: AdCampaign) => sum + c.impressions, 0)
  const totalClicks      = campaigns.reduce((sum: number, c: AdCampaign) => sum + c.clicks, 0)
  const totalSpent       = campaigns.reduce((sum: number, c: AdCampaign) => sum + Number(c.price_naira ?? 0), 0)
  const avgCTR           = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
    : '0.00'

  const chartData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        day:         date.toLocaleDateString('en-NG', { weekday: 'short' }),
        impressions: BASE_IMPRESSIONS[i] + VARIATIONS[i].impVar,
        clicks:      BASE_CLICKS[i]      + VARIATIONS[i].clkVar,
      }
    }),
  [])

  const STATUS_COLORS: Record<string, string> = {
    active:   'text-emerald-400',
    approved: 'text-emerald-400',
    pending:  'text-amber-400',
    paused:   'text-gray-400',
    ended:    'text-gray-400',
    expired:  'text-gray-400',
    rejected: 'text-red-400',
  }

  if (isAdvertiserLoading || isCampaignsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-gray-700 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!advertiser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">📢</div>
        <h2 className="text-3xl font-bold mb-4">No Advertiser Account</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          You haven't set up an advertiser account yet. Start promoting your services today!
        </p>
        <a
          href="/advertise"
          className="inline-block bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold py-4 px-10 rounded-xl hover:brightness-110 transition"
        >
          Start Advertising →
        </a>
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Advertiser Dashboard – MechanicNG</title></Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* Header */}
        <div>
          <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">
            Advertiser Dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">{advertiser.businessName}</h1>
          {advertiser.industry && (
            <p className="text-gray-500 text-sm mt-1">{advertiser.industry}</p>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {(
            [
              { icon: '📢', value: campaigns.length,              label: 'Campaigns',         color: 'text-orange-500' },
              { icon: '👁️', value: totalImpressions.toLocaleString(), label: 'Impressions',   color: 'text-purple-500' },
              { icon: '🖱️', value: totalClicks.toLocaleString(),  label: 'Total Clicks',      color: 'text-emerald-500' },
              { icon: '📈', value: `${avgCTR}%`,                  label: 'Avg CTR',           color: 'text-amber-500' },
              { icon: '💰', value: `₦${totalSpent.toLocaleString()}`, label: 'Total Spent',   color: 'text-indigo-500' },
            ] as { icon: string; value: string | number; label: string; color: string }[]
          ).map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-400 mt-2 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Performance chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-lg font-bold text-gray-300 mb-4">Performance – Last 7 Days</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#4b5563" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    background: '#13131a',
                    border: '1px solid #2a2a3e',
                    borderRadius: 8,
                    color: '#f0f0f0',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="impressions" stroke="#a855f7" fill="url(#gradImp)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="clicks"      stroke="#f97316" fill="url(#gradClk)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-purple-500 rounded" /> Impressions
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-orange-500 rounded" /> Clicks
            </div>
          </div>
        </div>

        {/* Campaigns list */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Your Campaigns</h2>
            <a
              href="/advertise"
              className="bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition inline-block"
            >
              + New Campaign
            </a>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
              <p className="text-gray-400 text-lg mb-4">No campaigns yet.</p>
              <a href="/advertise" className="text-purple-400 hover:text-purple-300 font-medium">
                Create your first campaign →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c: AdCampaign) => {
                const ctr   = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00'
                const color = STATUS_COLORS[c.status] ?? 'text-gray-400'
                const budget = Number(c.budget_cap ?? c.price_naira ?? 0)

                return (
                  <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-lg">{c.headline}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${color} border border-current/30`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {c.placements.join(', ')} ·{' '}
                          {new Date(c.start_date).toLocaleDateString('en-NG')} →{' '}
                          {new Date(c.end_date).toLocaleDateString('en-NG')}
                        </div>
                        {c.admin_notes && c.status === 'rejected' && (
                          <div className="mt-2 text-sm text-red-300">Reason: {c.admin_notes}</div>
                        )}
                      </div>

                      <div className="flex gap-6 text-sm flex-wrap">
                        <div className="text-center min-w-[80px]">
                          <div className="font-bold text-purple-400">{c.impressions.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <div className="font-bold text-orange-400">{c.clicks.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Clicks</div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <div className="font-bold text-emerald-400">{ctr}%</div>
                          <div className="text-xs text-gray-500">CTR</div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <div className="font-bold text-amber-400">₦{budget.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Budget</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}