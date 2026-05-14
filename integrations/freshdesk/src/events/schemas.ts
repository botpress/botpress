import { z } from '@botpress/sdk'
import { webhookReplySchema, webhookTicketSchema } from '../../definitions/events'

// Freshdesk sends all template values as strings; coerce numeric fields
const coerceToNumber = (val: unknown): number | null => (val != null && val !== '' ? Number(val) : null)

const freshdeskTicketSchema = z.preprocess(
  (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj
    const t = obj as Record<string, unknown>
    return {
      ...t,
      id: coerceToNumber(t['id']),
      status: coerceToNumber(t['status']),
      priority: coerceToNumber(t['priority']),
      requester_id: coerceToNumber(t['requester_id']),
      responder_id: coerceToNumber(t['responder_id']),
      group_id: coerceToNumber(t['group_id']),
    }
  },
  webhookTicketSchema
)

export const ticketCreatedBodySchema = z.object({ ticket: freshdeskTicketSchema })
export const ticketUpdatedBodySchema = z.object({ ticket: freshdeskTicketSchema })
export const ticketRepliedBodySchema = z.object({ ticket: freshdeskTicketSchema, reply: webhookReplySchema })
