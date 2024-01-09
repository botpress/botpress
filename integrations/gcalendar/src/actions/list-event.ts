// list-event.ts
import { z } from 'zod'
import * as schemas from '../misc/custom-schemas'

export const listEventsInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar to list events from.'),
}) satisfies schemas.Schema

export const listEventsOutputSchema = z
  .object({
    events: z.array(z.any()).optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema

// TODO: Implement list events action logic here
