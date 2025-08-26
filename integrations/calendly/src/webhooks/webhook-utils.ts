import crypto from 'crypto'
import type { Result } from '../types'
import { safeParseJson } from '../utils'
import { type InviteeEvent, inviteeEventSchema } from './schemas'
import { getWebhookSigningKey } from './signing-key'
import type * as bp from '.botpress'

const MS_PER_SECOND = 1000 as const
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const WEBHOOK_SIGNATURE_TOLERANCE_MS = 3 * MS_PER_MINUTE
const WEBHOOK_SIGNATURE_HEADER = 'calendly-webhook-signature' as const

export const parseWebhookEvent = (props: bp.HandlerProps): Result<InviteeEvent> => {
  const { body } = props.req
  if (!body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const parseResult = safeParseJson(body)
  if (!parseResult.success) {
    return { success: false, error: new Error('Unable to parse Calendly Webhook Payload', parseResult.error) }
  }

  const zodResult = inviteeEventSchema.safeParse(parseResult.data)
  if (!zodResult.success) {
    props.logger.error('Webhook handler received unexpected payload', zodResult.error)
    return { success: false, error: new Error('Invalid webhook payload structure', zodResult.error) }
  }

  return {
    success: true,
    data: zodResult.data,
  }
}

export const verifyWebhookSignature = async (
  props: bp.HandlerProps
): Promise<{ success: true } | { success: false; error: Error }> => {
  const headerResult = _parseSignatureHeader(props.req.headers)
  if (!headerResult.success) {
    return headerResult
  }
  const { timestamp, signature } = headerResult.data

  const signingKey = await getWebhookSigningKey(props)

  const payload = `${timestamp}.${props.req.body}`
  const expected = crypto.createHmac('sha256', signingKey).update(payload, 'utf8').digest('hex')

  if (expected !== signature) {
    return { success: false, error: new Error('Webhook event did not match the expected signature') }
  }

  // Prevent replay attacks
  if (timestamp * MS_PER_SECOND < Date.now() - WEBHOOK_SIGNATURE_TOLERANCE_MS) {
    return { success: false, error: new Error('Webhook event was received outside of the accepted tolerance zone') }
  }

  return { success: true }
}

const _malformedSignatureHeaderError = () => new Error('Calendly webhook signature header is malformed')

type ParseSignatureHeaderData = {
  timestamp: number
  signature: string
}

const TIMESTAMP_PREFIX = 't=' as const
const SIGNATURE_PREFIX = 'v1=' as const
const _parseSignatureHeader = (headers: Record<string, string | undefined>): Result<ParseSignatureHeaderData> => {
  const signatureHeader = headers[WEBHOOK_SIGNATURE_HEADER]?.trim() ?? ''
  if (signatureHeader.length === 0) {
    return { success: false, error: new Error('Calendly webhook signature header is missing from the request') }
  }

  const signatureHeaderParts = signatureHeader.split(',')
  if (signatureHeaderParts.length !== 2) {
    return { success: false, error: _malformedSignatureHeaderError() }
  }

  const [rawTimestamp, rawSignature] = signatureHeaderParts as [string, string]
  if (!rawTimestamp.startsWith(TIMESTAMP_PREFIX) || !rawSignature.startsWith(SIGNATURE_PREFIX)) {
    return { success: false, error: _malformedSignatureHeaderError() }
  }

  const timestampSeconds = parseInt(rawTimestamp.slice(TIMESTAMP_PREFIX.length), 10)
  if (isNaN(timestampSeconds)) {
    return { success: false, error: _malformedSignatureHeaderError() }
  }

  return {
    success: true,
    data: {
      timestamp: timestampSeconds,
      signature: rawSignature.slice(SIGNATURE_PREFIX.length),
    },
  }
}
