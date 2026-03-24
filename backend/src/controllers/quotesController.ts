import { Request, Response } from 'express';
import { z } from 'zod';
import { Quote } from '../models/Quote';
import { Mechanic } from '../models/Mechanic';
import { createNotification } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

const createQuoteSchema = z.object({
  mechanicId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional(),
  service: z.string().min(2),
  note: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'responded', 'closed']),
});

export async function submitQuote(req: Request, res: Response): Promise<void> {
  try {
    const body = createQuoteSchema.parse(req.body);
    const quote = await Quote.create({ ...body, status: 'pending' });

    // Notify the mechanic
    try {
      const mechanic = await Mechanic.findById(body.mechanicId).select('userId name');
      if (mechanic && mechanic.userId) {
        await createNotification({
          userId: mechanic.userId.toString(),
          type: 'info',
          title: 'New Quote Request',
          message: `You have a new quote request from ${body.customerName} for "${body.service}".`,
          link: `/dashboard/quotes/${quote._id}`,
        });
      }
    } catch (notifErr) {
      console.error('Failed to send notification:', notifErr);
    }

    res.status(201).json({ ...quote.toObject(), id: quote._id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getQuotesByMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quotes = await Quote.find({ mechanicId: req.params.mechanicId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(quotes.map(q => ({ ...q, id: q._id })));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function updateQuoteStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    // Optional: notify customer. This requires mapping email to user ID.
    // We'll skip for now to avoid errors. Uncomment when user lookup is implemented.
    /*
    try {
      if (quote.customerEmail) {
        const user = await User.findOne({ email: quote.customerEmail }).select('_id');
        if (user) {
          await createNotification({
            userId: user._id.toString(),
            type: status === 'responded' ? 'success' : 'info',
            title: 'Quote Status Updated',
            message: `Your quote for "${quote.service}" is now ${status}.`,
            link: `/quotes/${quote._id}`,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to send customer notification:', notifErr);
    }
    */

    res.json({ success: true, status: quote.status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    res.status(500).json({ error: (err as Error).message });
  }
}