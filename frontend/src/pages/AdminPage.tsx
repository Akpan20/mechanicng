import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAllMechanicsAdmin, useUpdateMechanicStatus } from '@/hooks/useMechanics'
import type { Mechanic, MechanicStatus } from '@/types'
import { PLAN_COLORS, STATUS_COLORS } from '@/lib/constants'
import toast from 'react-hot-toast'
import {
  useAllCampaigns, useAllAdvertisers, useAdRevenue,
  useCreateCampaign, useUpdateCampaign, useUpdateCampaignStatus, useDeleteCampaign,
  useCreateAdvertiser, useDeleteAdvertiser,
} from '@/hooks/useAds'
import type { AdCampaign, AdStatus } from '@/types/ads'
import { CampaignRow }       from '@/pages/admin/components/CampaignRow'
import AdvertiserCard        from '@/pages/admin/components/AdvertiserCard'
import { CampaignFormModal } from '@/pages/admin/components/CampaignFormModal'
import AdvertiserFormModal   from '@/pages/admin/components/AdvertiserFormModal'

const MECH_TABS: { id: MechanicStatus | 'all'; label: string }[] = [
  { id: 'pending',   label: '⏳ Pending'   },
  { id: 'approved',  label: '✅ Approved'  },
  { id: 'rejected',  label: '❌ Rejected'  },
  { id: 'suspended', label: '⛔ Suspended' },
  { id: 'all',       label: '📋 All'       },
]

// Extract registration date from created_at or fallback to ObjectID timestamp
function getRegisteredDate(m: Mechanic): string {
  if (m.created_at) {
    const d = new Date(m.created_at)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-NG')
  }
  try {
    const timestamp = parseInt(m.id.substring(0, 8), 16) * 1000
    const d = new Date(timestamp)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-NG')
  } catch {
    // ObjectID parsing failed — fall through to 'Unknown'
  }
  return 'Unknown'
}

