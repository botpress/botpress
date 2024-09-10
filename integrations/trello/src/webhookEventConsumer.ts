import { RuntimeError } from '@botpress/client'
import { z } from '@botpress/sdk'
import { events, TrelloEvent } from 'definitions/events'
import { States } from 'definitions/states'
import * as bp from '../.botpress'
import { commentCardEventSchema } from './schemas/webhookEvents/commentCardEventSchema'
import {
  type allSupportedEvents,
  genericWebhookEventSchema,
  type genericWebhookEvent,
} from './schemas/webhookEvents/genericWebhookEventSchema'
import { WebhookCardCommentConsumer } from './webhookCardCommentConsumer'

export class WebhookEventConsumer {
  private readonly ctx: bp.HandlerProps['ctx']
  private readonly client: bp.HandlerProps['client']
  private readonly rawRequest: bp.HandlerProps['req']
  private parsedWebhookEvent!: genericWebhookEvent

  public constructor({ req, client, ctx }: bp.HandlerProps) {
    this.ctx = ctx
    this.client = client
    this.rawRequest = req
  }

  public async consumeWebhookEvent() {
    if (!this.ensureBodyIsPresent()) {
      return
    }

    this.parseWebhookEvent()
    await this.ensureWebhookIsAuthenticated()
    await this.handleWebhookEvent()
  }

  private ensureBodyIsPresent() {
    return this.rawRequest.body?.length ?? 0 > 0
  }

  private parseWebhookEvent() {
    const body = JSON.parse(this.rawRequest.body as string)
    const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

    if (!success) {
      throw new RuntimeError('Invalid webhook event body', error)
    }

    this.parsedWebhookEvent = { ...data, action: { ...data.action, type: data.action.type as allSupportedEvents } }
  }

  private async ensureWebhookIsAuthenticated() {
    const { state } = await this.client.getState({
      type: 'integration',
      name: States.webhookState,
      id: this.ctx.integrationId,
    })

    if (this.parsedWebhookEvent.webhook.id !== state.payload.trelloWebhookId) {
      throw new RuntimeError('Webhook request is not properly authenticated')
    }
  }

  private async handleWebhookEvent() {
    await Promise.allSettled([this.handleCardComments(), this.publishEventToBotpress()])
  }

  private async handleCardComments() {
    if (this.parsedWebhookEvent.action.type !== TrelloEvent.commentCard) {
      return
    }

    const cardCreationEvent = commentCardEventSchema.parse(this.parsedWebhookEvent)

    const consumer = new WebhookCardCommentConsumer(this.client, cardCreationEvent)
    await consumer.consumeComment()
  }

  private async publishEventToBotpress() {
    if (!Reflect.has(TrelloEvent, this.parsedWebhookEvent.action.type)) {
      return
    }

    const eventSchema = genericWebhookEventSchema.merge(
      z.object({
        action: genericWebhookEventSchema.shape.action.merge(
          z.object({
            data: events[this.parsedWebhookEvent.action.type].schema,
          })
        ),
      })
    )
    const validatedData = eventSchema.passthrough().parse(this.parsedWebhookEvent).action.data

    await this.client.createEvent({ type: this.parsedWebhookEvent.action.type, payload: validatedData })
  }
}
