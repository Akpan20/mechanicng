import { Request, Response } from 'express'
import crypto from 'crypto'
import { Subscription } from '../models/Subscription'
import { Mechanic } from '../models/Mechanic'
import { AuthRequest } from '../middleware/auth'

export async function getSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sub = await Subscription.findOne({
      mechanicId: req.params.mechanicId,
      status: 'active',
    }).lean()

    if (!sub) {
      res.status(404).json({ error: 'No active subscription' })
      return
    }
    res.json({ ...sub, id: sub._id })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verify Paystack signature
    const secret = process.env.PAYSTACK_SECRET_KEY ?? ''
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const { event, data } = req.body as {
      event: string
      data: {
        subscription_code?: string
        metadata?: { mechanic_id?: string; plan?: string }
        customer?: { customer_code?: string }
        amount?: number
        plan?: { name?: string }
        reference?: string
      }
    }

    // Handle subscription creation or payment success
    if (event === 'subscription.create' || event === 'charge.success') {
      const mechanicId = data.metadata?.mechanic_id
      const plan = data.metadata?.plan ?? 'standard'

      if (mechanicId) {
        // Deactivate any previous subscriptions for this mechanic
        await Subscription.updateMany(
          { mechanicId, status: 'active' },
          { status: 'expired' }
        )

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

    // Handle subscription disable (cancelled)
    if (event === 'subscription.disable') {
      await Subscription.findOneAndUpdate(
        { paystackSubscriptionCode: data.subscription_code },
        { status: 'cancelled' }
      )
      // Downgrade mechanic to free
      const sub = await Subscription.findOne({ paystackSubscriptionCode: data.subscription_code })
      if (sub) await Mechanic.findByIdAndUpdate(sub.mechanicId, { plan: 'free' })
    }

    // Handle payment failure
    if (event === 'invoice.payment_failed') {
      await Subscription.findOneAndUpdate(
        { paystackSubscriptionCode: data.subscription_code },
        { status: 'expired' }
      )
    }

    res.json({ received: true })
  } catch (err) {
    // Always return 200 to Paystack to prevent retries on our own errors
    console.error('Webhook error:', (err as Error).message)
    res.json({ received: true })
  }
}