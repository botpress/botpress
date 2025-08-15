import { z } from '@botpress/sdk'
import { nonBlankString } from './common'

export const scheduleEventInputSchema = z.object({
  conversationId: nonBlankString.describe('The ID of the conversation').title('Conversation ID'),
  eventTypeUrl: nonBlankString.describe('The URL of the event type').title('Event Type URL'),
})

export const scheduleEventOutputSchema = z.object({})
