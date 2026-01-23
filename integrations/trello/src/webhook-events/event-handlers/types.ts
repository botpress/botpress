import { TrelloWebhook } from '../schemas/common'
import * as bp from '.botpress'

/** Used to enforce the signature of a webhook event handler */
type WebhookEventHandler = (
  props: bp.HandlerProps,
  eventType: keyof typeof bp.events,
  eventPayload: Required<TrelloWebhook>
) => Promise<Awaited<ReturnType<bp.Client['createEvent']>> | null>

// Type testing utils
export type IsWebhookHandler<Handler extends (...args: any) => any> =
  Parameters<Handler> extends Parameters<WebhookEventHandler>
    ? ReturnType<Handler> extends ReturnType<WebhookEventHandler>
      ? true
      : false
    : false
export type Expect<_T extends true> = void
