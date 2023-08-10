import { z } from 'zod'

export const ticketSchema = z
  .object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
    status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable(),
    requester_id: z.number(),
    assignee_id: z.number().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    tags: z.array(z.string()),
  })
  .transform((data) => ({
    ...data,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    requesterId: z.number(),
    assigneeId: z.number().nullable(),
  }))

export type ZendeskTicket = z.input<typeof ticketSchema>
export type Ticket = z.output<typeof ticketSchema>

export const userSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    photo: z.string().optional(),
    role: z.enum(['end-user', 'agent', 'admin']),
    created_at: z.string(),
    updated_at: z.string(),
    tags: z.array(z.string()),
    external_id: z.string().nullable(),
    user_fields: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    externalId: data.external_id,
    userFields: data.user_fields,
  }))

export type ZendeskUser = z.input<typeof userSchema>
export type User = z.output<typeof userSchema>
