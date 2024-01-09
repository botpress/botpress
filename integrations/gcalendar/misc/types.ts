import z from 'zod'
import { actions } from './actions'

export { actions }

export const configuration = {
  schema: z.object({
    calendarId: z
      .string()
      .describe('The ID of the Google Calendar to interact with. You can find it in your Google Calendar settings.'),
    privateKey: z
      .string()
      .describe('The private key from the Google service account. You can get it from the downloaded JSON file.'),
    clientEmail: z
      .string()
      .email()
      .describe('The client email from the Google service account. You can get it from the downloaded JSON file.'),
  }),
}
