import { z } from '@botpress/sdk'

export const envelopeEventSchema = z.object({
  userId: z.string().title('User ID').describe("The Docusign user's ID"),
  accountId: z
    .string()
    .title('API Account ID')
    .describe('The docusign user\'s "API Account ID" (This is a GUID that is found in "Apps & Keys")'),
  envelopeId: z.string().title('Envelope ID').describe('The id of the sent envelope'),
  triggeredAt: z.string().datetime().title('Triggered At').describe('The datetime when the event was triggered'),
})
