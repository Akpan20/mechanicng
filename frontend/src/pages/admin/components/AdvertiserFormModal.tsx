// src/pages/admin/components/AdvertiserFormModal.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from './FormField'

// ─── Schema ──────────────────────────────────────────────────
const advertiserSchema = z.object({
  business_name: z.string().min(2),
  contact_name:  z.string().min(2),
  email:         z.string().email(),
  phone:         z.string().min(10),
  website:       z.string().url().optional().or(z.literal('')),
  industry:      z.string().optional(),
})

type AdvertiserForm = z.infer<typeof advertiserSchema>

// ─── Component ───────────────────────────────────────────────
export default function AdvertiserFormModal({ onClose, onSubmit, isSubmitting }: {
  onClose: () => void
  onSubmit: (data: AdvertiserForm) => Promise<void> // eslint-disable-line no-unused-vars
  isSubmitting: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdvertiserForm>({
    resolver: zodResolver(advertiserSchema),
  })

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md p-7">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold">Add Advertiser</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Business Name *" error={errors.business_name?.message}>
            <input className="input" placeholder="e.g. AutoZone Nigeria" {...register('business_name')} />
          </FormField>

          <FormField label="Contact Name *" error={errors.contact_name?.message}>
            <input className="input" placeholder="Full name of ad contact" {...register('contact_name')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email *" error={errors.email?.message}>
              <input className="input" type="email" placeholder="contact@business.com" {...register('email')} />
            </FormField>
            <FormField label="Phone *" error={errors.phone?.message}>
              <input className="input" placeholder="0801 234 5678" {...register('phone')} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website">
              <input className="input" type="url" placeholder="https://..." {...register('website')} />
            </FormField>
            <FormField label="Industry">
              <input className="input" placeholder="Auto Parts, Insurance..." {...register('industry')} />
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Adding...' : 'Add Advertiser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}