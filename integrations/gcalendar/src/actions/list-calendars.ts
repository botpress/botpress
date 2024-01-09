// list-calendars.ts
import { z } from 'zod';
import * as schemas from './custom-schemas';

export const listCalendarsInputSchema = z.object({}) satisfies schemas.Schema;

export const listCalendarsOutputSchema = z
  .object({
    calendars: z.array(z.any()).optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema;

// Implement your list calendars action logic here
