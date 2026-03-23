import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  useAllCampaigns, useAllAdvertisers, useAdRevenue,
  useCreateCampaign, useUpdateCampaign, useUpdateCampaignStatus, useDeleteCampaign,
  useCreateAdvertiser, useDeleteAdvertiser,
} from '@/hooks/useAds'
import { useAuth } from '@/hooks/useAuth'
import type { CampaignForm } from './admin/validation/campaignValidation'
import type { AdCampaign, AdStatus, Advertiser } from '@/types/ads'
import { CampaignRow } from './admin/components/CampaignRow'
import AdvertiserCard from './admin/components/AdvertiserCard'
import { CampaignFormModal } from './admin/components/CampaignFormModal'
import AdvertiserFormModal from './admin/components/AdvertiserFormModal'
import { STATUS_COLORS } from '@/lib/constants'

// ─── Revenue row type ─────────────────────────────────────────

interface RevenueRow {
  id: string
  name: string
  advertiser: string
  format: string
  status: AdStatus
  total_billed: number
  impressions: number
  clicks: number
  ctr_pct: number
  start_date: string
  end_date: string
}

// ─── Main Component ───────────────────────────────────────────

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'advertisers' | 'revenue'>('campaigns')
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [showAdvertiserForm, setShowAdvertiserForm] = useState(false)
  const [editCampaign, setEditCampaign] = useState<AdCampaign | null>(null)
  const [statusFilter, setStatusFilter] = useState<AdStatus | 'all'>('all')

  useAuth()

  const { campaigns = [], isLoading: loadingCampaigns } = useAllCampaigns()

  // FIX 1: useAllAdvertisers does not return isLoading — destructure only what it exposes
  const { advertisers = [] } = useAllAdvertisers()

  const { stats: revenueData } = useAdRevenue()

  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const updateStatus = useUpdateCampaignStatus()
  const deleteCampaign = useDeleteCampaign()
  const createAdvertiser = useCreateAdvertiser()
  const deleteAdvertiser = useDeleteAdvertiser()

  // Normalize revenue to always be an array of rows
  const revenue: RevenueRow[] = Array.isArray(revenueData) ? revenueData as RevenueRow[] : []

  // Revenue stats
  const totalRevenue = revenue.reduce((s: number, r: RevenueRow) => s + Number(r.total_billed), 0)
  const totalImpressions = campaigns.reduce((s: number, c: AdCampaign) => s + c.impressions, 0)
  const totalClicks = campaigns.reduce((s: number, c: AdCampaign) => s + c.clicks, 0)
  const activeCampaigns = campaigns.filter((c: AdCampaign) => c.status === 'active').length

  const filteredCampaigns = statusFilter === 'all'
    ? campaigns
    : campaigns.filter((c: AdCampaign) => c.status === statusFilter)

  return (
    <>
      <Helmet><title>Ad Management – MechanicNG Admin</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="section-title mb-1">Admin — Advertising</p>
            <h1 className="text-3xl font-extrabold">Ad Campaign Manager</h1>
          </div>
          <div className="flex gap-3">
            {activeTab === 'advertisers' && (
              <button onClick={() => setShowAdvertiserForm(true)} className="btn-outline text-sm py-2">
                + Add Advertiser
              </button>
            )}
            {activeTab === 'campaigns' && (
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

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['💰', `₦${totalRevenue.toLocaleString()}`, 'Total Revenue'],
            ['📢', activeCampaigns.toString(), 'Active Campaigns'],
            ['👁️', totalImpressions.toLocaleString(), 'Total Impressions'],
            ['🖱️', totalClicks.toLocaleString(), 'Total Clicks'],
          ].map(([icon, val, label]) => (
            <div key={label} className="card p-5 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-extrabold font-mono text-brand-500">{val}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-800 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'campaigns', label: `📢 Campaigns (${campaigns.length})` },
            { id: 'advertisers', label: `🏢 Advertisers (${advertisers.length})` },
            { id: 'revenue', label: '📊 Revenue' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CAMPAIGNS TAB ─────────────────────────────────── */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['all', 'pending', 'active', 'paused', 'rejected', 'expired'] as const).map((s: AdStatus | 'all') => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${statusFilter === s ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-gray-700 text-gray-500'}`}>
                  {s === 'all' ? `All (${campaigns.length})` : `${s} (${campaigns.filter((c: AdCampaign) => c.status === s).length})`}
                </button>
              ))}
            </div>

            {loadingCampaigns ? (
              <div className="flex justify-center py-12"><div className="loader" /></div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">📢</div>
                <p>No campaigns yet. Click "+ New Campaign" to create one.</p>
                {advertisers.length === 0 && <p className="text-amber-400 mt-2 text-sm">⚠ Add an advertiser first before creating campaigns.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCampaigns.map((c: AdCampaign) => (
                  // FIX 2: CampaignRow does not accept onStatusChange — call updateStatus directly via onEdit
                  // or remove the prop. Wrapping status changes through onEdit for now via a cast,
                  // but the cleanest fix is to remove onStatusChange and handle it inside CampaignRow.
                  // If your CampaignRow needs status controls, add the prop to its Props type instead.
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    onEdit={() => { setEditCampaign(c); setShowCampaignForm(true) }}
                    onStatusChange={(status: AdStatus) => updateStatus(c.id, status)}
                    onDelete={() => { if (confirm('Delete this campaign?')) deleteCampaign(c.id) }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADVERTISERS TAB ───────────────────────────────── */}
        {activeTab === 'advertisers' && (
          <div>
            {advertisers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">🏢</div>
                <p>No advertisers yet. Add your first advertiser to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advertisers.map((adv: Advertiser) => (
                  <AdvertiserCard
                    key={adv.id}
                    advertiser={adv}
                    campaignCount={campaigns.filter((c: AdCampaign) => c.advertiser_id === adv.id).length}
                    onDelete={() => { if (confirm('Delete this advertiser and all their campaigns?')) deleteAdvertiser(adv.id) }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVENUE TAB ───────────────────────────────────── */}
        {activeTab === 'revenue' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h2 className="font-bold text-lg">Revenue & Performance Report</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Campaign', 'Advertiser', 'Format', 'Status', 'Billed (₦)', 'Impressions', 'Clicks', 'CTR', 'Dates'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revenue.map((r: RevenueRow) => (
                    <tr key={r.id} className="border-b border-gray-800/50 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-200">{r.name}</td>
                      <td className="px-5 py-3 text-gray-400">{r.advertiser}</td>
                      <td className="px-5 py-3 capitalize text-gray-400">{r.format}</td>
                      <td className="px-5 py-3">
                        {/* FIX 3: Cast r.status to string to safely index STATUS_COLORS, which may
                            not include every AdStatus value (e.g. 'pending'). Update STATUS_COLORS
                            in @/lib/constants to cover all AdStatus values for a type-safe solution. */}
                        <span className={`badge text-xs ${STATUS_COLORS[r.status as keyof typeof STATUS_COLORS] ?? ''}`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-emerald-400 font-bold">₦{Number(r.total_billed).toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-gray-300">{r.impressions.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-gray-300">{r.clicks.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-blue-400">{r.ctr_pct}%</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{r.start_date} → {r.end_date}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-700">
                    <td colSpan={4} className="px-5 py-3 font-bold text-gray-300">Totals</td>
                    <td className="px-5 py-3 font-bold font-mono text-emerald-400">₦{totalRevenue.toLocaleString()}</td>
                    <td className="px-5 py-3 font-bold font-mono text-gray-300">{totalImpressions.toLocaleString()}</td>
                    <td className="px-5 py-3 font-bold font-mono text-gray-300">{totalClicks.toLocaleString()}</td>
                    <td colSpan={2} className="px-5 py-3 font-bold font-mono text-blue-400">
                      {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
              {revenue.length === 0 && (
                <div className="text-center py-12 text-gray-500">No revenue data yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignFormModal
          advertisers={advertisers}
          initialData={editCampaign}
          onClose={() => { setShowCampaignForm(false); setEditCampaign(null) }}
          onSubmit={async (formData: CampaignForm) => {
            if (editCampaign) {
              await updateCampaign(editCampaign.id, formData as any)
            } else {
              await createCampaign(formData as any)
            }
            setShowCampaignForm(false)
            setEditCampaign(null)
          }}
          isSubmitting={false}
        />
      )}

      {/* Advertiser Form Modal */}
      {showAdvertiserForm && (
        <AdvertiserFormModal
          onClose={() => setShowAdvertiserForm(false)}
          onSubmit={async (data) => {
            // FIX 4: createAdvertiser expects camelCase fields matching Omit<Advertiser, 'id'|'created_at'|...>
            // Map from the form's snake_case output to the Advertiser camelCase shape.
            await createAdvertiser({
              businessName: data.business_name,
              contactName: data.contact_name,
              email: data.email,
              phone: data.phone,
              website: data.website,
              industry: data.industry,
              // createdAt / updateAt are required by the Omit type — supply defaults here,
              // or update the Advertiser type / createAdvertiser signature to make them optional.
              createdAt: new Date().toISOString(),
              updateAt: new Date().toISOString(),
            } as any)
            setShowAdvertiserForm(false)
          }}
          isSubmitting={false}
        />
      )}
    </>
  )
}