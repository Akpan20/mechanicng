import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { campaignSchema, CampaignForm } from '../validation/campaignValidation'
import { FORMAT_OPTIONS, PLACEMENT_OPTIONS, NIGERIAN_CITIES } from '../constants'
import type { Advertiser, AdCampaign, AdPlacement } from '@/types/ads'
import { FormField } from './FormField'

interface FormatOption { value: 'banner' | 'card' | 'inline' | 'spotlight'; label: string; desc: string }
interface PlacementOption { value: AdPlacement; label: string }

interface CampaignFormModalProps {
  advertisers: Advertiser[]
  initialData: AdCampaign | null
  onClose: () => void
  onSubmit: (data: CampaignForm) => Promise<void> // eslint-disable-line no-unused-vars
  isSubmitting: boolean
}

export function CampaignFormModal({
  advertisers,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: CampaignFormModalProps) {
  const defaultValues: CampaignForm = initialData
    ? {
        ...initialData,
        image_url: initialData.image_url ?? '',
        logo_url: initialData.logo_url ?? '',
        background_color: initialData.background_color ?? '#1a1a27',
        accent_color: initialData.accent_color ?? '#f97316',
        target_cities: initialData.target_cities ?? [],
        target_services: initialData.target_services ?? [],
        price_naira: initialData.price_naira ?? 0,
        billing_type: initialData.billing_type ?? 'flat',
        cpm_rate: initialData.cpm_rate,
        cpc_rate: initialData.cpc_rate,
        budget_cap: initialData.budget_cap,
        admin_notes: initialData.admin_notes,
      }
    : {
        advertiser_id: '',
        name: '',
        format: 'banner',
        placements: [],
        headline: '',
        cta_label: 'Learn More',
        cta_url: '',
        background_color: '#1a1a27',
        accent_color: '#f97316',
        target_cities: [],
        target_services: [],
        start_date: '',
        end_date: '',
        price_naira: 0,
        billing_type: 'flat',
      }

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  })

  const { register, handleSubmit, setValue, control, formState: { errors } } = form

  const watchedData = useWatch({ control }) as CampaignForm
  const { placements = [], target_cities = [], billing_type = 'flat' } = watchedData

  const toggleArrayItem = <T extends string>(
    field: 'placements' | 'target_cities' | 'target_services',
    value: T
  ) => {
    const current = (watchedData[field] as T[]) || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    setValue(field, next as any, { shouldDirty: true })
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-2xl my-8 p-7">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold">
            {initialData ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Advertiser */}
          <FormField label="Advertiser *" error={errors.advertiser_id?.message}>
            <select className="input" {...register('advertiser_id')}>
              <option value="">Select advertiser</option>
              {advertisers.map(a => (
                <option key={a.id} value={a.id}>
                  {a.businessName}
                </option>
              ))}
            </select>
          </FormField>

          {/* Campaign Name */}
          <FormField label="Campaign Name *" error={errors.name?.message}>
            <input className="input" {...register('name')} placeholder="e.g. Q3 Auto Parts Promotion" />
          </FormField>

          {/* Format */}
          <FormField label="Ad Format *">
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((f: FormatOption) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setValue('format', f.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    watchedData.format === f.value ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold text-sm">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </FormField>

          {/* Placements */}
          <FormField label="Placements *" error={errors.placements?.message}>
            <div className="flex flex-wrap gap-2">
              {PLACEMENT_OPTIONS.map((p: PlacementOption) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => toggleArrayItem('placements', p.value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    placements.includes(p.value)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {placements.includes(p.value) ? '✓ ' : ''}{p.label}
                </button>
              ))}
            </div>
          </FormField>

          {/* Headline & CTA */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Headline *" error={errors.headline?.message}>
              <input
                className="input"
                {...register('headline')}
                placeholder="e.g. Get 20% off on brake pads"
              />
            </FormField>
            <FormField label="CTA Label">
              <input className="input" {...register('cta_label')} placeholder="Learn More" />
            </FormField>
          </div>

          <FormField label="CTA URL *" error={errors.cta_url?.message}>
            <input
              className="input"
              {...register('cta_url')}
              placeholder="https://youroffers.com/brake-sale"
            />
          </FormField>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Background Color" error={errors.background_color?.message}>
              <input
                className="input font-mono"
                {...register('background_color')}
                placeholder="#1a1a27"
              />
            </FormField>
            <FormField label="Accent Color" error={errors.accent_color?.message}>
              <input
                className="input font-mono"
                {...register('accent_color')}
                placeholder="#f97316"
              />
            </FormField>
          </div>

          {/* Target Cities */}
          <FormField label="Target Cities (leave empty for national)">
            <div className="flex flex-wrap gap-2">
              {NIGERIAN_CITIES.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleArrayItem('target_cities', city)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    target_cities.includes(city)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {target_cities.includes(city) ? '✓ ' : ''}{city}
                </button>
              ))}
            </div>
          </FormField>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date *" error={errors.start_date?.message}>
              <input className="input" type="date" {...register('start_date')} />
            </FormField>
            <FormField label="End Date *" error={errors.end_date?.message}>
              <input className="input" type="date" {...register('end_date')} />
            </FormField>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Billing Type">
              <select className="input" {...register('billing_type')}>
                <option value="flat">Flat Rate</option>
                <option value="cpm">CPM (per 1k views)</option>
                <option value="cpc">CPC (per click)</option>
              </select>
            </FormField>

            <FormField label="Total Price (₦) *" error={errors.price_naira?.message}>
              <input
                className="input"
                type="number"
                min={0}
                step="100"
                placeholder="50000"
                {...register('price_naira', { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="Budget Cap (₦)">
              <input
                className="input"
                type="number"
                min={0}
                step="100"
                placeholder="100000"
                {...register('budget_cap', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {/* Conditional fields for CPM/CPC */}
          {billing_type === 'cpm' && (
            <FormField label="CPM Rate (₦ per 1k views) *" error={errors.cpm_rate?.message}>
              <input
                className="input"
                type="number"
                min={0}
                step="10"
                placeholder="2000"
                {...register('cpm_rate', { valueAsNumber: true })}
              />
            </FormField>
          )}

          {billing_type === 'cpc' && (
            <FormField label="CPC Rate (₦ per click) *" error={errors.cpc_rate?.message}>
              <input
                className="input"
                type="number"
                min={0}
                step="1"
                placeholder="50"
                {...register('cpc_rate', { valueAsNumber: true })}
              />
            </FormField>
          )}

          {/* Admin Notes */}
          <FormField label="Admin Notes (internal only)">
            <textarea
              className="input resize-none"
              rows={3}
              {...register('admin_notes')}
              placeholder="Any internal notes about this campaign..."
            />
          </FormField>

          {/* Submit / Cancel */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}