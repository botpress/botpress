import { z } from '@botpress/sdk'

export const webhookEvent = z.object({
  type: z.string().title('Type').describe('The type of event'),
  organizationId: z.string().title('Organization Id').describe('Organization associated with the event'),
  id: z.string().title('Id').describe('ID of the event'),
  webhookId: z.string().title('Webhook Id').describe('The ID of the webhook').optional(),
  createdAt: z.string().title('Created At').describe('Date when the event was created').optional(),
  deliveryStatus: z.string().title('Delivery Status').describe('The status of the event').optional(),
  firstSentAt: z.string().title('First Sent At').describe('First delivery time').optional(),
  deliveryAttempts: z
    .number()
    .title('Delivery Attempts')
    .describe('The number of times the event tried to be delivered')
    .optional(),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  profilePicture: z.string().optional(),
})
