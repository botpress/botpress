import { z } from '@botpress/sdk'
import { TrelloEvent } from 'definitions/events'
import { TrelloIDSchema } from '..'

export const genericWebhookEventSchema = z.object({
  action: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the action'),
    idMemberCreator: TrelloIDSchema.describe('Unique identifier of the member who initiated the action'),
    type: z
      .string()
      .refine((e) => Reflect.ownKeys(TrelloEvent).includes(e))
      .describe('Type of the action'),
    date: z.string().datetime().describe('Date of the action'),
    data: z.any(),
    memberCreator: z
      .object({
        id: TrelloIDSchema.describe('Unique identifier of the member'),
        fullName: z.string().describe('Full name of the member'),
        username: z.string().describe('Username of the member'),
        initials: z.string().describe('Initials of the member'),
        avatarHash: z.string().describe('Avatar hash of the member'),
        avatarUrl: z.string().describe('Avatar URL of the member'),
      })
      .describe('Member who initiated the action'),
  }),
  model: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the model that is being watched'),
  }),
  webhook: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the webhook'),
    idModel: TrelloIDSchema.describe('Unique identifier of the model that is being watched'),
    active: z.boolean().describe('Whether the webhook is active'),
    consecutiveFailures: z.number().min(0).describe('Number of consecutive failures'),
  }),
})

export type allSupportedEvents = keyof typeof TrelloEvent
export type genericWebhookEvent = Omit<z.infer<typeof genericWebhookEventSchema>, 'action'> & {
  action: Omit<z.infer<typeof genericWebhookEventSchema.shape.action>, 'type'> & { type: allSupportedEvents }
}
