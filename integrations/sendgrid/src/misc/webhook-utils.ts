import { EventWebhook } from '@sendgrid/eventwebhook'
import * as bp from '../../.botpress'
import { safeParseJson } from './utils'

const WEBHOOK_SIGNATURE_HEADER = 'x-twilio-email-event-webhook-signature' as const
const WEBHOOK_TIMESTAMP_HEADER = 'x-twilio-email-event-webhook-timestamp' as const

const ewh = new EventWebhook()

export const parseWebhookData = (props: bp.HandlerProps) => {
  if (!props.req.body) {
    return null
  }

  const result = safeParseJson(props.req.body)
  if (!result.success) {
    props.logger.error('Unable to parse SendGrid request body', result.error)
    return null
  }

  const parsedBody = result.data
  const publicKey = props.ctx.configuration.publicSignatureKey
  const signature = props.req.headers[WEBHOOK_SIGNATURE_HEADER]
  const timestamp = props.req.headers[WEBHOOK_TIMESTAMP_HEADER]

  if (!publicKey) {
    if (signature || timestamp) {
      props.logger.warn(
        "Webhook signatures have been enabled in SendGrid dashboard but the public key hasn't been provided in the Botpress configuration"
      )
    }
    return {
      body: parsedBody,
      publicKey: null,
    }
  }

  if (!signature || !timestamp) {
    props.logger.error('A public key was provided but webhook request is missing the required headers')
    return null
  }

  return {
    body: parsedBody,
    // The raw body MUST NOT be trimmed of whitespace!
    rawBody: props.req.body,
    publicKey: ewh.convertPublicKeyToECDSA(publicKey),
    signature,
    timestamp,
  }
}
type NullableParsedWebhookData = ReturnType<typeof parseWebhookData>

type PublicKey = ReturnType<typeof ewh.convertPublicKeyToECDSA>
export const verifyWebhookSignature = (data: Extract<NullableParsedWebhookData, { publicKey: PublicKey }>) => {
  return ewh.verifySignature(data.publicKey, data.rawBody, data.signature, data.timestamp)
}
