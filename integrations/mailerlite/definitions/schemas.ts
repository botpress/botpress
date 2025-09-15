import { z } from '@botpress/sdk'

export const subscriberSchema = z.object({
    id: z.string(),
    email: z.string(),
    status: z.string(),
    source: z.string(),
    sent: z.number().nullable(),
    opens_count: z.number().nullable(),
    clicks_count: z.number().nullable(),
    open_rate: z.number(),
    click_rate: z.number(),
    ip_address: z.string().nullable(),
    subscribed_at: z.string(),
    unsubscribed_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    fields: z.object({
        city: z.string().nullable(),
        company: z.string().nullable(),
        country: z.string().nullable(),
        last_name: z.string().nullable(),
        name: z.string().nullable(),
        phone: z.string().nullable(),
        state: z.string().nullable(),
        zip: z.string().nullable(),
      }).partial().passthrough(),
    groups: z.array(z.any()).optional(),
    opted_in_at: z.string().nullable(),
    optin_ip: z.string().nullable()
})

export const groupSchema = z.object({
    id: z.string(),
    name: z.string(),
    active_count: z.number(),
    sent_count: z.number(),
    opens_count: z.number(),
    open_rate: z.object({
        float: z.number(),
        string: z.string()
    }),
    clicks_count: z.number(),
    click_rate: z.object({
        float: z.number(),
        string: z.string()
    }),
    unsubscribed_count: z.number(),
    unconfirmed_count: z.number(),
    bounced_count: z.number(),
    junk_count: z.number(),
    created_at: z.string()
})

export const groupsResponseSchema = z.object({
    data: z.array(groupSchema),
    links: z.object({
        first: z.string(),
        last: z.string(),
        prev: z.string().nullable(),
        next: z.string().nullable()
    }),
    meta: z.object({
        current_page: z.number(),
        from: z.number().nullable(),
        last_page: z.number(),
        links: z.array(z.object({
          url: z.string().nullable(),
          label: z.string(),
          active: z.boolean(),
        })),
        path: z.string(),
        per_page: z.number(),
        to: z.number().nullable(),
        total: z.number(),
      })
})

export const campaignSchema = z.object({
    id: z.string(),
    name: z.string(),
    total_recipients: z.number(),
    preview_url: z.string(),
    date: z.string(),
})

export const webhookSchema = z.object({
    event: z.string()
}).passthrough()

export const webhookResourceSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    url: z.string().optional(),
    events: z.array(z.string()).optional(),
  }).passthrough()

export const subscriberWebhookSchema = subscriberSchema.merge(webhookSchema)

export const campaignWebhookSchema = campaignSchema.merge(webhookSchema)