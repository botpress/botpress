import { z } from '@botpress/sdk'

/** A string that must contain at least 1 non-whitespace character. */
const NonBlankString = z.string().trim().min(1)

export const scheduleEventInputSchema = z.object({
  conversationId: NonBlankString.describe('The ID of the conversation').title('Conversation ID'),
  eventTypeUrl: NonBlankString.describe('The URL of the event type').title('Event Type URL'),
})

export const scheduleEventOutputSchema = z.object({})
