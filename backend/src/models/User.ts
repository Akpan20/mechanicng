import { Schema, model, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: string
  email: string
  password: string
  fullName: string
  role: 'user' | 'mechanic' | 'admin'
  avatarUrl?: string
  mechanicId?: string
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  fullName:   { type: String, required: true, trim: true },
  role:       { type: String, enum: ['user', 'mechanic', 'admin'], default: 'user' },
  avatarUrl:  { type: String },
  mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic' },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const User = model<IUser>('User', userSchema)
