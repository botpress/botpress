export type FreshdeskTicket = {
  id: number
  subject: string
  description?: string
  description_text?: string
  status: number
  priority: number
  source?: number
  email?: string
  name?: string
  requester_id?: number
  responder_id?: number
  group_id?: number
  type?: string
  tags?: string[]
  cc_emails?: string[]
  due_by?: string
  created_at: string
  updated_at: string
  custom_fields?: Record<string, unknown>
}

export type CreateTicketInput = {
  subject: string
  description?: string
  email?: string
  phone?: string
  twitter_id?: string
  facebook_id?: string
  unique_external_id?: string
  requester_id?: number
  priority?: number
  status?: number
  type?: string
  tags?: string[]
  group_id?: number
  responder_id?: number
  cc_emails?: string[]
  custom_fields?: Record<string, unknown>
}

export type GetTicketInput = {
  id: number
  include?: string
}

export type ListTicketsInput = {
  filter?: string
  order_by?: string
  order_type?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export type UpdateTicketInput = {
  id: number
  subject?: string
  description?: string
  email?: string
  phone?: string
  twitter_id?: string
  facebook_id?: string
  unique_external_id?: string
  requester_id?: number
  priority?: number
  status?: number
  type?: string
  tags?: string[]
  group_id?: number
  responder_id?: number
  cc_emails?: string[]
  custom_fields?: Record<string, unknown>
}

export type DeleteTicketInput = {
  id: number
}

export type SearchTicketsInput = {
  query: string
  page?: number
}

export type SearchTicketsOutput = {
  results: FreshdeskTicket[]
  total?: number
}

export type FreshdeskConversation = {
  id: number
  body: string
  body_text?: string
  created_at: string
  updated_at: string
  ticket_id: number
  user_id: number
}

export type AddNoteInput = {
  body: string
  private?: boolean
}

export type FreshdeskContact = {
  id: number
  name: string
  email?: string
  phone?: string
  mobile?: string
  company_id?: number
  tags?: string[]
  created_at: string
}
