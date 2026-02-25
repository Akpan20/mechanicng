// Paystack integration for mechanic subscriptions
declare global {
  interface Window {
    PaystackPop: {
      setup(options: PaystackOptions): { openIframe(): void }
    }
  }
}

export interface PaystackResponse {
  reference: string
  trans: string
  status: string
  message: string
  transaction: string
  trxref: string
}

export interface PaystackOptions {
  key: string
  email: string
  amount: number          // in kobo (NGN * 100)
  currency: string
  plan?: string
  ref?: string
  metadata?: Record<string, unknown>
  callback: (response: PaystackResponse) => void
  onClose: () => void
}

export async function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

export async function initializePayment(
  options: Omit<PaystackOptions, 'key' | 'currency'>
): Promise<void> {
  await loadPaystackScript()
  const fullOptions: PaystackOptions = {
    key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
    currency: 'NGN',
    ...options,
  }
  const handler = window.PaystackPop.setup(fullOptions)
  handler.openIframe()
}

export function generateReference(prefix = 'MECHNG'): string {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `${prefix}_${Date.now()}_${randomPart}`
}

export async function verifyPaymentOnServer(reference: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-webhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', reference }),
      }
    )
    if (!res.ok) {
      throw new Error(`Verify request failed: ${res.status}`)
    }
    const data = await res.json()
    return data.verified === true
  } catch (err) {
    console.error('Payment verification failed:', err)
    return false
  }
}