import { z } from '@botpress/sdk'
import { ticketEventSchema, replyEventSchema } from '../../definitions/events'
import { freshdeskWebhookTicketSchema, freshdeskWebhookReplySchema } from './schemas'

const STATUS_MAP = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' } as const
const PRIORITY_MAP = { 1: 'low', 2: 'medium', 3: 'high', 4: 'urgent' } as const

type FreshdeskTicket = z.infer<typeof freshdeskWebhookTicketSchema>
type FreshdeskReply = z.infer<typeof freshdeskWebhookReplySchema>
type TicketEvent = z.infer<typeof ticketEventSchema>
type ReplyEvent = z.infer<typeof replyEventSchema>

export const mapTicket = (ticket: FreshdeskTicket): TicketEvent => ({
  id: ticket.id,
  subject: ticket.subject,
  status: ticket.status != null ? (STATUS_MAP[ticket.status as keyof typeof STATUS_MAP] ?? null) : null,
  priority: ticket.priority != null ? (PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP] ?? null) : null,
  requesterId: ticket.requester_id,
  responderId: ticket.responder_id,
  groupId: ticket.group_id,
  type: ticket.type,
  tags: ticket.tags,
})

export const mapReply = (reply: FreshdeskReply): ReplyEvent => ({
  body: reply.body,
  bodyText: reply.body_text,
  customerEmail: reply.customer_email,
})
