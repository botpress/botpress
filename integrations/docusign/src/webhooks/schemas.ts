import { z } from '@botpress/sdk'

export const docusignEvelopeEventSchema = z.object({
  event: z.union([
    z.literal('envelope-sent'),
    z.literal('envelope-resent'),
    z.literal('envelope-delivered'),
    z.literal('envelope-completed'),
    z.literal('envelope-declined'),
    z.literal('envelope-voided'),
  ]),
  generatedDateTime: z.string().datetime(),
  data: z.object({
    userId: z.string(),
    accountId: z.string(),
    envelopeId: z.string(),
  }),
})
