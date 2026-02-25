import { Request, Response } from 'express'
import { z } from 'zod'
import { User } from '../models/User'
import { signToken } from '../lib/jwt'
import { AuthRequest } from '../middleware/auth'

const signupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name required'),
  role:     z.enum(['user', 'mechanic']).default('user'),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const updateProfileSchema = z.object({
  fullName:  z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
}).strict()

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

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const body = signupSchema.parse(req.body)

    const exists = await User.findOne({ email: body.email })
    if (exists) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const user  = await User.create(body)
    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role })

    res.status(201).json({ token, user: serializeUser(user) })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = loginSchema.parse(req.body)

    const user = await User.findOne({ email: body.email }).select('+password')
    if (!user || !(await user.comparePassword(body.password))) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role })
    res.json({ token, user: serializeUser(user) })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId)
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json(serializeUser(user))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
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
    res.status(500).json({ error: (err as Error).message })
  }
}
