import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  mongoose.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id         = ret._id
      ret.created_at = ret.createdAt
      ret.updated_at = ret.updatedAt
      delete ret._id
      delete ret.__v
      delete ret.createdAt
      delete ret.updatedAt
      return ret
    }
  })

  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'))
  mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err))
  await mongoose.connect(uri)
}