import { TrelloWebhook } from '../schemas/common'
import * as bp from '.botpress'

/** Used to enforce the signature of a webhook event handler */
export type WebhookEventHandler = (
  props: bp.HandlerProps,
  eventType: keyof typeof bp.events,
  eventPayload: Required<TrelloWebhook>
) => ReturnType<bp.Client['createEvent']>
