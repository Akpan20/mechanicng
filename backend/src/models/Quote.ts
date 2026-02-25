import { Schema, model, Document } from 'mongoose'

export interface IQuote extends Document {
  mechanicId: Schema.Types.ObjectId
  customerName: string
  customerPhone: string
  customerEmail?: string
  service: string
  note?: string
  status: 'pending' | 'responded' | 'closed'
  createdAt: Date
}

const quoteSchema = new Schema<IQuote>({
  mechanicId:    { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true },
  customerName:  { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  service:       { type: String, required: true },
  note:          { type: String },
  status:        { type: String, enum: ['pending', 'responded', 'closed'], default: 'pending' },
}, { timestamps: true })

quoteSchema.index({ mechanicId: 1, createdAt: -1 })

export const Quote = model<IQuote>('Quote', quoteSchema)
