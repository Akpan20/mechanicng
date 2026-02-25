import { Schema, model, Document } from 'mongoose'

export interface IAdCampaign extends Document {
  advertiserId: Schema.Types.ObjectId
  name: string
  status: 'pending' | 'active' | 'approved' | 'paused' | 'rejected' | 'expired' | 'ended'
  format: 'banner' | 'card' | 'inline' | 'spotlight'
  placements: string[]
  headline: string
  bodyText?: string
  ctaLabel: string
  ctaUrl: string
  imageUrl?: string
  logoUrl?: string
  backgroundColor: string
  accentColor: string
  targetCities: string[]
  targetServices: string[]
  startDate: Date
  endDate: Date
  priceNgn: number
  billingType: 'flat' | 'cpm' | 'cpc'
  cpmRate?: number
  cpcRate?: number
  budgetCap?: number
  impressions: number
  clicks: number
  adminNotes?: string
  approvedBy?: Schema.Types.ObjectId
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const adCampaignSchema = new Schema<IAdCampaign>({
  advertiserId:    { type: Schema.Types.ObjectId, ref: 'Advertiser', required: true },
  name:            { type: String, required: true },
  status:          { type: String, enum: ['pending','active','approved','paused','rejected','expired','ended'], default: 'pending' },
  format:          { type: String, enum: ['banner','card','inline','spotlight'], required: true },
  placements:      [{ type: String }],
  headline:        { type: String, required: true },
  bodyText:        { type: String },
  ctaLabel:        { type: String, required: true },
  ctaUrl:          { type: String, required: true },
  imageUrl:        { type: String },
  logoUrl:         { type: String },
  backgroundColor: { type: String, default: '#1a1a2e' },
  accentColor:     { type: String, default: '#f97316' },
  targetCities:    [{ type: String }],
  targetServices:  [{ type: String }],
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  priceNgn:        { type: Number, required: true, min: 0 },
  billingType:     { type: String, enum: ['flat','cpm','cpc'], default: 'flat' },
  cpmRate:         { type: Number },
  cpcRate:         { type: Number },
  budgetCap:       { type: Number },
  impressions:     { type: Number, default: 0 },
  clicks:          { type: Number, default: 0 },
  adminNotes:      { type: String },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
}, { timestamps: true })

adCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 })
adCampaignSchema.index({ placements: 1, status: 1 })

export const AdCampaign = model<IAdCampaign>('AdCampaign', adCampaignSchema)
