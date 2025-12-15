import { Request } from '@botpress/sdk'
import crypto from 'crypto'

export const verifyUberSignature = (req: Request, webhookSigningKey: string) => {
  const signature = req.headers['x-uber-signature']

  if (!signature) {
    throw new Error('Missing X-Uber-Signature header')
  }

  if (!req.body) {
    throw new Error('Cannot validate signature: empty body')
  }

  if (typeof req.body !== 'string') {
    throw new Error('Expected raw body string for signature verification')
  }

  const computed = crypto.createHmac('sha256', webhookSigningKey).update(req.body, 'utf8').digest('hex').toLowerCase()

  if (computed !== signature.toLowerCase()) {
    throw new Error('Invalid Uber webhook signature')
  }

  return true
}
