// src/models/User.ts
import { Schema, model, Document, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password: string
  fullName: string
  role: 'user' | 'mechanic' | 'admin'
  referredBy?: string | null
  avatarUrl?: string
  mechanicId?: Types.ObjectId
  resetToken?: string
  resetTokenExpiry?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never returned by default
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'mechanic', 'admin'],
      default: 'user',
    },
    referredBy: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: 'Mechanic',
    },
    resetToken: {
      type: String,
      select: false, // hashed token, never exposed
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password
        delete ret.resetToken
        delete ret.resetTokenExpiry
        return ret
      },
    },
  }
)

// Indexes for performance
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ referredBy: 1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance method to compare passwords
userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const User = model<IUser>('User', userSchema)