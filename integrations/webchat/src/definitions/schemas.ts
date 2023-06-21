import z from 'zod'

export const TriggerSchema = z.object({
  origin: z.literal('website').describe('The origin of the event trigger'),
  userId: z.string().uuid().describe('The webchat userId that triggered the event'),
  conversationId: z.string().uuid().describe('The webchat conversationId that triggered the event'),
  payload: z.record(z.any()).describe('The payload to send with the event'),
})
