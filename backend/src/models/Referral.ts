// backend/src/models/Referral.ts
import { Schema, model, Document } from 'mongoose'

export interface IReferral extends Document {
  affiliateId:    Schema.Types.ObjectId
  referredUserId: Schema.Types.ObjectId
  mechanicId?:    Schema.Types.ObjectId
  plan:           string
  amountPaid:     number        // full plan price in NGN
  commission:     number        // affiliate's cut in NGN
  status:         'pending' | 'credited' | 'paid_out'
  paystackRef?:   string
  createdAt:      Date
}

const referralSchema = new Schema<IReferral>({
  affiliateId:    { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  referredUserId: { type: Schema.Types.ObjectId, ref: 'User',      required: true },
  mechanicId:     { type: Schema.Types.ObjectId, ref: 'Mechanic'   },
  plan:           { type: String, required: true },
  amountPaid:     { type: Number, required: true },
  commission:     { type: Number, required: true },
  status:         { type: String, enum: ['pending', 'credited', 'paid_out'], default: 'pending' },
  paystackRef:    { type: String },
}, { timestamps: true })

export const Referral = model<IReferral>('Referral', referralSchema)