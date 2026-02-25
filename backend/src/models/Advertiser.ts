import { Schema, model, Document } from 'mongoose'

export interface IAdvertiser extends Document {
  businessName: string
  contactName: string
  email: string
  phone: string
  website?: string
  industry?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const advertiserSchema = new Schema<IAdvertiser>({
  businessName: { type: String, required: true },
  contactName:  { type: String, required: true },
  email:        { type: String, required: true, lowercase: true },
  phone:        { type: String, required: true },
  website:      { type: String },
  industry:     { type: String },
  notes:        { type: String },
}, { timestamps: true })

export const Advertiser = model<IAdvertiser>('Advertiser', advertiserSchema)
