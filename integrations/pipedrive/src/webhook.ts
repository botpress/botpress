import { z } from '@botpress/sdk'
import axios from 'axios'

const pipeDriveBaseUrl = 'https://api.pipedrive.com/v1'

type CreateWebhookResponse = {
  success: boolean
  data: {
    id: number
    subscription_url: string
    event_action: string
    event_object: string
  }
}

type DeleteWebhookResponse = {
  status?: string
  success?: boolean
}

export const createWebhook = async function createWebhook(
  apiKey: string,
  eventAction: string,
  eventObject: string,
  webhookUrl: string
): Promise<CreateWebhookResponse> {
  const response = await axios.post<CreateWebhookResponse>(
    `${pipeDriveBaseUrl}/webhooks`,
    {
      subscription_url: webhookUrl,
      event_action: eventAction,
      event_object: eventObject,
    },
    {
      params: {
        api_token: apiKey,
      },
    }
  )
  return response.data
}

export const deleteWebhook = async function deleteWebhook(
  apiKey: string,
  webhookId: string
): Promise<DeleteWebhookResponse> {
  const res = await axios.delete(`${pipeDriveBaseUrl}/webhooks/${webhookId}`, {
    params: {
      api_token: apiKey,
    },
  })
  return res.data
}

export const webhookPayloadSchema = z.object({
  v: z.number(),
  matches_filters: z.object({
    current: z.any().array(),
  }),
  meta: z.object({
    v: z.number(),
    action: z.string(),
    object: z.string(),
    id: z.number(),
    company_id: z.number(),
    user_id: z.number(),
    host: z.string(),
    timestamp: z.number(),
  }),
})
