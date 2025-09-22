import { z } from '@botpress/sdk'

export const envelopeEventOutputSchema = z.object({
  userId: z.string().title('User ID').describe("The Docusign user's ID"),
  accountId: z
    .string()
    .title('API Account ID')
    .describe('The docusign user\'s "API Account ID" (This is a GUID that is found in "Apps & Keys")'),
  envelopeId: z.string().title('Envelope ID').describe('The id of the sent envelope'),
  conversationId: z
    .string()
    .nullable()
    .describe('The conversation ID associated with the event, if available')
    .title('Conversation ID'),
  triggeredAt: z.string().datetime().title('Triggered At').describe('The datetime when the event was triggered'),
})
