// src/controllers/authController.ts
import crypto from 'crypto'
import { Request, Response } from 'express'
import { z } from 'zod'
import { User } from '../models/User'
import { signToken } from '../lib/jwt'
import { AuthRequest } from '../middleware/auth'
import nodemailer from 'nodemailer'

// ─── Schemas ──────────────────────────────────────────────────

const signupSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  fullName: z.string().min(2, 'Full name required').max(100),
  role:     z.enum(['user', 'mechanic']).default('user'),
  ref:      z.string().max(20).optional(),
})

const loginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
})

const updateProfileSchema = z.object({
  fullName:  z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().max(500).optional(),
}).strict()

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
})

const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

// ─── Helpers ──────────────────────────────────────────────────

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id:         user._id,
    email:      user.email,
    fullName:   user.fullName,
    role:       user.role,
    avatarUrl:  user.avatarUrl,
    mechanicId: user.mechanicId,
  }
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ─── Auth ─────────────────────────────────────────────────────

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const body = signupSchema.parse(req.body)
    const { ref, ...userData } = body  // extract referral code
    

    const exists = await User.findOne({ email: body.email })
    if (exists) {
      // Generic message — don't confirm whether email exists
      res.status(409).json({ error: 'Unable to create account with these details' })
      return
    }

    const user  = await User.create(body)
    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role })

    res.status(201).json({ token, user: serializeUser(user) })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('signup error:', err)
    res.status(500).json({ error: 'Failed to create account' })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = loginSchema.parse(req.body)

    const user = await User.findOne({ email: body.email }).select('+password')

    // Always run comparePassword even if user not found
    // prevents timing attacks that reveal valid emails
    const passwordValid = user
      ? await user.comparePassword(body.password)
      : await bcryptDummy()

    if (!user || !passwordValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role })
    res.json({ token, user: serializeUser(user) })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId)
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json(serializeUser(user))
  } catch (err) {
    console.error('getMe error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const updates = updateProfileSchema.parse(req.body)
    const user    = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json(serializeUser(user))
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('updateMe error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

// ─── Password reset ───────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)

    const user = await User.findOne({ email })

    // Always respond with the same message whether email exists or not
    // This prevents email enumeration
    const GENERIC = 'If that email is registered, a reset link has been sent'

    if (user) {
      const rawToken    = crypto.randomBytes(32).toString('hex')
      const hashedToken = hashToken(rawToken)

      user.resetToken       = hashedToken
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await user.save({ validateBeforeSave: false })

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`

      try {
        await transporter.sendMail({
          from:    process.env.SMTP_FROM,
          to:      user.email,
          subject: 'MechanicNG — Password Reset',
          html: `
            <p>Hi ${user.fullName},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in <strong>1 hour</strong>.</p>
            <p>If you did not request this, ignore this email — your password has not changed.</p>
          `,
        })
      } catch (mailErr) {
        // Don't leak mail errors to the client — just log them
        console.error('Password reset email failed:', mailErr)
        // Clear the token so it can be retried
        user.resetToken       = undefined
        user.resetTokenExpiry = undefined
        await user.save({ validateBeforeSave: false })
        res.status(500).json({ error: 'Failed to send reset email' })
        return
      }
    }

    res.json({ message: GENERIC })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('forgotPassword error:', err)
    res.status(500).json({ error: 'Failed to process request' })
  }
}
referredBy: ref ?? null,
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body)

    const hashedToken = hashToken(token)

    const user = await User.findOne({
      resetToken:       hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // not expired
    }).select('+password +resetToken +resetTokenExpiry')

    if (!user) {
      res.status(400).json({ error: 'Reset link is invalid or has expired' })
      return
    }

    // Set new password and clear reset token — single use
    user.password          = password
    user.resetToken        = undefined
    user.resetTokenExpiry  = undefined
    await user.save()

    // Issue a new login token so user is logged in immediately
    const authToken = signToken({ userId: user._id.toString(), email: user.email, role: user.role })
    res.json({ message: 'Password reset successful', token: authToken, user: serializeUser(user) })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('resetPassword error:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}

// ─── Timing attack dummy ──────────────────────────────────────
// Runs a bcrypt compare against a fake hash when user is not found
// so response time is identical whether the email exists or not
import bcrypt from 'bcryptjs'
const DUMMY_HASH = '$2a$12$dummyhashfortimingattackpreventiononlyxxxxxxxxxxxxxxxx'
async function bcryptDummy(): Promise<boolean> {
  await bcrypt.compare('dummy', DUMMY_HASH)
  return false
}