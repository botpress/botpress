import { default as sdk, z } from '@botpress/sdk'
import {
  events,
  type AllSupportedEvents,
  type GenericWebhookEvent,
  genericWebhookEventSchema,
  TrelloEventType,
} from 'definitions/events'
import { dispatchIntegrationEvent } from './event-handlers'
import { CardCommentHandler } from './handlers/card-comment'
import { webhookEventPayloadSchema } from './schemas'
import { commentAddedEventActionSchema } from './schemas/card-comment-event-schemas'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps) => {
  if (!_isBodyPresent({ req: props.req })) {
    return
  }

  const parsedWebhookEvent = _parseWebhookEvent({ req: props.req })
  await _ensureWebhookIsAuthenticated({ parsedWebhookEvent, ctx: props.ctx, client: props.client })
  await _handleWebhookEvent(props, parsedWebhookEvent)
}

const _isBodyPresent = ({ req }: { req: sdk.Request }) => !!req.body?.length

const _parseWebhookEvent = ({ req }: { req: sdk.Request }) => {
  const body = JSON.parse(req.body as string)
  const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

  if (!success) {
    throw new sdk.RuntimeError('Invalid webhook event body', error)
  }

  return { ...data, action: { ...data.action, type: data.action.type as AllSupportedEvents } }
}

const _ensureWebhookIsAuthenticated = async ({
  parsedWebhookEvent,
  ctx,
  client,
}: {
  parsedWebhookEvent: GenericWebhookEvent
  ctx: bp.Context
  client: bp.Client
}) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'webhook',
    id: ctx.integrationId,
  })

  if (parsedWebhookEvent?.webhook.id !== state.payload.trelloWebhookId) {
    throw new sdk.RuntimeError('Webhook request is not properly authenticated')
  }
}

const _handleWebhookEvent = async (props: bp.HandlerProps, event: GenericWebhookEvent) => {
  await Promise.allSettled([_handleCardComments(props, event), _publishEventToBotpress(props, event)])
}

const _handleCardComments = async ({ client }: bp.HandlerProps, event: GenericWebhookEvent) => {
  if (!event || event.action.type !== TrelloEventType.CARD_COMMENT_ADDED) {
    return
  }

  const cardCreationEvent = commentAddedEventActionSchema.parse(event.action)
  await CardCommentHandler.handleEvent(client, cardCreationEvent)
}

const _publishEventToBotpress = async (props: bp.HandlerProps, event: GenericWebhookEvent) => {
  const result = webhookEventPayloadSchema.safeParse(event)
  if (result.success) {
    await dispatchIntegrationEvent(props, result.data)
  }
  const { client } = props

  if (!event || !Reflect.has(TrelloEventType, event.action.type)) {
    return
  }

  const eventSchema = genericWebhookEventSchema.merge(
    z.object({
      action: genericWebhookEventSchema.shape.action.merge(
        z.object({
          data: events[event.action.type].schema,
        })
      ),
    })
  )
  const validatedData = eventSchema.passthrough().parse(event).action.data

  await client.createEvent({ type: event.action.type, payload: validatedData })
}
