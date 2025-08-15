import { z } from '@botpress/sdk'
import { nonBlankString } from './common'

export const scheduleEventInputSchema = z.object({
  conversationId: nonBlankString
    .describe('The ID of the conversation (e.g. `{{ event.conversationId }}`)')
    .title('Conversation ID'),
  eventTypeUrl: nonBlankString.describe('The URL of the event type').title('Event Type URL'),
})

export const scheduleEventOutputSchema = z.object({
  bookingUrl: nonBlankString
    .url()
    .describe('A link that brings the user to the event scheduling form')
    .title('Scheduling Link URL'),
  owner: nonBlankString.url().describe('A link to the resource that owns this scheduling link').title('Event Owner'),
  ownerType: nonBlankString.describe('The type of the resource that owns this scheduling link').title('Resource Type'),
})
