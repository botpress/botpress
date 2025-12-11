import { Request } from '@botpress/sdk'
import crypto from 'crypto'

export const verifyUberSignature = (req: Request, clientSecret: string) => {
  const signature = req.headers['x-uber-signature']

  if (!signature) {
    throw new Error('Missing X-Uber-Signature header')
  }

  if (!req.body) {
    throw new Error('Cannot validate signature: empty body')
  }

  const computed = crypto.createHmac('sha256', clientSecret).update(req.body, 'utf8').digest('hex').toLowerCase()

  if (computed !== signature.toLowerCase()) {
    throw new Error('Invalid Uber webhook signature')
  }

  return true
}
