// get-calendar.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const getCalendarInputSchema = z.object({
  calendarId: z.string().describe('The ID of the calendar to retrieve.'),
}) satisfies schemas.Schema;

export const getCalendarOutputSchema = z
  .object({
    calendar: z.any().optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your get calendar action logic here
