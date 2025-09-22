import { z } from '@botpress/sdk'

const _ignoredEnvelopeEventsSchema = z
  .object({
    // Add more as necessary
    event: z.literal('envelope-delivered'), // The delivered event is ignored since it's trigger is misleading
  })
  .strip()

const _customTextFieldSchema = z
  .object({
    name: z.string(),
    value: z.string(),
  })
  .strip()

const _envelopeEventSchema = z
  .object({
    event: z.union([
      z.literal('envelope-sent'),
      z.literal('envelope-resent'),
      z.literal('envelope-completed'),
      z.literal('envelope-declined'),
      z.literal('envelope-voided'),
    ]),
    generatedDateTime: z.coerce.date(),
    data: z
      .object({
        userId: z.string(),
        accountId: z.string(),
        envelopeId: z.string(),
        envelopeSummary: z
          .object({
            customFields: z
              .object({
                textCustomFields: z.array(_customTextFieldSchema),
              })
              .strip(),
          })
          .strip(),
      })
      .strip(),
  })
  .strip()
export type EnvelopeEvent = z.infer<typeof _envelopeEventSchema>

export const allEnvelopeEventsSchema = z.union([_envelopeEventSchema, _ignoredEnvelopeEventsSchema])
export type AllEnvelopeEvents = z.infer<typeof allEnvelopeEventsSchema>
