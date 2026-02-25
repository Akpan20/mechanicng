import { Schema, model, Document } from 'mongoose'

export interface ISubscription extends Document {
  mechanicId: Schema.Types.ObjectId
  plan: 'free' | 'standard' | 'pro'
  status: 'active' | 'cancelled' | 'expired' | 'trialing'
  paystackSubscriptionCode?: string
  paystackCustomerCode?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  createdAt: Date
}

const subscriptionSchema = new Schema<ISubscription>({
  mechanicId:               { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true },
  plan:                     { type: String, enum: ['free', 'standard', 'pro'], required: true },
  status:                   { type: String, enum: ['active', 'cancelled', 'expired', 'trialing'], default: 'active' },
  paystackSubscriptionCode: { type: String },
  paystackCustomerCode:     { type: String },
  currentPeriodStart:       { type: Date, required: true },
  currentPeriodEnd:         { type: Date, required: true },
}, { timestamps: true })

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema)
