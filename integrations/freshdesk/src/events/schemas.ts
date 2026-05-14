import { z } from '@botpress/sdk'

// Freshdesk sends all template values as strings; coerce numeric fields
const coerceToNumber = (val: unknown): number | null => (val != null && val !== '' ? Number(val) : null)

const incomingTicketSchema = z.object({
  id: z.preprocess(coerceToNumber, z.number()),
  subject: z.string().nullish(),
  status: z.preprocess(coerceToNumber, z.number().nullable()),
  priority: z.preprocess(coerceToNumber, z.number().nullable()),
  requester_id: z.preprocess(coerceToNumber, z.number().nullable()),
  responder_id: z.preprocess(coerceToNumber, z.number().nullable()),
  group_id: z.preprocess(coerceToNumber, z.number().nullable()),
  type: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
})

export const ticketCreatedBodySchema = z.object({ ticket: incomingTicketSchema })
export const ticketUpdatedBodySchema = z.object({ ticket: incomingTicketSchema })
export const ticketRepliedBodySchema = z.object({
  ticket: incomingTicketSchema,
  reply: z.object({
    body: z.string(),
    body_text: z.string().optional(),
    customer_email: z.string().optional(),
  }),
})
