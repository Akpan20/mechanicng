// backend/src/models/Affiliate.ts
import { Schema, model, Document } from 'mongoose'

export interface IAffiliate extends Document {
  userId:          Schema.Types.ObjectId
  code:            string        // unique referral code e.g. AKAN20
  email:           string
  fullName:        string
  commissionRate:  number        // e.g. 0.20 = 20%
  totalEarnings:   number        // in NGN
  pendingPayout:   number        // unpaid earnings
  totalReferrals:  number
  bankName?:       string
  accountNumber?:  string
  accountName?:    string
  status:          'active' | 'suspended'
  createdAt:       Date
  updatedAt:       Date
}

const affiliateSchema = new Schema<IAffiliate>({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code:           { type: String, required: true, unique: true, uppercase: true },
  email:          { type: String, required: true },
  fullName:       { type: String, required: true },
  commissionRate: { type: Number, default: 0.20 },  // 20% default
  totalEarnings:  { type: Number, default: 0 },
  pendingPayout:  { type: Number, default: 0 },
  totalReferrals: { type: Number, default: 0 },
  bankName:       { type: String },
  accountNumber:  { type: String },
  accountName:    { type: String },
  status:         { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true })

export const Affiliate = model<IAffiliate>('Affiliate', affiliateSchema)