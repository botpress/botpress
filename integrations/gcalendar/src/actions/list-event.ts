// list-event.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const listEventsInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar to list events from.'),
}) satisfies schemas.Schema;

export const listEventsOutputSchema = z
  .object({
    events: z.array(z.any()).optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your list events action logic here
