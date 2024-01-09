import { IntegrationDefinition } from '@botpress/sdk'
import z from 'zod'

export type ActionDefinitions = NonNullable<IntegrationDefinition['actions']>
export type Schema = ActionDefinitions[string]['input']['schema']

// Define a common schema for calendar events
const eventSchema = z.object({
  summary: z.string().describe('The event title/summary.'),
  description: z.string().nullable().optional().describe('The event description.'),
  location: z.string().nullable().optional().describe('The event location.'),
  startDateTime: z.string().describe('The start date and time in ISO 8601 format (e.g., "2023-12-31T10:00:00Z").'),
  endDateTime: z.string().describe('The end date and time in ISO 8601 format (e.g., "2023-12-31T12:00:00Z").'),
})

// Define input and output schemas for Google Calendar actions
export const createEventInputSchema = z.object({
  event: eventSchema.describe('The event data to create a new calendar event.'),
}) satisfies Schema

export const createEventOutputSchema = z
  .object({
    eventId: z.string().nullable().describe('The ID of the created calendar event.'),
  })
  .partial()
  .passthrough() satisfies Schema

export const updateEventInputSchema = z.object({
  eventId: z.string().describe('The ID of the calendar event to update.'),
  event: eventSchema.describe('The updated event data.'),
}) satisfies Schema

export const updateEventOutputSchema = z
  .object({
    success: z.boolean().nullable().describe('Indicates whether the event update was successful.'),
  })
  .partial()
  .passthrough() satisfies Schema

export const deleteEventInputSchema = z.object({
  eventId: z.string().describe('The ID of the calendar event to delete.'),
}) satisfies Schema

export const deleteEventOutputSchema = z
  .object({
    success: z.boolean().nullable().describe('Indicates whether the event deletion was successful.'),
  })
  .partial()
  .passthrough() satisfies Schema

export const listEventsInputSchema = z.object({
  startDate: z.string().nullable().optional().describe('The start date for listing events (in ISO 8601 format).'),
  endDate: z.string().nullable().optional().describe('The end date for listing events (in ISO 8601 format).'),
}) satisfies Schema

export const listEventsOutputSchema = z
  .array(
    z.object({
      eventId: z.string().nullable().describe('The ID of the calendar event.'),
      event: eventSchema.describe('The calendar event data.'),
    })
  )
  .partial()
  .passthrough() satisfies Schema
