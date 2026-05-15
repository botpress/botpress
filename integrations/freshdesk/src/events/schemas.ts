import { z } from '@botpress/sdk'
import { webhookReplySchema, webhookTicketSchema } from '../../definitions/events'

// Freshdesk sends all template values as strings; coerce numeric fields
const freshdeskTicketSchema = webhookTicketSchema.extend({
  id: z.coerce.number(),
  status: z.coerce.number().nullish(),
  priority: z.coerce.number().nullish(),
  requester_id: z.coerce.number().nullish(),
  responder_id: z.coerce.number().nullish(),
  group_id: z.coerce.number().nullish(),
})

export const ticketCreatedBodySchema = z.object({ ticket: freshdeskTicketSchema })
export const ticketUpdatedBodySchema = z.object({ ticket: freshdeskTicketSchema })
export const ticketRepliedBodySchema = z.object({ ticket: freshdeskTicketSchema, reply: webhookReplySchema })
