import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@/hooks/useAuth'
import { useMyMechanic, useUpdateMechanic } from '@/hooks/useMechanics'
import { useQuotes, useUpdateQuoteStatus } from '@/hooks/useQuotes'
import { useNavigate } from 'react-router-dom'
import { PLAN_COLORS, PLANS, SERVICES, PRICE_LABELS } from '@/lib/constants'
import { initializePayment, generateReference } from '@/lib/paystack'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { data: mechanic, isLoading } = useMyMechanic()
  const { data: quotes = [] }         = useQuotes(mechanic?.id ?? '')
  const updateQuote    = useUpdateQuoteStatus()
  const updateMechanic = useUpdateMechanic()

  const [activeTab, setActiveTab] = useState<'overview' | 'listing' | 'quotes' | 'subscription'>('overview')
  const [editMode, setEditMode]   = useState(false)
  const [editForm, setEditForm]   = useState<Record<string, unknown>>({})

  if (isLoading) return (
    <div className="flex justify-center items-center h-64"><div className="loader" /></div>
  )
  if (!mechanic) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="text-2xl font-bold mb-3">No listing found</h2>
      <p className="text-gray-400 mb-6">You haven't created a mechanic listing yet.</p>
      <button onClick={() => navigate('/signup')} className="btn-primary">Create Your Listing</button>
    </div>
  )

  const planColor     = PLAN_COLORS[mechanic.plan]
  const currentPlan   = PLANS.find(p => p.id === mechanic.plan)!
  const pendingQuotes = quotes.filter(q => q.status === 'pending')

  const handleUpgrade = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId)!
    if (plan.priceNGN === 0) return
    await initializePayment({
      email:    user!.email!,
      amount:   plan.priceNGN * 100,
      plan:     plan.paystackPlanCode,
      ref:      generateReference(),
      metadata: { mechanic_id: mechanic.id, plan: planId },
      callback: () => toast.success('Plan upgraded!'),
      onClose:  () => toast.error('Upgrade cancelled.'),
    })
  }

  const handleMarkResponded = async (quoteId: string) => {
    try {
      await updateQuote.mutateAsync({ id: quoteId, mechanicId: mechanic.id, status: 'responded' })
      toast.success('Quote marked as responded')
    } catch {
      toast.error('Failed to update quote status')
    }
  }

  const handleSave = () => {
    if (Object.keys(editForm).length === 0) {
      setEditMode(false)
      return
    }
    updateMechanic.mutate(
      { id: mechanic.id, data: editForm },
      {
        onSuccess: () => { toast.success('Listing updated!'); setEditMode(false); setEditForm({}) },
        onError:   () => toast.error('Failed to save changes'),
      }
    )
  }

  const set = (key: string, value: unknown) =>
    setEditForm(prev => ({ ...prev, [key]: value }))

  const TABS = [
    { id: 'overview',     label: '📊 Overview'  },
    { id: 'listing',      label: '📝 My Listing' },
    { id: 'quotes',       label: `💬 Quotes${pendingQuotes.length > 0 ? ` (${pendingQuotes.length})` : ''}` },
    { id: 'subscription', label: '💳 Subscription' },
  ]

  return (
    <>
      <Helmet><title>My Dashboard – MechanicNG</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              mechanic.type === 'mobile' ? 'bg-purple-500/20' : 'bg-brand-500/20'
            }`}>
              {mechanic.type === 'mobile' ? '🚗' : '🏪'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold">{mechanic.name}</h1>
                <span className="badge text-xs" style={{ background: planColor + '20', color: planColor }}>
                  {mechanic.plan.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {mechanic.area && `${mechanic.area}, `}{mechanic.city} ·
                <span className={`ml-2 font-semibold ${
                  mechanic.status === 'approved' ? 'text-emerald-400' :
                  mechanic.status === 'pending'  ? 'text-amber-400'   : 'text-red-400'
                }`}>
                  {mechanic.status === 'approved' ? '🟢 Live' :
                   mechanic.status === 'pending'  ? '⏳ Under Review' :
                   '🔴 ' + mechanic.status}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/mechanic/${mechanic.id}`)}
            className="btn-outline text-sm py-2 px-4 flex items-center gap-2 flex-shrink-0">
            👁️ View Public Profile
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-surface-800 border border-gray-800 rounded-xl p-1 mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all min-w-fit ${
                activeTab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                ['👁️', '—',                                                   'Profile Views',  '#f97316'],
                ['⭐', mechanic.rating > 0 ? mechanic.rating.toString() : '—', 'Rating',         '#f59e0b'],
                ['💬', quotes.length.toString(),                               'Total Quotes',   '#a855f7'],
                ['📋', pendingQuotes.length.toString(),                        'Pending Quotes', '#10b981'],
              ] as const).map(([icon, val, label, color]) => (
                <div key={label} className="card p-5 text-center">
                  <div className="text-3xl mb-1">{icon}</div>
                  <div className="text-2xl font-extrabold font-mono" style={{ color }}>{val}</div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Location warning */}
            {(mechanic.lat == null || mechanic.lng == null) && (
              <div className="card p-5 border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h3 className="font-bold text-amber-400 mb-1">Location Not Set</h3>
                    <p className="text-sm text-gray-400 mb-2">
                      Your listing has no coordinates. Customers can't get directions and your shop
                      won't appear in distance-based searches.
                    </p>
                    <button
                      onClick={() => { setActiveTab('listing'); setEditMode(true) }}
                      className="btn-primary text-sm py-2 px-4">
                      Add Location Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mechanic.status === 'pending' && (
              <div className="card p-5 border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <h3 className="font-bold text-amber-400 mb-1">Listing Under Review</h3>
                    <p className="text-sm text-gray-400">
                      Your listing is being reviewed by our team. This usually takes 24–48 hours.
                      You'll receive an email when it's approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Listing ── */}
        {activeTab === 'listing' && (
          <div className="card p-7 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Listing Details</h2>
              <button onClick={() => { setEditMode(!editMode); setEditForm({}) }} className="btn-outline text-sm py-2">
                {editMode ? '✕ Cancel' : '✏️ Edit'}
              </button>
            </div>

            {/* Basic info */}
            <div>
              <p className="section-title mb-3">Basic Information</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ['Business Name', mechanic.name,        'name'    ],
                  ['Phone',         mechanic.phone,       'phone'   ],
                  ['WhatsApp',      mechanic.whatsapp,    'whatsapp'],
                  ['City',          mechanic.city,        'city'    ],
                  ['Area / Zone',   mechanic.area ?? '',  'area'    ],
                  ['Business Hours',mechanic.hours,       'hours'   ],
                ] as const).map(([label, val, key]) => (
                  <div key={key}>
                    <p className="section-title mb-1">{label}</p>
                    {editMode
                      ? <input className="input text-sm" defaultValue={val}
                          onChange={e => set(key, e.target.value)} />
                      : <p className="text-gray-200 text-sm font-semibold">{val || '—'}</p>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="section-title mb-3">Pricing</p>
              {editMode ? (
                <select className="input text-sm"
                  defaultValue={mechanic.priceRange}
                  onChange={e => set('priceRange', e.target.value)}>
                  <option value="low">₦ Budget</option>
                  <option value="mid">₦₦ Mid-Range</option>
                  <option value="high">₦₦₦ Premium</option>
                </select>
              ) : (
                <p className="text-gray-200 text-sm font-semibold">{PRICE_LABELS[mechanic.priceRange]}</p>
              )}
            </div>

            {/* Location — the key new section */}
            <div>
              <p className="section-title mb-1">Location Coordinates</p>
              <p className="text-xs text-gray-500 mb-3">
                Required for Directions button and distance-based search.
                {' '}
                <a
                  href="https://www.latlong.net/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline">
                  Find your coordinates →
                </a>
              </p>
              {editMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="section-title mb-1">Latitude</p>
                    <input
                      className="input text-sm"
                      type="number"
                      step="any"
                      placeholder="e.g. 6.5244"
                      defaultValue={mechanic.lat ?? ''}
                      onChange={e => set('lat', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <p className="section-title mb-1">Longitude</p>
                    <input
                      className="input text-sm"
                      type="number"
                      step="any"
                      placeholder="e.g. 3.3792"
                      defaultValue={mechanic.lng ?? ''}
                      onChange={e => set('lng', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-200 text-sm font-semibold">
                  {mechanic.lat != null && mechanic.lng != null
                    ? `${mechanic.lat}, ${mechanic.lng}`
                    : <span className="text-amber-400">⚠ Not set — customers can't get directions</span>
                  }
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <p className="section-title mb-1">About Your Business</p>
              {editMode ? (
                <textarea
                  className="input resize-none w-full text-sm"
                  rows={4}
                  placeholder="Describe your services, experience, and what makes you stand out..."
                  defaultValue={mechanic.bio ?? ''}
                  onChange={e => set('bio', e.target.value)}
                />
              ) : (
                <p className="text-gray-200 text-sm">{mechanic.bio || <span className="text-gray-500">No bio added yet.</span>}</p>
              )}
            </div>

            {/* Services */}
            <div>
              <p className="section-title mb-3">Services Offered</p>
              {editMode ? (
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => {
                    const selected = (editForm.services as string[] | undefined ?? mechanic.services).includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const current = (editForm.services as string[] | undefined) ?? [...mechanic.services]
                          const updated = current.includes(s)
                            ? current.filter(x => x !== s)
                            : [...current, s]
                          set('services', updated)
                        }}
                        className={`tag text-sm py-1.5 px-3 transition-all border ${
                          selected
                            ? 'bg-brand-500/20 border-brand-500 text-brand-500'
                            : 'bg-surface-800 border-gray-700 text-gray-400 hover:border-brand-500/50'
                        }`}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mechanic.services.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              )}
            </div>

            {editMode && (
              <button
                onClick={handleSave}
                disabled={updateMechanic.isPending}
                className="btn-primary w-full">
                {updateMechanic.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        )}

        {/* ── Quotes ── */}
        {activeTab === 'quotes' && (
          <div>
            {quotes.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">💬</div>
                <p>No quote requests yet. Share your listing to get more customers.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map(q => (
                  <div key={q.id} className="card p-5">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{q.customer_name}</h3>
                          <span className={`badge text-xs ${
                            q.status === 'pending'   ? 'bg-amber-500/20  text-amber-400'   :
                            q.status === 'responded' ? 'bg-emerald-500/20 text-emerald-400' :
                                                       'bg-gray-700 text-gray-400'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">📞 {q.customer_phone} · 🔧 {q.service}</p>
                        {q.note && (
                          <p className="text-sm text-gray-500 mt-1 italic">"{q.note}"</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {q.created_at
                            ? new Date(q.created_at).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      {q.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <a href={`tel:${q.customer_phone}`} className="btn-primary text-sm py-2 px-3">
                            📞 Call
                          </a>
                          <a href={`https://wa.me/${q.customer_phone.replace(/\D/g, '')}`}
                            target="_blank" rel="noreferrer"
                            className="py-2 px-3 rounded-xl text-sm font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                            💬 WhatsApp
                          </a>
                          <button
                            onClick={() => handleMarkResponded(q.id)}
                            className="py-2 px-3 rounded-xl text-sm font-bold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 transition-colors">
                            ✓ Mark Responded
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Subscription ── */}
        {activeTab === 'subscription' && (
          <div className="space-y-5">
            <div className="card p-7 text-center" style={{ borderColor: planColor + '40' }}>
              <div className="text-5xl mb-3">
                {mechanic.plan === 'pro' ? '🏆' : mechanic.plan === 'standard' ? '⭐' : '🔧'}
              </div>
              <h2 className="text-3xl font-extrabold mb-1" style={{ color: planColor }}>
                {currentPlan.name} Plan
              </h2>
              <p className="text-gray-400 mb-2">
                {currentPlan.priceNGN === 0
                  ? 'Free forever'
                  : `₦${currentPlan.priceNGN.toLocaleString()}/month`}
              </p>
              {mechanic.plan !== 'free' && (
                <p className="text-sm text-gray-500">Manage or cancel via your Paystack subscription portal.</p>
              )}
            </div>

            {mechanic.plan !== 'pro' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.filter(p => p.priceNGN > currentPlan.priceNGN).map(plan => (
                  <div key={plan.id} className={`card p-5 ${plan.highlighted ? 'border-brand-500/40' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">{plan.name}</h3>
                        <p className="text-brand-500 font-extrabold font-mono">
                          ₦{plan.priceNGN.toLocaleString()}/mo
                        </p>
                      </div>
                      {plan.badge && (
                        <span className="badge text-xs bg-brand-500/20 text-brand-500">{plan.badge}</span>
                      )}
                    </div>
                    <ul className="space-y-1 mb-4">
                      {plan.features.slice(0, 4).map(f => (
                        <li key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                          <span className="text-brand-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handleUpgrade(plan.id)} className="btn-primary w-full text-sm py-2.5">
                      Upgrade to {plan.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}