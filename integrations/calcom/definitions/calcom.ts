import { z } from '@botpress/sdk'

export const calcomEventTypeShema = z.object({
  id: z.number().describe('The unique identifier of the event type').title('Event Type ID'),
  lengthInMinutes: z.number().describe('The duration of the event type in minutes').title('Duration (minutes)'),
  title: z.string().describe('The title of the event type').title('Title'),
  slug: z.string().describe('The slug of the event type').title('Slug'),
  description: z.string().describe('A brief description of the event type').title('Description'),
  lengthInMinutesOptions: z
    .array(z.number())
    .optional()
    .describe('Available duration options for the event type')
    .title('Duration Options (minutes)'),
  hidden: z.boolean().describe('Indicates if the event type is hidden').title('Hidden'),
})
