import { omit } from 'lodash'
import { z } from 'zod'

export const ticketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  description: z.string(),
  status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable(),
  requesterId: z.number(),
  assigneeId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
})

const zdTicketSchema = ticketSchema.transform((data) => ({
  ...omit(data, ['requesterId', 'assigneeId', 'createdAt', 'updatedAt']),
  created_at: data.createdAt,
  updated_at: data.updatedAt,
  requester_id: data.requesterId,
  assignee_id: data.assigneeId,
}))

export type ZendeskTicket = z.output<typeof zdTicketSchema>
export type Ticket = z.input<typeof ticketSchema>

export const transformTicket = (ticket: ZendeskTicket): Ticket => {
  return {
    ...omit(ticket, ['requester_id', 'assignee_id', 'created_at', 'updated_at']),
    requesterId: ticket.requester_id,
    assigneeId: ticket.assignee_id,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }
}

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  role: z.enum(['end-user', 'agent', 'admin']),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  externalId: z.string().nullable(),
  userFields: z.record(z.string()).optional(),
})

const zdUserSchema = userSchema.transform((data) => ({
  ...omit(data, ['createdAt', 'updatedAt', 'externalId', 'userFields']),
  created_at: data.createdAt,
  updated_at: data.updatedAt,
  external_id: data.externalId,
  user_fields: data.userFields,
}))

export type ZendeskUser = z.output<typeof zdUserSchema>
export type User = z.input<typeof userSchema>

export const transformUser = (ticket: ZendeskUser): User => {
  return {
    ...omit(ticket, ['external_id', 'user_fields', 'created_at', 'updated_at']),
    externalId: ticket.external_id,
    userFields: ticket.user_fields,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }
}
