import crypto from 'crypto'
import { Result } from '../types'
import { safeParseJson } from '../utils'
import { AllEnvelopeEvents, allEnvelopeEventsSchema } from './schemas'
import * as bp from '.botpress'

export const parseWebhookEvent = (props: bp.HandlerProps): Result<AllEnvelopeEvents> => {
  const { body } = props.req
  if (!body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const parseResult = safeParseJson(body)
  if (!parseResult.success) {
    return {
      success: false,
      error: new Error(`Unable to parse Docusign Webhook Payload: ${parseResult.error.message}`),
    }
  }

  const zodResult = allEnvelopeEventsSchema.safeParse(parseResult.data)
  if (!zodResult.success) {
    const errorMsg = `Webhook handler received unexpected payload: ${zodResult.error.message}`
    props.logger.error(errorMsg)
    return { success: false, error: new Error(errorMsg) }
  }

  return {
    success: true,
    data: zodResult.data,
  }
}

export const verifyWebhookSignature = (props: bp.HandlerProps): Result<null> => {
  const { body, headers } = props.req
  if (!body) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const headerResult = _parseSignatureHeader(headers)
  if (!headerResult.success) {
    return headerResult
  }
  const signatureHash = headerResult.data
  const signingKey = bp.secrets.WEBHOOK_SIGNING_SECRET!

  try {
    const computedHash = _computeHash(signingKey, body)
    const isValid = _isHashValid(signatureHash, computedHash)
    if (!isValid) {
      return { success: false, error: new Error('Webhook failed signature verification') }
    }

    return { success: true, data: null }
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, error }
  }
}

const WEBHOOK_SIGNATURE_HEADER = 'x-docusign-signature-1' as const
const _parseSignatureHeader = (headers: Record<string, string | undefined> | undefined): Result<string> => {
  const signatureHeader = headers?.[WEBHOOK_SIGNATURE_HEADER]

  if (!signatureHeader || signatureHeader.length === 0) {
    return { success: false, error: new Error('Docusign webhook signature header is missing from the request') }
  }

  return {
    success: true,
    data: signatureHeader,
  }
}

const _computeHash = (secret: string, payload: string): string => {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.write(payload)
  hmac.end()
  return hmac.read().toString('base64')
}

const _isHashValid = (signature: string, payloadHash: string) => {
  const signatureBuffer = Buffer.from(signature, 'base64')
  const payloadBuffer = Buffer.from(payloadHash, 'base64')
  return crypto.timingSafeEqual(signatureBuffer, payloadBuffer)
}
