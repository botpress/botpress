import { z } from '@botpress/sdk'
import { nonBlankString } from './common'

const calendlyUri = nonBlankString.url().brand('CalendlyUri')
export type CalendlyUri = z.infer<typeof calendlyUri>

/** @see https://developer.calendly.com/api-docs/005832c83aeae-get-current-user */
export const getCurrentUserRespSchema = z.object({
  resource: z.object({
    avatar_url: nonBlankString.url().nullable(),
    created_at: z.coerce.date(),
    current_organization: calendlyUri,
    email: nonBlankString.email(),
    locale: z.union([
      z.literal('en'),
      z.literal('fr'),
      z.literal('es'),
      z.literal('de'),
      z.literal('pt'),
      z.literal('ps'),
    ]),
    /** Human Readable format */
    name: nonBlankString,
    resource_type: nonBlankString,
    scheduling_url: nonBlankString.url(),
    slug: nonBlankString,
    time_notation: z.union([z.literal('12h'), z.literal('24h')]),
    /** e.g. 'America/New_York' */
    timezone: nonBlankString,
    updated_at: z.coerce.date(),
    /** The user's calendly URI */
    uri: calendlyUri,
  }),
})
export type GetCurrentUserResp = z.infer<typeof getCurrentUserRespSchema>

export const webhookDetailsSchema = z.object({
  callback_url: z.string(),
  created_at: z.coerce.date(),
  creator: z.string(),
  events: z.array(z.string()),
  group: z.null(),
  organization: calendlyUri,
  retry_started_at: z.union([z.coerce.date(), z.null()]),
  scope: z.string(),
  state: z.string(),
  updated_at: z.coerce.date(),
  uri: calendlyUri,
  user: calendlyUri.nullable(),
})
export type WebhookDetails = z.infer<typeof webhookDetailsSchema>

export const paginationSchema = z.object({
  count: z.number(),
  next_page: z.null(),
  next_page_token: z.null(),
  previous_page: z.null(),
  previous_page_token: z.null(),
})
export type Pagination = z.infer<typeof paginationSchema>

/** @see https://developer.calendly.com/api-docs/faac832d7c57d-list-webhook-subscriptions */
export const getWebhooksListRespSchema = z.object({
  collection: z.array(webhookDetailsSchema),
  pagination: paginationSchema,
})
export type GetWebhooksListResp = z.infer<typeof getWebhooksListRespSchema>

/** @see https://developer.calendly.com/api-docs/c1ddc06ce1f1b-create-webhook-subscription */
export const createWebhookRespSchema = z.object({
  resource: webhookDetailsSchema,
})
export type CreateWebhookResp = z.infer<typeof createWebhookRespSchema>
