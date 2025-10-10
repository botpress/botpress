import { createHmac, timingSafeEqual } from 'crypto'
import * as bp from '.botpress'

/** Validates BambooHR incoming request signatures
 *
 * Requires private webhook key stored in state during registration
 *
 * Throws Error with reason if invalid
 */
export const validateBambooHrSignature = async ({ ctx, client, req }: bp.HandlerProps) => {
  const signature = req.headers?.['x-bamboohr-signature']
  const timestamp = req.headers?.['x-bamboohr-timestamp']
  if (!signature || !timestamp) {
    throw new Error('Missing signature headers to verify webhook event.')
  }
  if (!req.body) {
    throw new Error('No request body found to verify signature.')
  }

  const { state } = await client.getState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
  })
  const privateKey = state.payload.privateKey
  if (!privateKey) {
    throw new Error('No private key found for webhook state.')
  }

  const computedBuffer = createHmac('sha256', privateKey)
    .update(Buffer.concat([Buffer.from(req.body, 'utf8'), Buffer.from(timestamp, 'utf8')]))
    .digest()
  const signatureBuffer = Buffer.from(signature, 'hex')
  const isValid = computedBuffer.length === signatureBuffer.length && timingSafeEqual(computedBuffer, signatureBuffer)

  if (!isValid) {
    throw new Error('Invalid BambooHR webhook signature.')
  }
}
