import { z } from '@botpress/sdk'

export const docusignEvelopeEventSchema = z.object({
  event: z.union([z.literal('envelope-sent'), z.literal('envelope-completed')]),
  generatedDateTime: z.string().datetime(),
  data: z.object({
    userId: z.string(),
    accountId: z.string(),
    envelopeId: z.string(),
  }),
})
