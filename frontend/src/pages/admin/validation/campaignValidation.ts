// src/validation/campaignValidation.ts
import { z } from 'zod'
import type { AdPlacement } from '@/types/ads'

export const campaignSchema = z.object({
  advertiser_id: z.string().min(1, 'Please select an advertiser'),

  name: z.string()
    .min(2, 'Campaign name must be at least 2 characters')
    .max(100, 'Campaign name is too long'),

  format: z.enum(['banner', 'card', 'inline', 'spotlight'] as const, {
    required_error: 'Ad format is required',
  }),

  // Strongly typed placements using the real union
  placements: z.array(z.custom<AdPlacement>((v) => typeof v === 'string'))
    .min(1, 'Select at least one placement'),

  headline: z.string()
    .min(3, 'Headline must be at least 3 characters')
    .max(120, 'Headline too long'),

  body_text: z.string().max(800).optional(),

  cta_label: z.string()
    .min(2, 'CTA label required')
    .max(40),

  cta_url: z.string().url({ message: 'Must be a valid URL' }),

  image_url: z.string().url().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),

  background_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .default('#1a1a27'),

  accent_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .default('#f97316'),

  target_cities: z.array(z.string()).default([]),
  target_services: z.array(z.string()).default([]),

  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),

  // Fixed typo: price_naira (not price_nairа)
  price_naira: z.coerce.number()
    .min(0, 'Price cannot be negative'),

  billing_type: z.enum(['flat', 'cpm', 'cpc'] as const).default('flat'),

  cpm_rate: z.coerce.number().min(0).optional(),
  cpc_rate: z.coerce.number().min(0).optional(),
  budget_cap: z.coerce.number().min(0).optional(),

  admin_notes: z.string().max(2000).optional(),
})
  // Optional refinements (you can keep or remove)
  .refine(
    (data) => new Date(data.start_date) <= new Date(data.end_date),
    { message: 'End date must be after start date', path: ['end_date'] }
  )
  .refine(
    (data) => data.billing_type !== 'cpm' || !!data.cpm_rate,
    { message: 'CPM rate required when billing type is CPM', path: ['cpm_rate'] }
  )
  .refine(
    (data) => data.billing_type !== 'cpc' || !!data.cpc_rate,
    { message: 'CPC rate required when billing type is CPC', path: ['cpc_rate'] }
  )

export type CampaignForm = z.infer<typeof campaignSchema>