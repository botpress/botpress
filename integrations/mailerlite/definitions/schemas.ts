import { z } from '@botpress/sdk'

export const subscriberSchema = z.object({
  id: z.string().title('Subscriber ID').describe('Unique identifier for the subscriber'),
  email: z.string().title('Email').describe('Subscriber email address'),
  status: z.string().title('Status').describe('Current subscription status of the subscriber'),
  source: z.string().title('Source').describe('Source where the subscriber was acquired from'),
  sent: z.number().nullable().title('Sent Count').describe('Number of emails sent to this subscriber'),
  opens_count: z.number().nullable().title('Opens Count').describe('Number of emails opened by this subscriber'),
  clicks_count: z.number().nullable().title('Clicks Count').describe('Number of email clicks by this subscriber'),
  open_rate: z.number().title('Open Rate').describe('Email open rate percentage for this subscriber'),
  click_rate: z.number().title('Click Rate').describe('Email click rate percentage for this subscriber'),
  ip_address: z.string().nullable().title('IP Address').describe('IP address of the subscriber'),
  subscribed_at: z.string().title('Subscribed At').describe('Timestamp when the subscriber was subscribed'),
  unsubscribed_at: z
    .string()
    .nullable()
    .title('Unsubscribed At')
    .describe('Timestamp when the subscriber was unsubscribed'),
  created_at: z.string().title('Created At').describe('Timestamp when the subscriber was created'),
  updated_at: z.string().title('Updated At').describe('Timestamp when the subscriber was last updated'),
  fields: z
    .object({
      city: z.string().nullable(),
      company: z.string().nullable(),
      country: z.string().nullable(),
      last_name: z.string().nullable(),
      name: z.string().nullable(),
      phone: z.string().nullable(),
      state: z.string().nullable(),
      zip: z.string().nullable(),
    })
    .partial()
    .passthrough()
    .title('Custom Fields')
    .describe('Custom fields associated with the subscriber'),
  groups: z.array(z.any()).optional().title('Groups').describe('Groups the subscriber belongs to'),
  opted_in_at: z.string().nullable().title('Opted In At').describe('Timestamp when the subscriber opted in'),
  optin_ip: z.string().nullable().title('Opt-in IP').describe('IP address used during opt-in'),
})

export const webhookSchema = z
  .object({
    event: z.string().title('Event Type').describe('Type of webhook event that occurred'),
  })
  .passthrough()

export const webhookResourceSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    url: z.string().optional(),
    events: z.array(z.string()).optional(),
  })
  .passthrough()

export const subscriberWebhookSchema = subscriberSchema.merge(webhookSchema)
