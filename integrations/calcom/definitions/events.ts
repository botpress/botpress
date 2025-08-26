import { z } from '@botpress/sdk'

export const eventScheduledSchema = z.object({
  event: z.string().describe('The event type').title('Event Type'),
  conversationId: z.string().optional().describe('The ID of the conversation').title('Conversation ID'),
})
