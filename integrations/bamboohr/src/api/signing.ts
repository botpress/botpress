import * as sdk from '@botpress/sdk'
import { createHmac, timingSafeEqual } from 'crypto'

export type ValidateBambooHrSignatureResult =
  | {
      success: true
    }
  | {
      success: false
      reason: string
    }

export const validateBambooHrSignature = async (
  req: sdk.Request,
  privateKey: string
): Promise<ValidateBambooHrSignatureResult> => {
  const signature = req.headers?.['x-bamboohr-signature']
  const timestamp = req.headers?.['x-bamboohr-timestamp']
  if (!signature || !timestamp) {
    return { success: false, reason: 'Missing signature headers to verify webhook event.' }
  }
  if (!req.body) {
    return { success: false, reason: 'No request body found to verify signature.' }
  }

  const computedBuffer = createHmac('sha256', privateKey)
    .update(Buffer.concat([Buffer.from(req.body, 'utf8'), Buffer.from(timestamp, 'utf8')]))
    .digest()
  const signatureBuffer = Buffer.from(signature, 'hex')
  const isValid = computedBuffer.length === signatureBuffer.length && timingSafeEqual(computedBuffer, signatureBuffer)

  if (!isValid) {
    return { success: false, reason: 'Invalid BambooHR webhook signature.' }
  }

  return { success: true }
}
