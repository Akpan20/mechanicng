import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PLANS, PLAN_COLORS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { initializePayment, generateReference } from '@/lib/paystack'
import { useMyMechanic } from '@/hooks/useMechanics'
import toast from 'react-hot-toast'

export default function PricingPage() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated } = useAuth()
  const { data: myMechanic } = useMyMechanic()

  const handlePlanSelect = async (planId: string) => {
    if (!isAuthenticated) { navigate('/signup'); return }
    const plan = PLANS.find(p => p.id === planId)!
    if (plan.priceNGN === 0 || !myMechanic) { navigate('/dashboard'); return }

    try {
      await initializePayment({
        email: user!.email!,
        amount: plan.priceNGN * 100, // kobo
        plan: plan.paystackPlanCode,
        ref: generateReference(),
        metadata: { mechanic_id: myMechanic.id, plan: planId },
        callback: (response) => {
          toast.success('Payment successful! Your plan is now active.')
          console.log('Payment ref:', response.reference)
          navigate('/dashboard')
        },
        onClose: () => toast.error('Payment cancelled.'),
      })
    } catch  {
      toast.error('Could not initialize payment. Please try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Pricing for Mechanics – MechanicNG</title>
        <meta name="description" content="Affordable plans for Nigerian mechanics and auto shops. Start free and grow your customer base." />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-title mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Plans for Every Mechanic</h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">Start for free. Upgrade as you grow. Pay in Naira, cancel anytime.</p>
        </div>

        {/* Personalized greeting (uses profile) */}
        {isAuthenticated && profile?.full_name && (
          <div className="text-center mb-6 text-gray-400">
            Welcome back, <span className="font-semibold text-gray-200">{profile.full_name}</span>!
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-14">
          {PLANS.map(plan => {
            const color = PLAN_COLORS[plan.id]
            const isCurrent = myMechanic?.plan === plan.id
            return (
              <div key={plan.id} className={`card p-7 relative ${plan.highlighted ? 'border-brand-500 ring-1 ring-brand-500/30' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wide whitespace-nowrap"
                    style={{ background: color, color: '#fff' }}>
                    {plan.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: color + '20', border: `1px solid ${color}40` }}>
                    {plan.id === 'free' ? '🔧' : plan.id === 'standard' ? '⭐' : '🏆'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl">{plan.name}</h3>
                    {isCurrent && <span className="text-xs font-bold text-emerald-400">Your current plan</span>}
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black font-mono" style={{ color }}>
                    {plan.priceNGN === 0 ? 'Free' : `₦${plan.priceNGN.toLocaleString()}`}
                  </span>
                  {plan.priceNGN > 0 && <span className="text-gray-500 text-sm">/month</span>}
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="font-bold mt-0.5 flex-shrink-0" style={{ color }}>✓</span>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlighted ? 'btn-primary' : `border-2 font-bold`}`}
                  style={!plan.highlighted ? { borderColor: color, color, backgroundColor: 'transparent' } : undefined}
                >
                  {isCurrent ? '✓ Current Plan' : plan.id === 'free' ? 'Get Started Free' : `Subscribe for ₦${plan.priceNGN.toLocaleString()}/mo`}
                </button>
              </div>
            )
          })}
        </div>

        {/* All plans include */}
        <div className="card p-8 text-center">
          <h3 className="font-bold text-lg mb-5">All plans include</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-400">
            {[
              'Admin review & approval', 'Google Maps directions link',
              'Tap-to-call button', 'WhatsApp contact button',
              'Mobile-friendly profile', 'Customer quote form',
              'Appear in city search', 'Secure Paystack billing',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-emerald-400 font-bold">✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              ['Can I cancel anytime?', 'Yes. Cancel your Paystack subscription at any time from your dashboard. Your listing stays active until the end of the billing period.'],
              ['How does billing work?', 'We bill monthly in Nigerian Naira (NGN) via Paystack. We support cards, bank transfer, and USSD payment.'],
              ['How long does approval take?', 'Most listings are reviewed and approved within 24–48 hours after submission.'],
              ['Can I upgrade or downgrade?', 'Yes, you can change your plan at any time from your mechanic dashboard.'],
            ].map(([q, a]) => (
              <details key={q} className="card p-5 group cursor-pointer">
                <summary className="font-bold text-gray-200 list-none flex justify-between items-center gap-2">
                  {q}
                  <span className="text-brand-500 flex-shrink-0 group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
                </summary>
                <p className="text-gray-400 mt-3 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}