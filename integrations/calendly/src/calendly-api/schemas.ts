import { z } from '@botpress/sdk'
import { nonBlankString } from 'definitions/common'

export const calendlyUri = nonBlankString.url().brand('CalendlyUri')
export type CalendlyUri = z.infer<typeof calendlyUri>

export const paginationSchema = z.object({
  count: z.number(),
  next_page: nonBlankString.url().nullable(),
  next_page_token: nonBlankString.nullable(),
  previous_page: nonBlankString.url().nullable(),
  previous_page_token: nonBlankString.nullable(),
})
export type Pagination = z.infer<typeof paginationSchema>

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

export const eventQuestionSchema = z.object({
  name: nonBlankString,
  type: nonBlankString,
  position: z.number(),
  enabled: z.boolean(),
  required: z.boolean(),
  answer_choices: z.array(nonBlankString),
  include_other: z.boolean(),
})
export type EventQuestion = z.infer<typeof eventQuestionSchema>

export const eventTypeSchema = z.object({
  uri: nonBlankString.url(),
  name: nonBlankString.nullable(),
  active: z.boolean(),
  slug: nonBlankString.nullable(),
  scheduling_url: nonBlankString.url(),
  duration: z.number(),
  duration_options: z.array(z.number()).nullable(),
  kind: nonBlankString,
  pooling_type: nonBlankString.nullable(),
  type: nonBlankString,
  color: nonBlankString,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  internal_note: nonBlankString.nullable(),
  description_plain: nonBlankString.nullable(),
  description_html: nonBlankString.nullable(),
  profile: z
    .object({
      type: nonBlankString,
      name: nonBlankString,
      owner: nonBlankString.url(),
    })
    .nullable(),
  secret: z.boolean(),
  booking_method: nonBlankString,
  custom_questions: z.array(eventQuestionSchema),
  deleted_at: z.coerce.date().nullable(),
  admin_managed: z.boolean(),
  locations: z
    .array(
      z.object({
        kind: nonBlankString,
        location: nonBlankString.optional(),
        additional_info: nonBlankString.optional(),
        phone_number: nonBlankString.optional(),
      })
    )
    .nullable(),
  position: z.number(),
  locale: nonBlankString,
})
export type EventType = z.infer<typeof eventTypeSchema>

/** @see https://developer.calendly.com/api-docs/25a4ece03c1bc-list-user-s-event-types */
export const getEventTypesListRespSchema = z.object({
  collection: z.array(eventTypeSchema),
  pagination: paginationSchema,
})
export type GetEventTypesListResp = z.infer<typeof getEventTypesListRespSchema>

/** @see https://developer.calendly.com/api-docs/4b8195084e287-create-single-use-scheduling-link */
export const createSchedulingLinkRespSchema = z.object({
  resource: z.object({
    booking_url: nonBlankString.url(),
    owner: calendlyUri,
    owner_type: nonBlankString,
  }),
})
export type CreateSchedulingLinkResp = z.infer<typeof createSchedulingLinkRespSchema>

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
