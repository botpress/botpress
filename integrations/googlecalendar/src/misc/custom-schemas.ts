import { z, IntegrationDefinition } from '@botpress/sdk'

export type ActionDefinitions = NonNullable<IntegrationDefinition['actions']>
export type Schema = ActionDefinitions[string]['input']['schema']

const eventSchema = z.object({
  summary: z.string().describe('The event title/summary.'),
  description: z.string().nullable().optional().describe('The event description.'),
  location: z.string().nullable().optional().describe('The event location.'),
  startDateTime: z.string().describe('The start date and time in RFC3339 format (e.g., "2023-12-31T10:00:00.000Z").'),
  endDateTime: z.string().describe('The end date and time in RFC3339 format (e.g., "2023-12-31T12:00:00.000Z").'),
})

export const createEventInputSchema = eventSchema

export const createEventOutputSchema = z
  .object({
    eventId: z.string().describe('The ID of the created calendar event.'),
  })
  .partial()
  .passthrough()

export const updateEventInputSchema = eventSchema.extend({
  eventId: z.string().describe('The ID of the calendar event to update.'),
})

export const updateEventOutputSchema = z
  .object({
    eventId: z.string().describe('The ID of the updated calendar event.'),
    success: z.boolean().describe('Indicates whether the event update was successful.'),
  })
  .partial()
  .passthrough()

export const deleteEventInputSchema = z
  .object({
    eventId: z.string().describe('The ID of the calendar event to delete.'),
  })
  .partial()

export const deleteEventOutputSchema = z
  .object({
    eventId: z.string().describe('The ID of the updated calendar event.'),
    success: z.boolean().describe('Indicates whether the event deletion was successful.'),
  })
  .partial()
  .passthrough()

export const listEventsInputSchema = z
  .object({
    count: z.number().min(1).max(2500).default(100).describe('The maximum number of events to return.'),
    pageToken: z.string().optional().describe('Token specifying which result page to return.'),
    timeMin: z.string().optional().describe('The minimum start time of events to return.'),
  })
  .partial()

export const listEventsOutputSchema = z.object({
  events: z
    .array(
      z
        .object({
          eventId: z.string().nullable().describe('The ID of the calendar event.'),
          event: eventSchema.describe('The calendar event data.'),
        })
        .partial()
    )
    .describe('The list of calendar events.'),
  nextPageToken: z
    .string()
    .nullable()
    .optional()
    .describe('Token used to access the next page of this result. Omitted if no further results are available.'),
})
