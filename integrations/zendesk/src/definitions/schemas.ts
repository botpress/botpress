import { z } from '@botpress/sdk'
import { omit } from 'lodash'

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
  externalId: z.string().nullable(),
  comment: z.record(z.any()).optional(),
})

const _zdTicketSchema = ticketSchema.transform((data) => ({
  ...omit(data, ['requesterId', 'assigneeId', 'createdAt', 'updatedAt', 'externalId']),
  created_at: data.createdAt,
  updated_at: data.updatedAt,
  requester_id: data.requesterId,
  assignee_id: data.assigneeId,
  external_id: data.externalId,
}))

export type ZendeskTicket = z.output<typeof _zdTicketSchema>
export type Ticket = z.input<typeof ticketSchema>

export const transformTicket = (ticket: ZendeskTicket): Ticket => {
  return {
    ...omit(ticket, ['requester_id', 'assignee_id', 'created_at', 'updated_at', 'external_id']),
    requesterId: ticket.requester_id,
    assigneeId: ticket.assignee_id,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    externalId: ticket.external_id,
  }
}

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  remotePhotoUrl: z.string().nullable().optional(),
  role: z.enum(['end-user', 'agent', 'admin']),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  externalId: z.string().nullable(),
  userFields: z.record(z.string()).optional(),
})

const _zdUserSchema = userSchema.transform((data) => ({
  ...omit(data, ['createdAt', 'updatedAt', 'externalId', 'userFields', 'remotePhotoUrl']),
  created_at: data.createdAt,
  updated_at: data.updatedAt,
  external_id: data.externalId,
  user_fields: data.userFields,
  remote_photo_url: data.remotePhotoUrl,
}))

export type ZendeskUser = z.output<typeof _zdUserSchema>
export type User = z.input<typeof userSchema>

export const transformUser = (ticket: ZendeskUser): User => {
  return {
    ...omit(ticket, ['external_id', 'user_fields', 'created_at', 'updated_at', 'remote_photo_url']),
    externalId: ticket.external_id,
    userFields: ticket.user_fields,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    remotePhotoUrl: ticket.remote_photo_url,
  }
}

export type ZendeskArticle = {
  id: number
  url: string
  html_url: string
  author_id: number
  comments_disabled: boolean
  draft: boolean
  promoted: boolean
  position: number
  vote_sum: number
  vote_count: number
  section_id: number
  created_at: string
  updated_at: string
  name: string
  title: string
  source_locale: string
  locale: string
  outdated: boolean
  outdated_locales: string[]
  edited_at: string
  user_segment_id: number | null
  permission_group_id: number
  content_tag_ids: number[]
  label_names: string[]
  body: string
}

export type ZendeskWebhook = {
  id: string
  name: string
  status: string
  subscriptions: string[]
  created_at: string
  created_by: string
  endpoint: string
  http_method: string
  request_format: string
}
