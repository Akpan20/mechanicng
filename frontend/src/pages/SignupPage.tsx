import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp } from '@/lib/api/auth'
import { createMechanic } from '@/lib/api/mechanics'
import { setUser, setProfile } from '@/store/authSlice'
import type { AppDispatch } from '@/store'
import { SERVICES, NIGERIAN_CITIES } from '@/lib/constants'

const accountSchema = z.object({
  full_name:        z.string().min(2, 'Full name required'),
  email:            z.string().email('Valid email required'),
  password:         z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

const listingSchema = z.object({
  name:           z.string().min(2, 'Business name required'),
  type:           z.enum(['shop', 'mobile']),
  phone:          z.string().min(10, 'Valid phone number required'),
  whatsapp:       z.string().min(10, 'Valid WhatsApp number required'),
  email:          z.string().email('Valid email required'),
  city:           z.string().min(1, 'City required'),
  area:           z.string().optional(),
  address:        z.string().optional(),
  lat:            z.number({ invalid_type_error: 'Enter a valid latitude' }).min(-90).max(90).optional(),
  lng:            z.number({ invalid_type_error: 'Enter a valid longitude' }).min(-180).max(180).optional(),
  service_radius: z.number().optional(),
  services:       z.array(z.string()).min(1, 'Select at least one service'),
  hours:          z.string().min(2, 'Hours required'),
  price_range:    z.enum(['low', 'mid', 'high']),
  bio:            z.string().optional(),
})

type AccountForm = z.infer<typeof accountSchema>
type ListingForm = z.infer<typeof listingSchema>
type Role = 'user' | 'mechanic'

export default function SignupPage() {
  const [role, setRole]               = useState<Role | null>(null)
  const [step, setStep]               = useState(1)
  const [accountData, setAccountData] = useState<AccountForm | null>(null)
  const [samePhone, setSamePhone]     = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const accountForm = useForm<AccountForm>({ resolver: zodResolver(accountSchema) })
  const listingForm = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: { type: 'shop', price_range: 'mid', services: [] },
  })

  const toggleService = (s: string) => {
    const next = selectedServices.includes(s)
      ? selectedServices.filter(x => x !== s)
      : [...selectedServices, s]
    setSelectedServices(next)
    listingForm.setValue('services', next)
  }

  // ── Step 1: Account ───────────────────────────────────────

  const onAccountSubmit = async (data: AccountForm) => {
    setError(null)
    if (role === 'user') {
      setLoading(true)
      try {
        const { user } = await signUp(data.email, data.password, data.full_name, 'user')
        if (!user) throw new Error('Account creation failed')
        dispatch(setUser({ id: user.id, email: user.email }))
        dispatch(setProfile(user))
        setStep(3)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    } else {
      setAccountData(data)
      listingForm.setValue('email', data.email)
      setStep(2)
    }
  }

  // ── Step 2: Listing ───────────────────────────────────────

  const onListingSubmit = async (data: ListingForm) => {
    if (!accountData) return
    setError(null)
    setLoading(true)
    try {
      const { user } = await signUp(accountData.email, accountData.password, accountData.full_name, 'mechanic')
      if (!user) throw new Error('Account creation failed')
      dispatch(setUser({ id: user.id, email: user.email }))
      dispatch(setProfile(user))

      await createMechanic({
        user_id:        user.id,
        name:           data.name,
        type:           data.type,
        status:         'pending',
        plan:           'free',
        phone:          data.phone,
        whatsapp:       data.whatsapp,
        email:          data.email,
        city:           data.city,
        area:           data.area ?? '',
        address:        data.address,
        lat:            data.lat ?? null,
        lng:            data.lng ?? null,
        service_radius: data.service_radius,
        services:       selectedServices,
        hours:          data.hours,
        bio:            data.bio,
        priceRange:     data.price_range,
        review_count:   0,
      } as unknown as Parameters<typeof createMechanic>[0])

      setStep(3)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const MECH_STEPS = ['Account', 'Your Listing', 'Done!']
  const USER_STEPS = ['Account', 'Done!']
  const STEPS      = role === 'mechanic' ? MECH_STEPS : USER_STEPS

  // ── Role picker ───────────────────────────────────────────

  if (!role) return (
    <>
      <Helmet><title>Sign Up – MechanicNG</title></Helmet>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <p className="section-title mb-2">Join MechanicNG</p>
          <h1 className="text-3xl font-extrabold mb-2">Create an Account</h1>
          <p className="text-gray-400">What brings you to MechanicNG?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setRole('user')}
            className="card p-7 text-left hover:border-brand-500/50 transition-all group">
            <div className="text-4xl mb-3">🚗</div>
            <h2 className="text-lg font-extrabold mb-1 group-hover:text-brand-500 transition-colors">
              I need a mechanic
            </h2>
            <p className="text-sm text-gray-400">
              Find trusted mechanics, request quotes, and leave reviews.
            </p>
          </button>
          <button onClick={() => setRole('mechanic')}
            className="card p-7 text-left hover:border-brand-500/50 transition-all group">
            <div className="text-4xl mb-3">🔧</div>
            <h2 className="text-lg font-extrabold mb-1 group-hover:text-brand-500 transition-colors">
              I'm a mechanic
            </h2>
            <p className="text-sm text-gray-400">
              List your business and get discovered by thousands of drivers.
            </p>
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:underline">Sign In</Link>
        </p>
      </div>
    </>
  )

  return (
    <>
      <Helmet>
        <title>{role === 'mechanic' ? 'List Your Business' : 'Sign Up'} – MechanicNG</title>
      </Helmet>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <p className="section-title mb-2">Join MechanicNG</p>
          <h1 className="text-3xl font-extrabold mb-2">
            {role === 'mechanic' ? 'List Your Business' : 'Create Your Account'}
          </h1>
          <p className="text-gray-400">
            {role === 'mechanic'
              ? 'Get discovered by thousands of Nigerian drivers.'
              : 'Find mechanics, request quotes, and leave reviews.'}
          </p>
          <button onClick={() => setRole(null)}
            className="text-xs text-gray-500 hover:text-gray-300 mt-2 underline">
            ← Change account type
          </button>
        </div>

        {/* Step indicator */}
        {role === 'mechanic' && (
          <div className="flex items-center mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={`flex items-center gap-2 flex-1 ${
                  i < STEPS.length - 1 ? 'after:flex-1 after:h-px after:mx-2 after:bg-gray-800' : ''
                } ${step > i + 1 ? 'after:bg-brand-500/40' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                    step > i + 1  ? 'bg-brand-500 text-white' :
                    step === i + 1 ? 'bg-brand-500 text-white shadow-glow-brand' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Account */}
        {step === 1 && (
          <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="card p-7 space-y-5">
            <h2 className="text-xl font-bold mb-1">Create Your Account</h2>
            {([
              { name: 'full_name'        as const, label: 'Full Name',        placeholder: 'John Emeka',      type: 'text'     },
              { name: 'email'            as const, label: 'Email Address',    placeholder: 'you@example.com', type: 'email'    },
              { name: 'password'         as const, label: 'Password',         placeholder: '8+ characters',   type: 'password' },
              { name: 'confirm_password' as const, label: 'Confirm Password', placeholder: 'Repeat password', type: 'password' },
            ]).map(f => (
              <div key={f.name}>
                <label className="section-title block mb-2">{f.label}</label>
                <input className="input" type={f.type} placeholder={f.placeholder}
                  {...accountForm.register(f.name)} />
                {accountForm.formState.errors[f.name] && (
                  <p className="text-red-400 text-xs mt-1">
                    {accountForm.formState.errors[f.name]?.message}
                  </p>
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : role === 'mechanic' ? 'Continue →' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 hover:underline">Sign In</Link>
            </p>
          </form>
        )}

        {/* Step 2: Listing */}
        {step === 2 && role === 'mechanic' && (
          <form onSubmit={listingForm.handleSubmit(onListingSubmit)} className="card p-7 space-y-5">
            <h2 className="text-xl font-bold mb-1">Your Business Listing</h2>

            {/* Business name */}
            <div>
              <label className="section-title block mb-2">Business / Mechanic Name *</label>
              <input className="input" placeholder="e.g. Emeka AutoFix"
                {...listingForm.register('name')} />
              {listingForm.formState.errors.name && (
                <p className="text-red-400 text-xs mt-1">{listingForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="section-title block mb-2">Mechanic Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {(['shop', 'mobile'] as const).map(t => (
                  <button key={t} type="button" onClick={() => listingForm.setValue('type', t)}
                    className={`p-4 rounded-xl border-2 font-bold text-base transition-all ${
                      listingForm.watch('type') === t
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}>
                    {t === 'shop' ? '🏪 Auto Shop' : '🚗 Mobile Mechanic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone & email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="section-title block mb-2">Phone *</label>
                <input className="input" placeholder="0801 234 5678"
                  {...listingForm.register('phone')}
                  onChange={e => {
                    listingForm.setValue('phone', e.target.value)
                    if (samePhone) listingForm.setValue('whatsapp', e.target.value)
                  }} />
              </div>
              <div>
                <label className="section-title block mb-2">Email *</label>
                <input className="input" type="email" {...listingForm.register('email')} />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="section-title block mb-2">WhatsApp Number</label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={samePhone}
                  onChange={e => {
                    setSamePhone(e.target.checked)
                    if (e.target.checked) listingForm.setValue('whatsapp', listingForm.getValues('phone'))
                  }}
                  className="accent-brand-500" />
                <span className="text-sm text-gray-400">Same as phone number</span>
              </label>
              {!samePhone && (
                <input className="input" placeholder="WhatsApp number"
                  {...listingForm.register('whatsapp')} />
              )}
            </div>

            {/* City & area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="section-title block mb-2">City *</label>
                <select className="input" {...listingForm.register('city')}>
                  <option value="">Select city</option>
                  {NIGERIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {listingForm.formState.errors.city && (
                  <p className="text-red-400 text-xs mt-1">{listingForm.formState.errors.city.message}</p>
                )}
              </div>
              <div>
                <label className="section-title block mb-2">Area / Zone</label>
                <input className="input" placeholder="e.g. Victoria Island"
                  {...listingForm.register('area')} />
              </div>
            </div>

            {/* Address (shop only) */}
            {listingForm.watch('type') === 'shop' && (
              <div>
                <label className="section-title block mb-2">Shop Address</label>
                <input className="input" placeholder="Full address of your shop"
                  {...listingForm.register('address')} />
              </div>
            )}

            {/* Service radius (mobile only) */}
            {listingForm.watch('type') === 'mobile' && (
              <div>
                <label className="section-title block mb-2">
                  Service Radius: {listingForm.watch('service_radius') ?? 15}km
                </label>
                <input type="range" min={5} max={100} step={5} defaultValue={15}
                  onChange={e => listingForm.setValue('service_radius', Number(e.target.value))}
                  className="w-full accent-brand-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>5km</span><span>100km</span>
                </div>
              </div>
            )}

            {/* Location coordinates */}
            <div>
              <label className="section-title block mb-1">Location Coordinates (optional but recommended)</label>
              <p className="text-xs text-gray-500 mb-3">
                Allows customers to get directions to your business.{' '}
                <a href="https://www.latlong.net/" target="_blank" rel="noreferrer"
                  className="text-brand-500 hover:underline">
                  Find your coordinates →
                </a>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-title block mb-1">Latitude</label>
                  <input
                    className="input text-sm"
                    type="number"
                    step="any"
                    placeholder="e.g. 6.5244"
                    {...listingForm.register('lat', { valueAsNumber: true })}
                  />
                  {listingForm.formState.errors.lat && (
                    <p className="text-red-400 text-xs mt-1">{listingForm.formState.errors.lat.message}</p>
                  )}
                </div>
                <div>
                  <label className="section-title block mb-1">Longitude</label>
                  <input
                    className="input text-sm"
                    type="number"
                    step="any"
                    placeholder="e.g. 3.3792"
                    {...listingForm.register('lng', { valueAsNumber: true })}
                  />
                  {listingForm.formState.errors.lng && (
                    <p className="text-red-400 text-xs mt-1">{listingForm.formState.errors.lng.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="section-title block mb-2">Services * (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => (
                  <button key={s} type="button" onClick={() => toggleService(s)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      selectedServices.includes(s)
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}>
                    {selectedServices.includes(s) ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>
              {listingForm.formState.errors.services && (
                <p className="text-red-400 text-xs mt-1">Select at least one service</p>
              )}
            </div>

            {/* Hours */}
            <div>
              <label className="section-title block mb-2">Operating Hours *</label>
              <input className="input" placeholder="e.g. Mon-Sat 8am-6pm"
                {...listingForm.register('hours')} />
            </div>

            {/* Price range */}
            <div>
              <label className="section-title block mb-2">Price Range</label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'mid', 'high'] as const).map(p => (
                  <button key={p} type="button" onClick={() => listingForm.setValue('price_range', p)}
                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      listingForm.watch('price_range') === p
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-gray-700 text-gray-400'
                    }`}>
                    {p === 'low' ? '₦ Budget' : p === 'mid' ? '₦₦ Mid' : '₦₦₦ Premium'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="section-title block mb-2">About Your Business</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Describe your experience and what makes you stand out..."
                {...listingForm.register('bio')} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                ← Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : '✓ Submit Listing'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-4xl">
              ✅
            </div>
            <h2 className="text-2xl font-extrabold mb-3">
              {role === 'mechanic' ? "You're on the list!" : 'Welcome to MechanicNG!'}
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {role === 'mechanic'
                ? 'Your listing has been submitted and is under review. We typically approve listings within 24–48 hours.'
                : 'Your account is ready. Start finding trusted mechanics near you.'}
            </p>
            <div className="space-y-3">
              {role === 'mechanic' ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
                    Go to My Dashboard
                  </button>
                  <button onClick={() => navigate('/pricing')} className="btn-outline w-full">
                    View Subscription Plans
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/')} className="btn-primary w-full">
                  Find a Mechanic
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}