import { Schema, model, Document } from 'mongoose'

export interface IMechanic extends Document {
  userId: Schema.Types.ObjectId
  name: string
  type: 'shop' | 'mobile'
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  plan: 'free' | 'standard' | 'pro'
  phone: string
  whatsapp: string
  email: string
  city: string
  area: string
  address?: string
  location: { type: 'Point'; coordinates: [number, number] } // [lng, lat]
  serviceRadius?: number
  services: string[]
  hours: string
  priceRange: 'low' | 'mid' | 'high'
  bio?: string
  photos: string[]
  rating: number
  reviewCount: number
  verified: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

const mechanicSchema = new Schema<IMechanic>({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  type:          { type: String, enum: ['shop', 'mobile'], required: true },
  status:        { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  plan:          { type: String, enum: ['free', 'standard', 'pro'], default: 'free' },
  phone:         { type: String, required: true },
  whatsapp:      { type: String, required: true },
  email:         { type: String, required: true, lowercase: true },
  city:          { type: String, required: true },
  area:          { type: String, required: true },
  address:       { type: String },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  serviceRadius: { type: Number },
  services:      [{ type: String }],
  hours:         { type: String, required: true },
  priceRange:    { type: String, enum: ['low', 'mid', 'high'], required: true },
  bio:           { type: String },
  photos:        [{ type: String }],
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0 },
  verified:      { type: Boolean, default: false },
  featured:      { type: Boolean, default: false },
}, { timestamps: true })

mechanicSchema.index({ location: '2dsphere' })
mechanicSchema.index({ city: 1, status: 1 })
mechanicSchema.index({ services: 1 })
mechanicSchema.index({ plan: -1, rating: -1 })

export const Mechanic = model<IMechanic>('Mechanic', mechanicSchema)
