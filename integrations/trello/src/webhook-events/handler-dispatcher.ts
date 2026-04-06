import crypto from 'crypto'
import { TrelloEventType } from 'definitions/events'
import { Result } from '../types'
import { safeParseRequestBody } from '../utils'
import { dispatchIntegrationEvent } from './event-handlers'
import { fallbackEventPayloadSchema, WebhookEventPayload, webhookEventPayloadSchema } from './schemas'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps): Promise<void> => {
  if (_verifyWebhookSignature(props)) {
    props.logger.forBot().error('The provided webhook payload failed its signature validation')
    return
  }

  const payloadResult = _parseWebhookPayload(props)
  if (!payloadResult.success) {
    const { error } = payloadResult
    props.logger.forBot().error(error.message, error)
    return
  }

  await dispatchIntegrationEvent(props, payloadResult.data)
}

const _isSupportedEventType = (type: string) => Object.values<string>(TrelloEventType).includes(type)

const _parseWebhookPayload = (props: bp.HandlerProps): Result<WebhookEventPayload> => {
  const result = safeParseRequestBody(props.req.body)
  if (!result.success) return result

  const payloadResult = webhookEventPayloadSchema.safeParse(result.data)
  if (payloadResult.success) return payloadResult

  // Checks for payloads that don't match supported events, or if a supported
  // event has a data structure that doesn't match the configured event schema
  const fallbackPayloadResult = fallbackEventPayloadSchema.safeParse(result.data)
  if (!fallbackPayloadResult.success) {
    return {
      success: false,
      error: new Error(`The webhook payload has an unexpected format -> ${fallbackPayloadResult.error.message}`),
    }
  }

  const eventType = fallbackPayloadResult.data.action.type
  if (_isSupportedEventType(eventType)) {
    return {
      success: false,
      error: new Error(
        `The event data for the supported event type '${eventType}' has an unexpected format -> ${payloadResult.error.message}`
      ),
    }
  }

  return {
    success: false,
    error: new Error(`Unsupported Trello event type: '${eventType}'`),
  }
}

/** This only exists because for some reason `process.env.BP_WEBHOOK_URL` is not set */
const _getWebhookUrl = (ctx: bp.Context) =>
  `${process.env.BP_API_URL}/${ctx.webhookId}`.replace(/\w+(?=\.botpress)/, 'webhook')

const _base64Digest = (secret: string, content: string) => {
  return crypto.createHmac('sha1', secret).update(content).digest('base64')
}

const _verifyWebhookSignature = (props: bp.HandlerProps) => {
  const { req, ctx } = props
  const { trelloApiSecret } = ctx.configuration
  if (!trelloApiSecret) {
    // No secret configured, skip verification
    return true
  }

  const callbackURL = _getWebhookUrl(ctx)

  const content = (req.body ?? '') + callbackURL
  const doubleHash = _base64Digest(trelloApiSecret, content)
  const headerHash = req.headers['x-trello-webhook']
  return doubleHash === headerHash
}
