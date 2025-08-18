import * as CalendlyTypes from './calendly-schemas'
import type { CalendlyClient } from './utils'

// ------ Status Codes ------
const NO_CONTENT = 204 as const

export const getCurrentUser = async (axiosClient: CalendlyClient): Promise<CalendlyTypes.GetCurrentUserResp> => {
  const resp = await axiosClient.get<object>('/users/me')
  return CalendlyTypes.getCurrentUserRespSchema.parse(resp.data)
}

export async function getEventTypesList(
  axiosClient: CalendlyClient,
  userUri: CalendlyTypes.CalendlyUri
): Promise<CalendlyTypes.GetEventTypesListResp> {
  const searchParams = new URLSearchParams({ user: userUri })
  const resp = await axiosClient.get<object>(`/event_types?${searchParams}`)
  return CalendlyTypes.getEventTypesListRespSchema.parse(resp.data)
}

type WebhooksListParams =
  | {
      scope: 'organization'
      organization: CalendlyTypes.CalendlyUri
    }
  | {
      scope: 'user'
      organization: CalendlyTypes.CalendlyUri
      user: CalendlyTypes.CalendlyUri
    }

export async function getWebhooksList(
  axiosClient: CalendlyClient,
  params: WebhooksListParams
): Promise<CalendlyTypes.GetWebhooksListResp> {
  const searchParams = new URLSearchParams({ ...params, count: '100' })
  const resp = await axiosClient.get<object>(`/webhook_subscriptions?${searchParams}`)
  return CalendlyTypes.getWebhooksListRespSchema.parse(resp.data)
}

const _extractWebhookUuid = (webhookUri: CalendlyTypes.CalendlyUri) => {
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
      organization: CalendlyTypes.CalendlyUri
      events: WebhookEvents<'organization'>[]
      user?: undefined
      webhookUrl: string
    }
  | {
      scope: 'user'
      organization: CalendlyTypes.CalendlyUri
      user: CalendlyTypes.CalendlyUri
      events: WebhookEvents<'user'>[]
      webhookUrl: string
    }

export const createWebhook = async (
  httpClient: CalendlyClient,
  params: RegisterWebhookParams
): Promise<CalendlyTypes.CreateWebhookResp> => {
  const { webhookUrl, events, organization, scope, user } = params
  const resp = await httpClient.post<object>('/webhook_subscriptions', {
    url: webhookUrl,
    events,
    organization,
    user,
    scope,
  })
  return CalendlyTypes.createWebhookRespSchema.parse(resp.data)
}

export const removeWebhook = async (
  axiosClient: CalendlyClient,
  webhookUri: CalendlyTypes.CalendlyUri
): Promise<boolean> => {
  const webhookUuid = _extractWebhookUuid(webhookUri)
  const resp = await axiosClient.delete<object>(`/webhook_subscriptions/${webhookUuid}`)
  return resp.status === NO_CONTENT
}

export const createSingleUseSchedulingLink = async (
  axiosClient: CalendlyClient,
  eventType: CalendlyTypes.EventType
): Promise<CalendlyTypes.CreateSchedulingLinkResp> => {
  const resp = await axiosClient.post<object>('/scheduling_links', {
    max_event_count: 1,
    owner: eventType.uri,
    owner_type: 'EventType',
  })
  return CalendlyTypes.createSchedulingLinkRespSchema.parse(resp.data)
}
