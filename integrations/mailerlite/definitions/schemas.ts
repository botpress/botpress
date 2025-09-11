import { z } from '@botpress/sdk'

export const subscriberSchema = z.object({
    id: z.string(),
    email: z.string(),
    status: z.string(),
    source: z.string(),
    sent: z.number(),
    opens_count: z.number(),
    clicks_count: z.number(),
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
        z_i_p: z.string().nullable()
    }),
    groups: z.array(z.any()),
    opted_in_at: z.string().nullable(),
    optin_ip: z.string().nullable()
})
