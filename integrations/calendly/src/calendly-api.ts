import * as CalendlyDefs from 'definitions/calendly'
import type { CalendlyClient } from './utils'

// ------ Status Codes ------
const NO_CONTENT = 204 as const

export const getCurrentUser = async (axiosClient: CalendlyClient): Promise<CalendlyDefs.GetCurrentUserResponse> => {
  const resp = await axiosClient.get<object>(`/users/me`)
  return CalendlyDefs.getCurrentUserResponseSchema.parse(resp.data)
}

type WebhooksListParams =
  | {
      scope: 'organization'
      organization: CalendlyDefs.CalendlyUri
    }
  | {
      scope: 'user'
      organization: CalendlyDefs.CalendlyUri
      user: CalendlyDefs.CalendlyUri
    }

export async function getWebhooksList(
  axiosClient: CalendlyClient,
  params: WebhooksListParams
): Promise<CalendlyDefs.GetWebhooksListResp> {
  const searchParams = new URLSearchParams({ ...params, count: '100' })
  const resp = await axiosClient.get<object>(`/webhook_subscriptions?${searchParams}`)
  return CalendlyDefs.getWebhooksListRespSchema.parse(resp.data)
}

const _extractWebhookUuid = (webhookUri: CalendlyDefs.CalendlyUri) => {
  const match = webhookUri.match(/\/webhook_subscriptions\/(.+)$/)
  return match ? match[1] : null
}

type WebhookScopes = 'organization' | 'user'
type WebhookEvents<Scope extends WebhookScopes = WebhookScopes> =
  | 'invitee.created'
  | 'invitee.canceled'
  | 'invitee_no_show.created'
  | 'invitee_no_show.deleted'
  | (Scope extends 'organization' ? 'routing_form_submission.created' : never)

type RegisterWebhookParams =
  | {
      scope: 'organization'
      organization: CalendlyDefs.CalendlyUri
      events: WebhookEvents<'organization'>[]
      user?: undefined
      webhookUrl: string
    }
  | {
      scope: 'user'
      organization: CalendlyDefs.CalendlyUri
      user: CalendlyDefs.CalendlyUri
      events: WebhookEvents<'user'>[]
      webhookUrl: string
    }

export const createWebhook = async (
  httpClient: CalendlyClient,
  params: RegisterWebhookParams
): Promise<CalendlyDefs.CreateWebhookResp> => {
  const { webhookUrl, events, organization, scope, user } = params
  const resp = await httpClient.post<object>(`/webhook_subscriptions`, {
    url: webhookUrl,
    events,
    organization,
    user,
    scope,
  })
  return CalendlyDefs.createWebhookRespSchema.parse(resp.data)
}

export const removeWebhook = async (
  axiosClient: CalendlyClient,
  webhookUri: CalendlyDefs.CalendlyUri
): Promise<boolean> => {
  const webhookUuid = _extractWebhookUuid(webhookUri)
  const resp = await axiosClient.delete<object>(`/webhook_subscriptions/${webhookUuid}`)
  return resp.status === NO_CONTENT
}
