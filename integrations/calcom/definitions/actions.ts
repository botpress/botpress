import { z } from '@botpress/sdk'

export const getEventTypesInputSchema = z.object({
  username: z.string().describe('The username of the Cal.com account').title('Username'),
})

export const getEventTypesOutputSchema = z.object({
  eventTypes: z
    .array(
      z.object({
        id: z.number().describe('The unique identifier of the event type').title('Event Type ID'),
        lengthInMinutes: z.number().describe('The duration of the event type in minutes').title('Duration (minutes)'),
        title: z.string().describe('The title of the event type').title('Title'),
        slug: z.string().describe('The slug of the event type').title('Slug'),
        description: z.string().describe('A brief description of the event type').title('Description'),
        lengthInMinutesOptions: z
          .array(z.number())
          .describe('Available duration options for the event type')
          .title('Duration Options (minutes)'),
      })
    )
    .describe('A list of event types associated with the Cal.com account')
    .title('Event Types'),
})

export const getAvailableTimeSlotsInputSchema = z.object({
  eventTypeId: z.number().min(1, 'Event Type ID is required'),
  startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
})

export const getAvailableTimeSlotsOutputSchema = z.object({
  slots: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
})

export const generateLinkInputSchema = z.object({
  conversationId: z
    .string()
    .describe('The ID of the conversation')
    .placeholder('{{ event.conversationId }}')
    .title('Conversation ID'),
  email: z
    .string()
    .email('Invalid email address')
    .describe('The email of the user to send the link to')
    .title('User Email'),
  eventTypeId: z
    .number()
    .min(1, 'Event Type ID is required')
    .describe('The ID of the event type')
    .title('Event Type ID'),
})

export const generateLinkOutputSchema = z.object({
  url: z.string().describe('The generated scheduling link').title('Scheduling Link URL'),
})

export const bookEventInputSchema = z.object({
  eventTypeId: z.number().min(1, 'Event Type ID is required'),
  start: z.string().min(1, 'Start time is required').describe('Start time in ISO 8601 format'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  timeZone: z.string().min(1, 'Time zone is required').describe('Time zone in IANA format, e.g., America/New_York'),
  conversationId: z
    .string()
    .optional()
    .placeholder('{{ event.conversationId }}')
    .describe('The ID of the conversation')
    .title('Conversation ID'),
})

export const bookEventOutputSchema = z.object({
  success: z.boolean().describe('Indicates if the booking was successful').title('Success'),
})
