import { default as sdk, z } from '@botpress/sdk'
import { events } from 'definitions/events'
import {
  type allSupportedEvents,
  commentCardEventSchema,
  type genericWebhookEvent,
  genericWebhookEventSchema,
  TRELLO_EVENTS,
} from 'definitions/schemas'
import { States } from 'definitions/states'
import { CardCommentHandler } from './handlers/card-comment'
import * as bp from '.botpress'

export const handler = async ({ req, client, ctx }: bp.HandlerProps) => {
  if (!_isBodyPresent({ req })) {
    return
  }

  const parsedWebhookEvent = _parseWebhookEvent({ req })
  await _ensureWebhookIsAuthenticated({ parsedWebhookEvent, ctx, client })
  await _handleWebhookEvent({ parsedWebhookEvent, client })
}

const _isBodyPresent = ({ req }: { req: sdk.Request }) => !!req.body?.length

const _parseWebhookEvent = ({ req }: { req: sdk.Request }) => {
  const body = JSON.parse(req.body as string)
  const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

  if (!success) {
    throw new sdk.RuntimeError('Invalid webhook event body', error)
  }

  return { ...data, action: { ...data.action, type: data.action.type as allSupportedEvents } }
}

const _ensureWebhookIsAuthenticated = async ({
  parsedWebhookEvent,
  ctx,
  client,
}: {
  parsedWebhookEvent: genericWebhookEvent
  ctx: bp.Context
  client: bp.Client
}) => {
  const { state } = await client.getState({
    type: 'integration',
    name: States.webhookState,
    id: ctx.integrationId,
  })

  if (parsedWebhookEvent?.webhook.id !== state.payload.trelloWebhookId) {
    throw new sdk.RuntimeError('Webhook request is not properly authenticated')
  }
}

const _handleWebhookEvent = async (props: { parsedWebhookEvent: genericWebhookEvent; client: bp.Client }) => {
  await Promise.allSettled([_handleCardComments(props), _publishEventToBotpress(props)])
}

const _handleCardComments = async ({
  parsedWebhookEvent,
  client,
}: {
  parsedWebhookEvent: genericWebhookEvent
  client: bp.Client
}) => {
  if (!parsedWebhookEvent || parsedWebhookEvent.action.type !== TRELLO_EVENTS.commentCard) {
    return
  }

  const cardCreationEvent = commentCardEventSchema.parse(parsedWebhookEvent)
  await CardCommentHandler.handleEvent(client, cardCreationEvent)
}

const _publishEventToBotpress = async ({
  parsedWebhookEvent,
  client,
}: {
  parsedWebhookEvent: genericWebhookEvent
  client: bp.Client
}) => {
  if (!parsedWebhookEvent || !Reflect.has(TRELLO_EVENTS, parsedWebhookEvent.action.type)) {
    return
  }

  const eventSchema = genericWebhookEventSchema.merge(
    z.object({
      action: genericWebhookEventSchema.shape.action.merge(
        z.object({
          data: events[parsedWebhookEvent.action.type].schema,
        })
      ),
    })
  )
  const validatedData = eventSchema.passthrough().parse(parsedWebhookEvent).action.data

  await client.createEvent({ type: parsedWebhookEvent.action.type, payload: validatedData })
}
