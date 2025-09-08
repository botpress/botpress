import { z } from '@botpress/sdk'

export const scheduleEventInputSchema = z.object({
  conversationId: z
    .string()
    .describe('The ID of the conversation')
    .placeholder('{{ event.conversationId }}')
    .title('Conversation ID'),
  eventTypeUrl: z.string().describe('The URL of the event type').title('Event Type URL'),
})

export const scheduleEventOutputSchema = z.object({
  bookingUrl: z
    .string()
    .url()
    .describe('A link that brings the user to the event scheduling form')
    .title('Scheduling Link URL'),
  owner: z.string().url().describe('A link to the resource that owns this scheduling link').title('Event Owner'),
  ownerType: z.string().describe('The type of the resource that owns this scheduling link').title('Resource Type'),
})
