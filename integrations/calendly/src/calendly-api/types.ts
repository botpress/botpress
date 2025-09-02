import type { CalendlyUri } from './schemas'
import type * as bp from '.botpress'

export type WebhooksListParams =
  | {
      scope: 'organization'
      organization: CalendlyUri
    }
  | {
      scope: 'user'
      organization: CalendlyUri
      user: CalendlyUri
    }

type WebhookScopes = 'organization' | 'user'
type WebhookEvents<Scope extends WebhookScopes = WebhookScopes> =
  | 'invitee.created'
  | 'invitee.canceled'
  | 'invitee_no_show.created'
  | 'invitee_no_show.deleted'
  | (Scope extends 'organization' ? 'routing_form_submission.created' : never)

export type RegisterWebhookParams =
  | {
      scope: 'organization'
      organization: CalendlyUri
      events: WebhookEvents<'organization'>[]
      user?: undefined
      webhookUrl: string
      signingKey?: string
    }
  | {
      scope: 'user'
      organization: CalendlyUri
      user: CalendlyUri
      events: WebhookEvents<'user'>[]
      webhookUrl: string
      signingKey?: string
    }

export type ContextOfType<T extends bp.Context['configurationType']> = Extract<bp.Context, { configurationType: T }>
