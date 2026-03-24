import { Request, Response } from 'express'
import { z } from 'zod'
import { Quote } from '../models/Quote'
import { Mechanic } from '../models/Mechanic'
import { createNotification } from '../services/notificationService'
import { AuthRequest } from '../middleware/auth'

const createQuoteSchema = z.object({
  mechanicId:    z.string().min(1),
  customerName:  z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional(),
  service:       z.string().min(2),
  note:          z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'responded', 'closed']),
})

export async function submitQuote(req: Request, res: Response): Promise<void> {
  try {
    const body  = createQuoteSchema.parse(req.body)
    const quote = await Quote.create({ ...body, status: 'pending' })

    // 👇 Notify the mechanic about the new quote
    try {
      // Find the mechanic document to get the userId (the account owner)
      const mechanic = await Mechanic.findById(body.mechanicId).select('userId name')
      if (mechanic && mechanic.userId) {
        await createNotification({
          userId: mechanic.userId,
          type: 'info',
          title: 'New Quote Request',
          message: `You have a new quote request from ${body.customerName} for "${body.service}".`,
          link: `/dashboard/quotes/${quote._id}`,
        })
      }
    } catch (notifErr) {
      // Log but don't block the main response
      console.error('Failed to send notification:', notifErr)
    }

    res.status(201).json({ ...quote.toObject(), id: quote._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getQuotesByMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quotes = await Quote.find({ mechanicId: req.params.mechanicId })
      .sort({ createdAt: -1 })
      .lean()
    res.json(quotes.map(q => ({ ...q, id: q._id })))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateQuoteStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = updateStatusSchema.parse(req.body)
    const quote      = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return }

    // 👇 Optionally notify the customer when status changes
    try {
      // You might want to store customerEmail in the quote and notify them
      if (quote.customerEmail) {
        await createNotification({
          userId: quote.customerEmail, // This assumes you have a way to map email to user ID; adjust as needed
          type: status === 'responded' ? 'success' : 'info',
          title: 'Quote Status Updated',
          message: `Your quote for "${quote.service}" is now ${status}.`,
          link: `/quotes/${quote._id}`,
        })
      }
    } catch (notifErr) {
      console.error('Failed to send customer notification:', notifErr)
    }

    res.json({ success: true, status: quote.status })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}