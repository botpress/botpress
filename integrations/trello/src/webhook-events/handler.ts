import { TrelloEventType } from 'definitions/events'
import { Result } from 'src/types'
import { tryParseRequestBody } from 'src/utils'
import { dispatchIntegrationEvent } from './event-handlers'
import { fallbackEventPayloadSchema, WebhookEventPayload, webhookEventPayloadSchema } from './schemas'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps): Promise<void> => {
  const payloadResult = _parseWebhookPayload(props)
  if (!payloadResult.success) {
    const { error } = payloadResult
    props.logger.forBot().error(error.message, error)
    return
  }

  if (!(await _verifyWebhookSignature(props, payloadResult.data))) {
    props.logger.forBot().error("The provided webhook payload failed it's signature validation")
    return
  }

  await dispatchIntegrationEvent(props, payloadResult.data)
}

const _isSupportedEventType = (type: string) => Object.values<string>(TrelloEventType).includes(type)

const _parseWebhookPayload = (props: bp.HandlerProps): Result<WebhookEventPayload> => {
  const result = tryParseRequestBody(props.req.body)
  if (!result.success) return result

  const payloadResult = webhookEventPayloadSchema.safeParse(result.data)
  if (payloadResult.success) return payloadResult

  // Checks for payloads that don't match supported events, or if a supported
  // event has a data structure that doesn't match the configured event schema
  const fallbackPayloadResult = fallbackEventPayloadSchema.safeParse(result.data)
  if (!fallbackPayloadResult.success) return fallbackPayloadResult

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

const _verifyWebhookSignature = async ({ client, ctx }: bp.HandlerProps, eventPayload: WebhookEventPayload) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'webhook',
    id: ctx.integrationId,
  })

  return eventPayload.webhook.id !== state.payload.trelloWebhookId
}
