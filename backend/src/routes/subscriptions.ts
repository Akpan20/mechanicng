import { Router, Response } from 'express'
import { Subscription } from '../models/Subscription'
import { Mechanic } from '../models/Mechanic'
import { authenticate, AuthRequest } from '../middleware/auth'
import crypto from 'crypto'

const router = Router()

// GET /api/subscriptions/:mechanicId
router.get('/:mechanicId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findOne({ mechanicId: req.params.mechanicId, status: 'active' }).lean()
    if (!sub) { res.status(404).json({ error: 'No active subscription' }); return }
    res.json({ ...sub, id: sub._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/subscriptions/webhook — Paystack webhook
router.post('/webhook', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY ?? ''
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex')
    if (hash !== req.headers['x-paystack-signature']) {
      res.status(401).json({ error: 'Invalid signature' }); return
    }

    const { event, data } = req.body

    if (event === 'subscription.create' || event === 'charge.success') {
      const mechanicId = data.metadata?.mechanic_id
      const plan       = data.metadata?.plan ?? 'standard'
      if (mechanicId) {
        await Subscription.create({
          mechanicId,
          plan,
          status: 'active',
          paystackSubscriptionCode: data.subscription_code,
          paystackCustomerCode: data.customer?.customer_code,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        await Mechanic.findByIdAndUpdate(mechanicId, { plan })
      }
    }

    if (event === 'subscription.disable') {
      await Subscription.findOneAndUpdate(
        { paystackSubscriptionCode: data.subscription_code },
        { status: 'cancelled' }
      )
    }

    res.json({ received: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
