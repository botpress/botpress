import { z } from 'zod'
import * as schemas from '../misc/custom-schemas'

export const listCalendarsInputSchema = z.object({}) satisfies schemas.Schema

export const listCalendarsOutputSchema = z
  .object({
    calendars: z.array(z.any()).optional(),
  })
  .partial()
  .passthrough() satisfies schemas.Schema

// TODO: Implement list calendars action logic here
