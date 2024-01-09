// delete-event.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const deleteEventInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar to delete the event from.'),
  eventId: z.string().describe('The ID of the event to delete.'),
}) satisfies schemas.Schema;

export const deleteEventOutputSchema = z
  .object({
    success: z.boolean().optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your delete event action logic here
