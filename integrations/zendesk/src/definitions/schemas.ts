import { z } from '@botpress/sdk'
import { omit } from 'lodash'

const requesterSchema = z.object({
  name: z.string().optional().title('Name').describe('Requester name'),
  email: z.string().optional().title('Email').describe('Requester email'),
})

export const ticketSchema = z.object({
  id: z.number().title('ID').describe('Ticket ID'),
  subject: z.string().title('Subject').describe('Ticket subject'),
  description: z.string().title('Description').describe('Ticket description'),
  status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']).title('Status').describe('Ticket status'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable().title('Priority').describe('Ticket priority'),
  requesterId: z.number().title('Requester ID').describe('ID of the requester'),
  requester: requesterSchema.optional().title('Requester').describe('Requester information'),
  assigneeId: z.number().nullable().title('Assignee ID').describe('ID of the assignee'),
  createdAt: z.string().title('Created At').describe('Ticket creation date'),
  updatedAt: z.string().title('Updated At').describe('Ticket last update date'),
  tags: z.array(z.string()).title('Tags').describe('Ticket tags'),
  externalId: z.string().nullable().title('External ID').describe('External ticket ID'),
  comment: z.record(z.any()).optional().title('Comment').describe('Ticket comment'),
  via: z
    .object({ channel: z.string().optional().title('Channel').describe('Channel name') })
    .optional()
    .title('Via')
    .describe('How the ticket was created'),
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
  id: z.number().title('ID').describe('User ID'),
  name: z.string().title('Name').describe('User name'),
  email: z.string().title('Email').describe('User email'),
  phone: z.string().nullable().optional().title('Phone').describe('User phone number'),
  photo: z.string().nullable().optional().title('Photo').describe('User photo URL'),
  remotePhotoUrl: z.string().nullable().optional().title('Remote Photo URL').describe('Remote photo URL'),
  role: z.enum(['end-user', 'agent', 'admin']).title('Role').describe('User role'),
  tags: z.array(z.string()).title('Tags').describe('User tags'),
  createdAt: z.string().title('Created At').describe('User creation date'),
  updatedAt: z.string().title('Updated At').describe('User last update date'),
  externalId: z.string().nullable().title('External ID').describe('External user ID'),
  userFields: z.record(z.string()).optional().title('User Fields').describe('Custom user fields'),
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
