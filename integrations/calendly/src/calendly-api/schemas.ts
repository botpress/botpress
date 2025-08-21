import { z } from '@botpress/sdk'

export const calendlyUri = z.string().url().brand('CalendlyUri')
export type CalendlyUri = z.infer<typeof calendlyUri>

export const uuidSchema = z.string().uuid()

export const paginationSchema = z
  .object({
    count: z.number(),
    next_page: z.string().url().nullable(),
    next_page_token: z.string().nullable(),
    previous_page: z.string().url().nullable(),
    previous_page_token: z.string().nullable(),
  })
  .passthrough()
export type Pagination = z.infer<typeof paginationSchema>

/** @see https://developer.calendly.com/api-docs/005832c83aeae-get-current-user */
export const getCurrentUserRespSchema = z
  .object({
    resource: z.object({
      avatar_url: z.string().url().nullable(),
      created_at: z.coerce.date(),
      current_organization: calendlyUri,
      email: z.string().email(),
      locale: z.string(),
      /** Human Readable format */
      name: z.string(),
      resource_type: z.string(),
      scheduling_url: z.string().url(),
      slug: z.string(),
      time_notation: z.string(),
      /** e.g. 'America/New_York' */
      timezone: z.string(),
      updated_at: z.coerce.date(),
      /** The user's calendly URI */
      uri: calendlyUri,
    }),
  })
  .passthrough()
export type GetCurrentUserResp = z.infer<typeof getCurrentUserRespSchema>

export const eventQuestionSchema = z
  .object({
    name: z.string(),
    type: z.string(),
    position: z.number(),
    enabled: z.boolean(),
    required: z.boolean(),
    answer_choices: z.array(z.string()),
    include_other: z.boolean(),
  })
  .passthrough()
export type EventQuestion = z.infer<typeof eventQuestionSchema>

export const eventTypeSchema = z
  .object({
    uri: z.string().url(),
    name: z.string().nullable(),
    active: z.boolean(),
    slug: z.string().nullable(),
    scheduling_url: z.string().url(),
    duration: z.number(),
    duration_options: z.array(z.number()).nullable(),
    kind: z.string(),
    pooling_type: z.string().nullable(),
    type: z.string(),
    color: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    internal_note: z.string().nullable(),
    description_plain: z.string().nullable(),
    description_html: z.string().nullable(),
    profile: z
      .object({
        type: z.string(),
        name: z.string(),
        owner: z.string().url(),
      })
      .passthrough()
      .nullable(),
    secret: z.boolean(),
    booking_method: z.string(),
    custom_questions: z.array(eventQuestionSchema),
    deleted_at: z.coerce.date().nullable(),
    admin_managed: z.boolean(),
    locations: z
      .array(
        z
          .object({
            kind: z.string(),
            location: z.string().optional(),
            additional_info: z.string().optional(),
            phone_number: z.string().optional(),
          })
          .passthrough()
      )
      .nullable(),
    position: z.number(),
    locale: z.string(),
  })
  .passthrough()
export type EventType = z.infer<typeof eventTypeSchema>

/** @see https://developer.calendly.com/api-docs/25a4ece03c1bc-list-user-s-event-types */
export const getEventTypesListRespSchema = z
  .object({
    collection: z.array(eventTypeSchema),
    pagination: paginationSchema,
  })
  .passthrough()
export type GetEventTypesListResp = z.infer<typeof getEventTypesListRespSchema>

/** @see https://developer.calendly.com/api-docs/4b8195084e287-create-single-use-scheduling-link */
export const createSchedulingLinkRespSchema = z
  .object({
    resource: z
      .object({
        booking_url: z.string().url(),
        owner: calendlyUri,
        owner_type: z.string(),
      })
      .passthrough(),
  })
  .passthrough()
export type CreateSchedulingLinkResp = z.infer<typeof createSchedulingLinkRespSchema>

export const webhookDetailsSchema = z
  .object({
    callback_url: z.string(),
    created_at: z.coerce.date(),
    creator: z.string(),
    events: z.array(z.string()),
    group: z.null(),
    organization: calendlyUri,
    retry_started_at: z.coerce.date().nullable(),
    scope: z.string(),
    state: z.string(),
    updated_at: z.coerce.date(),
    uri: calendlyUri,
    user: calendlyUri.nullable(),
  })
  .passthrough()
export type WebhookDetails = z.infer<typeof webhookDetailsSchema>

/** @see https://developer.calendly.com/api-docs/faac832d7c57d-list-webhook-subscriptions */
export const getWebhooksListRespSchema = z
  .object({
    collection: z.array(webhookDetailsSchema),
    pagination: paginationSchema,
  })
  .passthrough()
export type GetWebhooksListResp = z.infer<typeof getWebhooksListRespSchema>

/** @see https://developer.calendly.com/api-docs/c1ddc06ce1f1b-create-webhook-subscription */
export const createWebhookRespSchema = z
  .object({
    resource: webhookDetailsSchema,
  })
  .passthrough()
export type CreateWebhookResp = z.infer<typeof createWebhookRespSchema>

export const getOAuthAccessTokenRespSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.string().min(1),
    expires_in: z.number().min(0),
    refresh_token: z.string().min(1),
    scope: z.string().min(1),
    created_at: z.number().min(0),
    owner: calendlyUri,
    organization: calendlyUri,
  })
  .transform((data) => {
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      refreshToken: data.refresh_token,
      expiresAt: new Date((data.created_at + data.expires_in) * 1000),
      userUri: data.owner,
      organizationUri: data.organization,
    }
  })

export type GetOAuthAccessTokenResp = z.infer<typeof getOAuthAccessTokenRespSchema>
