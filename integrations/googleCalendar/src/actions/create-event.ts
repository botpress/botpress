// create-event.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const createEventInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar to create the event in.'),
  event: z.any().describe('The event data to create.'),
}) satisfies schemas.Schema;

export const createEventOutputSchema = z
  .object({
    event: z.any().optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your create event action logic here
