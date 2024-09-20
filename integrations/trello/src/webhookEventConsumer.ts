import { RuntimeError } from '@botpress/client'
import { z } from '@botpress/sdk'
import { events, TRELLO_EVENTS } from 'definitions/events'
import {
  type allSupportedEvents,
  genericWebhookEventSchema,
  type genericWebhookEvent,
  commentCardEventSchema,
} from 'definitions/schemas'
import { States } from 'definitions/states'
import * as bp from '../.botpress'
import { WebhookCardCommentConsumer } from './webhookCardCommentConsumer'

export class WebhookEventConsumer {
  private readonly _ctx: bp.HandlerProps['ctx']
  private readonly _client: bp.HandlerProps['client']
  private readonly _rawRequest: bp.HandlerProps['req']
  private _parsedWebhookEvent?: genericWebhookEvent

  public constructor({ req, client, ctx }: bp.HandlerProps) {
    this._ctx = ctx
    this._client = client
    this._rawRequest = req
  }

  public async consumeWebhookEvent() {
    if (!this._ensureBodyIsPresent()) {
      return
    }

    this._parseWebhookEvent()
    await this._ensureWebhookIsAuthenticated()
    await this._handleWebhookEvent()
  }

  private _ensureBodyIsPresent() {
    return this._rawRequest.body?.length ?? 0 > 0
  }

  private _parseWebhookEvent() {
    const body = JSON.parse(this._rawRequest.body as string)
    const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

    if (!success) {
      throw new RuntimeError('Invalid webhook event body', error)
    }

    this._parsedWebhookEvent = { ...data, action: { ...data.action, type: data.action.type as allSupportedEvents } }
  }

  private async _ensureWebhookIsAuthenticated() {
    const { state } = await this._client.getState({
      type: 'integration',
      name: States.webhookState,
      id: this._ctx.integrationId,
    })

    if (this._parsedWebhookEvent?.webhook.id !== state.payload.trelloWebhookId) {
      throw new RuntimeError('Webhook request is not properly authenticated')
    }
  }

  private async _handleWebhookEvent() {
    await Promise.allSettled([this._handleCardComments(), this._publishEventToBotpress()])
  }

  private async _handleCardComments() {
    if (!this._parsedWebhookEvent || this._parsedWebhookEvent.action.type !== TRELLO_EVENTS.commentCard) {
      return
    }

    const cardCreationEvent = commentCardEventSchema.parse(this._parsedWebhookEvent)

    const consumer = new WebhookCardCommentConsumer(this._client, cardCreationEvent)
    await consumer.consumeComment()
  }

  private async _publishEventToBotpress() {
    if (!this._parsedWebhookEvent || !Reflect.has(TRELLO_EVENTS, this._parsedWebhookEvent.action.type)) {
      return
    }

    const eventSchema = genericWebhookEventSchema.merge(
      z.object({
        action: genericWebhookEventSchema.shape.action.merge(
          z.object({
            data: events[this._parsedWebhookEvent.action.type].schema,
          })
        ),
      })
    )
    const validatedData = eventSchema.passthrough().parse(this._parsedWebhookEvent).action.data

    await this._client.createEvent({ type: this._parsedWebhookEvent.action.type, payload: validatedData })
  }
}