export default function AdminPage() {
  const [mainTab, setMainTab] = useState<'mechanics' | 'ads'>('mechanics')

  // ── Mechanics ─────────────────────────────────────────────
  const [mechTab, setMechTab] = useState<MechanicStatus | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const limit = 12

  const { data, isLoading } = useAllMechanicsAdmin({
    city:   search || undefined,
    page,
    limit,
    status: mechTab === 'all' ? undefined : mechTab,
  })

  const mechanics    = data?.mechanics ?? []
  const updateStatus = useUpdateMechanicStatus()

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; id?: string; status?: MechanicStatus; name?: string
  }>({ open: false })

  const counts = {
    pending:   mechanics.filter(m => m.status === 'pending').length,
    approved:  mechanics.filter(m => m.status === 'approved').length,
    rejected:  mechanics.filter(m => m.status === 'rejected').length,
    suspended: mechanics.filter(m => m.status === 'suspended').length,
    all:       mechanics.length,
  }

  const handleMechanicStatus = (id: string, status: MechanicStatus, name: string) => {
    if (status === 'approved') {
      updateStatus.mutate({ id, status })
    } else {
      setConfirmDialog({ open: true, id, status, name })
    }
  }

  // ── Ads ───────────────────────────────────────────────────
  const [adsTab, setAdsTab]                                 = useState<'campaigns' | 'advertisers' | 'revenue'>('campaigns')
  const [showCampaignForm, setShowCampaignForm]             = useState(false)
  const [showAdvertiserForm, setShowAdvertiserForm]         = useState(false)
  const [editCampaign, setEditCampaign]                     = useState<AdCampaign | null>(null)
  const [statusFilter, setStatusFilter]                     = useState<AdStatus | 'all'>('all')
  const [isSubmittingCampaign, setIsSubmittingCampaign]     = useState(false)
  const [isSubmittingAdvertiser, setIsSubmittingAdvertiser] = useState(false)

  const { campaigns = [],   isLoading: loadingCampaigns } = useAllCampaigns()
  const { advertisers = [] }                               = useAllAdvertisers()
  const { stats }                                          = useAdRevenue()
  const loadingAdvertisers                                 = false

  const createCampaign   = useCreateCampaign()
  const updateCampaign   = useUpdateCampaign()
  const updateAdStatus   = useUpdateCampaignStatus()
  const deleteCampaign   = useDeleteCampaign()
  const createAdvertiser = useCreateAdvertiser()
  const deleteAdvertiser = useDeleteAdvertiser()

  const totalRevenue     = stats?.revenue_this_month ?? 0
  const totalImpressions = stats?.total_impressions  ?? campaigns.reduce((s, c) => s + c.impressions, 0)
  const totalClicks      = stats?.total_clicks       ?? campaigns.reduce((s, c) => s + c.clicks, 0)
  const activeCampaigns  = stats?.active_campaigns   ?? campaigns.filter(c => c.status === 'active').length

  const filteredCampaigns = statusFilter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter)

  function handleAdStatusChange(id: string, status: AdStatus) {
    updateAdStatus(id, status).catch(() => {})
  }

  return (
    <>
      <Helmet><title>Admin Panel – MechanicNG</title></Helmet>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="section-title mb-2">Admin Panel</p>
          <h1 className="text-3xl font-extrabold">Site Management</h1>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'mechanics', label: '🔧 Mechanics',   badge: counts.pending },
            { id: 'ads',       label: '📢 Advertising', badge: null           },
          ].map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id as typeof mainTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mainTab === t.id ? 'bg-brand-500 text-white' : 'bg-surface-800 border border-gray-800 text-gray-400 hover:text-white'
              }`}>
              {t.label}
              {t.badge ? (
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ══ MECHANICS ══ */}
        {mainTab === 'mechanics' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {([
                ['Total',    data?.total ?? 0, '#f97316'],
                ['Pending',  counts.pending,   '#f59e0b'],
                ['Approved', counts.approved,  '#10b981'],
                ['Rejected', counts.rejected,  '#ef4444'],
              ] as const).map(([label, val, color]) => (
                <div key={label} className="card p-5 text-center">
                  <div className="text-3xl font-black font-mono mb-1" style={{ color }}>{val}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex gap-1 bg-surface-800 border border-gray-800 rounded-xl p-1 flex-wrap">
                {MECH_TABS.map(t => (
                  <button key={t.id} onClick={() => { setMechTab(t.id); setPage(1) }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      mechTab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}>
                    {t.label} ({counts[t.id as keyof typeof counts] ?? mechanics.length})
                  </button>
                ))}
              </div>
              <input
                className="input flex-1 text-sm"
                placeholder="Search by name or city..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><div className="loader" /></div>
            ) : mechanics.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No mechanics in this category.</div>
            ) : (
              <div className="space-y-3">
                {mechanics.map(m => (
                  <div key={m.id} className="card p-5">
                    <div className="flex gap-4 items-start flex-wrap">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        m.type === 'mobile' ? 'bg-purple-500/20' : 'bg-brand-500/20'
                      }`}>
                        {m.type === 'mobile' ? '🚗' : '🏪'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{m.name}</h3>
                          <span
                            className="badge text-xs"
                            style={{ background: PLAN_COLORS[m.plan] + '20', color: PLAN_COLORS[m.plan] }}
                          >
                            {m.plan === 'pro' ? '⭐ Pro' : m.plan === 'standard' ? 'Standard' : 'Free'}
                          </span>
                          <span className={`badge text-xs ${
                            m.status === 'approved'  ? 'bg-emerald-500/20 text-emerald-400' :
                            m.status === 'pending'   ? 'bg-amber-500/20  text-amber-400'   :
                            m.status === 'suspended' ? 'bg-gray-500/20   text-gray-400'    :
                                                       'bg-red-500/20    text-red-400'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">
                          📍 {m.area ? `${m.area}, ` : ''}{m.city} · 📞 {m.phone} · ✉ {m.email}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.services.slice(0, 4).map(s => (
                            <span key={s} className="tag text-xs">{s}</span>
                          ))}
                          {m.services.length > 4 && (
                            <span className="tag text-xs">+{m.services.length - 4}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {m.status !== 'approved' && (
                          <button
                            onClick={() => handleMechanicStatus(m.id, 'approved', m.name)}
                            disabled={updateStatus.isPending}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                            ✓ Approve
                          </button>
                        )}
                        {m.status !== 'rejected' && (
                          <button
                            onClick={() => handleMechanicStatus(m.id, 'rejected', m.name)}
                            disabled={updateStatus.isPending}
                            className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50">
                            ✗ Reject
                          </button>
                        )}
                        {m.status === 'approved' && (
                          <button
                            onClick={() => handleMechanicStatus(m.id, 'suspended', m.name)}
                            disabled={updateStatus.isPending}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-50">
                            ⛔ Suspend
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-600">
                      <span>ID: {m.id}</span>
                      <span>Registered: {getRegisteredDate(m)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(data?.totalPages ?? 1) > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
                <span className="text-sm text-gray-400">Page {data?.page ?? 1} of {data?.totalPages ?? 1}</span>
                <button className="btn" onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)}>Next</button>
              </div>
            )}
          </>
        )}

        {/* ══ ADS ══ */}
        {mainTab === 'ads' && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <p className="section-title mb-1">Advertising</p>
                <h2 className="text-2xl font-extrabold">Ad Campaign Manager</h2>
              </div>
              <div className="flex gap-3">
                {adsTab === 'advertisers' && (
                  <button onClick={() => setShowAdvertiserForm(true)} className="btn-outline text-sm py-2">
                    + Add Advertiser
                  </button>
                )}
                {adsTab === 'campaigns' && (
                  <button
                    onClick={() => { setEditCampaign(null); setShowCampaignForm(true) }}
                    className="btn-primary text-sm py-2"
                    disabled={advertisers.length === 0}
                    title={advertisers.length === 0 ? 'Add an advertiser first' : ''}
                  >
                    + New Campaign
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                ['💰', `₦${totalRevenue.toLocaleString()}`,       'Revenue This Month'],
                ['📢', activeCampaigns.toString(),                 'Active Campaigns'  ],
                ['👁️', totalImpressions.toLocaleString(),         'Total Impressions' ],
                ['🖱️', totalClicks.toLocaleString(),              'Total Clicks'      ],
              ].map(([icon, val, label]) => (
                <div key={label} className="card p-5 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-2xl font-extrabold font-mono text-brand-500">{val}</div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-1 bg-surface-800 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
              {[
                { id: 'campaigns',   label: `📢 Campaigns (${campaigns.length})`     },
                { id: 'advertisers', label: `🏢 Advertisers (${advertisers.length})` },
                { id: 'revenue',     label: '📊 Revenue'                              },
              ].map(t => (
                <button key={t.id} onClick={() => setAdsTab(t.id as typeof adsTab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    adsTab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Campaigns */}
            {adsTab === 'campaigns' && (
              <div>
                <div className="flex gap-2 mb-5 flex-wrap">
                  {(['all', 'pending', 'active', 'paused', 'rejected', 'expired'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                        statusFilter === s
                          ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                          : 'border-gray-700 text-gray-500'
                      }`}>
                      {s === 'all'
                        ? `All (${campaigns.length})`
                        : `${s} (${campaigns.filter(c => c.status === s).length})`}
                    </button>
                  ))}
                </div>
                {loadingCampaigns ? (
                  <div className="flex justify-center py-12"><div className="loader" /></div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-5xl mb-3">📢</div>
                    <p>No campaigns yet. Click "+ New Campaign" to create one.</p>
                    {advertisers.length === 0 && (
                      <p className="text-amber-400 mt-2 text-sm">⚠ Add an advertiser first before creating campaigns.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCampaigns.map(c => (
                      <CampaignRow
                        key={c.id}
                        campaign={c}
                        onStatusChange={status => handleAdStatusChange(c.id, status)}
                        onEdit={() => { setEditCampaign(c); setShowCampaignForm(true) }}
                        onDelete={() => {
                          if (window.confirm('Delete this campaign? This cannot be undone.')) {
                            deleteCampaign(c.id).catch(() => {})
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Advertisers */}
            {adsTab === 'advertisers' && (
              <div>
                {loadingAdvertisers ? (
                  <div className="flex justify-center py-12"><div className="loader" /></div>
                ) : advertisers.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-5xl mb-3">🏢</div>
                    <p>No advertisers yet. Add your first advertiser to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {advertisers.map(adv => (
                      <AdvertiserCard
                        key={adv.id}
                        advertiser={adv}
                        campaignCount={campaigns.filter(c => c.advertiser_id === adv.id).length}
                        onDelete={() => {
                          if (window.confirm('Delete this advertiser and all their campaigns?')) {
                            deleteAdvertiser(adv.id).catch(() => {})
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Revenue */}
            {adsTab === 'revenue' && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-800">
                  <h3 className="font-bold text-lg">Revenue & Performance Summary</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6">
                  {[
                    ['💰 Revenue This Month', `₦${(stats?.revenue_this_month ?? 0).toLocaleString()}`],
                    ['📢 Active Campaigns',    stats?.active_campaigns  ?? 0                          ],
                    ['⏳ Pending Approval',    stats?.pending_approval  ?? 0                          ],
                    ['🏢 Total Advertisers',   stats?.total_advertisers ?? 0                          ],
                    ['👁️ Total Impressions',  (stats?.total_impressions ?? 0).toLocaleString()        ],
                    ['🖱️ Total Clicks',       (stats?.total_clicks     ?? 0).toLocaleString()        ],
                  ].map(([label, val]) => (
                    <div key={label} className="card p-5 text-center">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">{label}</div>
                      <div className="text-2xl font-extrabold font-mono text-brand-500">{val}</div>
                    </div>
                  ))}
                </div>
                {!stats && <div className="text-center py-8 text-gray-500">No stats available yet.</div>}
                {campaigns.length > 0 && (
                  <div className="border-t border-gray-800">
                    <div className="p-5 border-b border-gray-800">
                      <h3 className="font-bold text-base">Campaign Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            {['Campaign', 'Status', 'Impressions', 'Clicks', 'CTR', 'Dates'].map(h => (
                              <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map(c => {
                            const ctr = c.impressions > 0
                              ? ((c.clicks / c.impressions) * 100).toFixed(2)
                              : '0.00'
                            return (
                              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/2 transition-colors">
                                <td className="px-5 py-3 font-semibold text-gray-200">{c.name}</td>
                                <td className="px-5 py-3">
                                  <span className={`badge text-xs ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                </td>
                                <td className="px-5 py-3 font-mono text-gray-300">{c.impressions.toLocaleString()}</td>
                                <td className="px-5 py-3 font-mono text-gray-300">{c.clicks.toLocaleString()}</td>
                                <td className="px-5 py-3 font-mono text-blue-400">{ctr}%</td>
                                <td className="px-5 py-3 text-gray-500 text-xs">{c.start_date} → {c.end_date}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-700">
                            <td colSpan={2} className="px-5 py-3 font-bold text-gray-300">Totals</td>
                            <td className="px-5 py-3 font-bold font-mono text-gray-300">{totalImpressions.toLocaleString()}</td>
                            <td className="px-5 py-3 font-bold font-mono text-gray-300">{totalClicks.toLocaleString()}</td>
                            <td className="px-5 py-3 font-bold font-mono text-blue-400">
                              {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'}%
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignFormModal
          advertisers={advertisers}
          initialData={editCampaign}
          onClose={() => { setShowCampaignForm(false); setEditCampaign(null) }}
          onSubmit={async (data) => {
            setIsSubmittingCampaign(true)
            try {
              if (editCampaign) {
                await updateCampaign(editCampaign.id, data as never)
              } else {
                await createCampaign(data as never)
              }
              setShowCampaignForm(false)
              setEditCampaign(null)
            } finally {
              setIsSubmittingCampaign(false)
            }
          }}
          isSubmitting={isSubmittingCampaign}
        />
      )}

      {/* Advertiser Form Modal */}
      {showAdvertiserForm && (
        <AdvertiserFormModal
          onClose={() => setShowAdvertiserForm(false)}
          onSubmit={async (data) => {
            setIsSubmittingAdvertiser(true)
            try {
              await createAdvertiser({
                businessName: data.business_name,
                contactName:  data.contact_name,
                email:        data.email,
                phone:        data.phone,
                website:      data.website  || undefined,
                industry:     data.industry || undefined,
                createdAt:    '',
                updateAt:     '',
              })
              setShowAdvertiserForm(false)
            } finally {
              setIsSubmittingAdvertiser(false)
            }
          }}
          isSubmitting={isSubmittingAdvertiser}
        />
      )}

      {/* Mechanic confirm modal */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-900 border border-gray-800 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Confirm action</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to <strong className="text-white">{confirmDialog.status}</strong> mechanic{' '}
              <strong className="text-white">{confirmDialog.name}</strong>? This cannot be undone easily.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => setConfirmDialog({ open: false })}>Cancel</button>
              <button
                className="btn-primary bg-red-500 hover:bg-red-600"
                onClick={async () => {
                  setConfirmDialog({ open: false })
                  try {
                    await updateStatus.mutateAsync({ id: confirmDialog.id!, status: confirmDialog.status! })
                    toast.success(`Mechanic ${confirmDialog.status}`)
                  } catch (err: unknown) {
                    toast.error((err as Error).message ?? 'Failed')
                  }
                }}>
                Confirm {confirmDialog.status}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}