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
      organization: string
    }
  | {
      scope: 'user'
      organization: string
      user: string
    }

export async function getWebhooksList(
  axiosClient: CalendlyClient,
  params: WebhooksListParams
): Promise<CalendlyDefs.GetWebhooksList> {
  const searchParams = new URLSearchParams({ ...params, count: '100' })
  const resp = await axiosClient.get<object>(`/webhook_subscriptions?${searchParams}`)
  return CalendlyDefs.getWebhooksListSchema.parse(resp.data)
}

const _extractWebhookUuid = (webhookUri: CalendlyDefs.CalendlyUri) => {
  const match = webhookUri.match(/\/webhook_subscriptions\/(.+)$/)
  return match ? match[1] : null
}

export const removeWebhook = async (
  axiosClient: CalendlyClient,
  webhookUri: CalendlyDefs.CalendlyUri
): Promise<boolean> => {
  const webhookUuid = _extractWebhookUuid(webhookUri)
  const resp = await axiosClient.delete<object>(`/webhook_subscriptions/${webhookUuid}`)
  return resp.status === NO_CONTENT
}
