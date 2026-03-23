import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectUser, selectProfile } from '@/store/authSlice'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────

interface AffiliateStats {
  id:             string
  code:           string
  fullName:       string
  email:          string
  commissionRate: number
  totalEarnings:  number
  pendingPayout:  number
  totalReferrals: number
  status:         'active' | 'suspended'
  bankName?:      string
  accountNumber?: string
  accountName?:   string
  referralLink:   string
  recentReferrals: Referral[]
}

interface Referral {
  id:         string
  plan:       string
  amountPaid: number
  commission: number
  status:     'pending' | 'credited' | 'paid_out'
  createdAt:  string
}

// ─── Schemas ─────────────────────────────────────────────────

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email:    z.string().email('Valid email required'),
})
type RegisterForm = z.infer<typeof registerSchema>

const bankSchema = z.object({
  bankName:      z.string().min(2, 'Bank name required'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
  accountName:   z.string().min(2, 'Account name required'),
})
type BankForm = z.infer<typeof bankSchema>

// ─── Hooks ────────────────────────────────────────────────────

function useAffiliateStats() {
  return useQuery<AffiliateStats>({
    queryKey: ['affiliate-stats'],
    queryFn:  () => api.get('/api/affiliates/me'),
    retry:    false,
  })
}

// ─── Main page ────────────────────────────────────────────────

export default function AffiliateDashboardPage() {
  const navigate    = useNavigate()
  const user        = useAppSelector(selectUser)
  const profile     = useAppSelector(selectProfile)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab]       = useState<'overview' | 'referrals' | 'payout'>('overview')
  const [showBankForm, setShowBankForm] = useState(false)
  const [copied, setCopied]             = useState(false)

  const { data: stats, isLoading, isError } = useAffiliateStats()

  // Register form
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver:      zodResolver(registerSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      email:    user?.email ?? '',
    },
  })

  // Bank form
  const { register: regBank, handleSubmit: handleBankSubmit, formState: { errors: bankErrors } } =
    useForm<BankForm>({ resolver: zodResolver(bankSchema) })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) => api.post('/api/affiliates', data),
    onSuccess:  () => {
      toast.success('Registered as affiliate!')
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] })
    },
    onError: (err: any) => toast.error(err?.message ?? 'Registration failed'),
  })

  // Bank details mutation
  const bankMutation = useMutation({
    mutationFn: (data: BankForm) => api.patch('/api/affiliates/bank-details', data),
    onSuccess:  () => {
      toast.success('Bank details updated!')
      setShowBankForm(false)
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] })
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update bank details'),
  })

  const copyLink = () => {
    if (!stats?.referralLink) return
    navigator.clipboard.writeText(stats.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Please sign in to access the affiliate program.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Sign In</button>
      </div>
    )
  }

  // Not registered yet
  if (isError) {
    return (
      <>
        <Helmet><title>Affiliate Program – MechanicNG</title></Helmet>
        <div className="max-w-2xl mx-auto px-4 py-12">

          {/* Program overview */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">💸</div>
            <p className="section-title mb-2">Affiliate Program</p>
            <h1 className="text-3xl font-extrabold mb-3">Earn Money by Referring Mechanics</h1>
            <p className="text-gray-400 leading-relaxed">
              Join our affiliate program and earn <span className="text-brand-500 font-bold">20% commission</span> for
              every mechanic you refer who upgrades to a paid plan.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: '🔗', title: 'Get Your Link',    desc: 'Register and get your unique referral link'            },
              { icon: '📣', title: 'Share It',         desc: 'Share with mechanics who need customers'               },
              { icon: '💰', title: 'Earn Commission',  desc: 'Get 20% of every subscription payment they make'       },
            ].map(item => (
              <div key={item.title} className="card p-5 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Commission table */}
          <div className="card overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-800">
              <h3 className="font-bold">Commission Structure</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Your Commission</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: 'Standard', price: '₦2,500/mo', commission: '₦500' },
                  { plan: 'Pro',      price: '₦6,000/mo', commission: '₦1,200' },
                ].map(row => (
                  <tr key={row.plan} className="border-b border-gray-800/50">
                    <td className="px-5 py-3 font-semibold">{row.plan}</td>
                    <td className="px-5 py-3 text-gray-400">{row.price}</td>
                    <td className="px-5 py-3 font-bold text-brand-500">{row.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Registration form */}
          <div className="card p-7">
            <h2 className="text-xl font-bold mb-5">Join the Affiliate Program</h2>
            <form onSubmit={handleSubmit(d => registerMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="section-title block mb-2">Full Name</label>
                <input className="input" {...register('fullName')} placeholder="Your full name" />
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="section-title block mb-2">Email</label>
                <input className="input" type="email" {...register('email')} placeholder="your@email.com" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full">
                {registerMutation.isPending ? 'Registering...' : '🚀 Join Now — It\'s Free'}
              </button>
            </form>
          </div>
        </div>
      </>
    )
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64"><div className="loader" /></div>
  )

  const TABS = [
    { id: 'overview',  label: '📊 Overview'  },
    { id: 'referrals', label: `💬 Referrals${stats!.totalReferrals > 0 ? ` (${stats!.totalReferrals})` : ''}` },
    { id: 'payout',    label: '💳 Payout'    },
  ]

  return (
    <>
      <Helmet><title>Affiliate Dashboard – MechanicNG</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="section-title mb-1">Affiliate Program</p>
            <h1 className="text-2xl font-extrabold">Welcome, {stats!.fullName}</h1>
          </div>
          <span className={`badge ${
            stats!.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {stats!.status === 'active' ? '🟢 Active' : '🔴 Suspended'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-800 border border-gray-800 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['💰', `₦${stats!.totalEarnings.toLocaleString()}`, 'Total Earned',    '#10b981'],
                ['⏳', `₦${stats!.pendingPayout.toLocaleString()}`, 'Pending Payout',  '#f59e0b'],
                ['👥', stats!.totalReferrals.toString(),             'Total Referrals', '#a855f7'],
                ['%',  `${(stats!.commissionRate * 100).toFixed(0)}%`, 'Commission Rate', '#f97316'],
              ].map(([icon, val, label, color]) => (
                <div key={label as string} className="card p-5 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-extrabold font-mono" style={{ color: color as string }}>{val}</div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Referral link */}
            <div className="card p-5">
              <p className="section-title mb-2">Your Referral Link</p>
              <p className="text-sm text-gray-400 mb-3">
                Share this link with mechanics. When they sign up and upgrade, you earn commission automatically.
              </p>
              <div className="flex gap-3 items-center">
                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-brand-500 font-mono truncate">
                  {stats!.referralLink}
                </div>
                <button onClick={copyLink} className={`btn-primary text-sm py-3 px-4 flex-shrink-0 ${copied ? 'bg-emerald-500' : ''}`}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Your unique code: <span className="font-mono text-brand-500 font-bold">{stats!.code}</span>
              </p>
            </div>

            {/* Recent referrals */}
            {stats!.recentReferrals.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-800">
                  <h3 className="font-bold">Recent Referrals</h3>
                </div>
                <div className="divide-y divide-gray-800">
                  {stats!.recentReferrals.map(r => (
                    <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm capitalize">{r.plan} Plan</p>
                        <p className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-500">+₦{r.commission.toLocaleString()}</p>
                        <span className={`text-xs badge ${
                          r.status === 'paid_out' ? 'bg-emerald-500/20 text-emerald-400' :
                          r.status === 'credited' ? 'bg-amber-500/20  text-amber-400'   :
                                                    'bg-gray-700 text-gray-400'
                        }`}>
                          {r.status === 'paid_out' ? '✓ Paid' : r.status === 'credited' ? 'Pending Payout' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats!.recentReferrals.length === 0 && (
              <div className="card p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">🔗</div>
                <p className="font-semibold mb-1">No referrals yet</p>
                <p className="text-sm">Share your referral link with mechanics to start earning.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Referrals ── */}
        {activeTab === 'referrals' && (
          <ReferralsTab affiliateId={stats!.id} />
        )}

        {/* ── Payout ── */}
        {activeTab === 'payout' && (
          <div className="space-y-5">

            {/* Payout summary */}
            <div className="card p-7 text-center">
              <p className="text-gray-400 text-sm mb-1">Available for Payout</p>
              <p className="text-4xl font-extrabold font-mono text-brand-500 mb-2">
                ₦{stats!.pendingPayout.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Payouts are processed manually within 3–5 business days after request.
              </p>
            </div>

            {/* Bank details */}
            <div className="card p-7">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold">Bank Details</h3>
                <button onClick={() => setShowBankForm(!showBankForm)} className="btn-outline text-sm py-2">
                  {showBankForm ? '✕ Cancel' : '✏️ Edit'}
                </button>
              </div>

              {showBankForm ? (
                <form onSubmit={handleBankSubmit(d => bankMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="section-title block mb-2">Bank Name</label>
                    <input className="input" {...regBank('bankName')} placeholder="e.g. Access Bank" />
                    {bankErrors.bankName && <p className="text-red-400 text-xs mt-1">{bankErrors.bankName.message}</p>}
                  </div>
                  <div>
                    <label className="section-title block mb-2">Account Number</label>
                    <input className="input" {...regBank('accountNumber')} placeholder="10-digit account number" maxLength={10} />
                    {bankErrors.accountNumber && <p className="text-red-400 text-xs mt-1">{bankErrors.accountNumber.message}</p>}
                  </div>
                  <div>
                    <label className="section-title block mb-2">Account Name</label>
                    <input className="input" {...regBank('accountName')} placeholder="Name on account" />
                    {bankErrors.accountName && <p className="text-red-400 text-xs mt-1">{bankErrors.accountName.message}</p>}
                  </div>
                  <button type="submit" disabled={bankMutation.isPending} className="btn-primary w-full">
                    {bankMutation.isPending ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </form>
              ) : stats!.bankName ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Bank',           stats!.bankName      ?? '—'],
                    ['Account Number', stats!.accountNumber ?? '—'],
                    ['Account Name',   stats!.accountName   ?? '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="section-title mb-1">{label}</p>
                      <p className="text-gray-200 text-sm font-semibold">{val}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-3xl mb-2">🏦</p>
                  <p className="text-sm mb-3">No bank details added yet.</p>
                  <button onClick={() => setShowBankForm(true)} className="btn-primary text-sm py-2 px-4">
                    Add Bank Details
                  </button>
                </div>
              )}
            </div>

            {stats!.pendingPayout > 0 && stats!.bankName && (
              <div className="card p-5 bg-emerald-500/5 border-emerald-500/20">
                <p className="text-sm text-gray-300 mb-3">
                  You have <strong className="text-emerald-400">₦{stats!.pendingPayout.toLocaleString()}</strong> ready for payout to <strong>{stats!.bankName} — {stats!.accountNumber}</strong>.
                  Contact us to request your payout.
                </p>
                <a
                  href={`mailto:hello@mechanicng.com?subject=Affiliate Payout Request — ${stats!.code}&body=Hi, I would like to request a payout of ₦${stats!.pendingPayout.toLocaleString()} for affiliate code ${stats!.code}.`}
                  className="btn-primary text-sm py-2 px-4 inline-block">
                  📧 Request Payout
                </a>
              </div>
            )}

            {stats!.pendingPayout > 0 && !stats!.bankName && (
              <div className="card p-5 bg-amber-500/5 border-amber-500/20">
                <p className="text-sm text-amber-400">
                  ⚠ Add your bank details above before requesting a payout.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Referrals tab ────────────────────────────────────────────

function ReferralsTab({ affiliateId }: { affiliateId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-referrals', affiliateId, page],
    queryFn:  () => api.get<any>(`/api/affiliates/me/referrals?page=${page}&limit=10`),
  })

  const referrals   = data?.referrals   ?? []
  const totalPages  = data?.totalPages  ?? 1
  const total       = data?.total       ?? 0

  if (isLoading) return <div className="flex justify-center py-12"><div className="loader" /></div>

  if (referrals.length === 0) return (
    <div className="card p-8 text-center text-gray-500">
      <div className="text-4xl mb-3">📋</div>
      <p className="font-semibold mb-1">No referrals yet</p>
      <p className="text-sm">Share your referral link to start tracking conversions.</p>
    </div>
  )

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{total} total referral{total !== 1 ? 's' : ''}</p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Plan', 'Amount Paid', 'Commission', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {referrals.map((r: Referral) => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 font-semibold capitalize">{r.plan}</td>
                <td className="px-5 py-3 font-mono text-gray-300">₦{r.amountPaid.toLocaleString()}</td>
                <td className="px-5 py-3 font-bold text-brand-500">₦{r.commission.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`badge text-xs ${
                    r.status === 'paid_out' ? 'bg-emerald-500/20 text-emerald-400' :
                    r.status === 'credited' ? 'bg-amber-500/20  text-amber-400'   :
                                              'bg-gray-700 text-gray-400'
                  }`}>
                    {r.status === 'paid_out' ? '✓ Paid Out' : r.status === 'credited' ? 'Pending Payout' : 'Processing'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button className="btn text-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button className="btn text-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      )}
    </div>
  )
}