import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'
import * as bp from '../../../.botpress'

const allSupportedEvents: string[] = Reflect.ownKeys(bp.events).map((e) => e.toString())

export const genericWebhookEventSchema = z.object({
  action: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the action'),
    idMemberCreator: TrelloIDSchema.describe('Unique identifier of the member who initiated the action'),
    type: z
      .string()
      .refine((e) => allSupportedEvents.includes(e))
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

type allSupportedEvents = keyof typeof bp.events
export type genericWebhookEvent = Omit<z.infer<typeof genericWebhookEventSchema>, 'action'> & {
  action: Omit<z.infer<typeof genericWebhookEventSchema.shape.action>, 'type'> & { type: allSupportedEvents }
}
export default genericWebhookEventSchema
