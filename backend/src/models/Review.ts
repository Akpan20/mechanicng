import { Schema, model, Document } from 'mongoose'

export interface IReview extends Document {
  mechanicId: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  userName: string
  rating: number
  comment: string
  createdAt: Date
}

const reviewSchema = new Schema<IReview>({
  mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, required: true, trim: true },
}, { timestamps: true })

reviewSchema.index({ mechanicId: 1, createdAt: -1 })

export const Review = model<IReview>('Review', reviewSchema)
