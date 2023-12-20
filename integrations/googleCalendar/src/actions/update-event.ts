// update-event.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const updateEventInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar where the event to update is located.'),
  eventId: z.string().describe('The ID of the event to update.'),
  eventData: z.any().describe('The updated event data.'),
}) satisfies schemas.Schema;

export const updateEventOutputSchema = z
  .object({
    updatedEvent: z.any().optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your update event action logic here
