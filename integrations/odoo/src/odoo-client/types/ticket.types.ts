import type { OdooContext, OdooDomain, OdooRecord } from './odoo.types'

export type HelpdeskTicketRecord = OdooRecord & { id: number }

/**
 * POST /json/2/helpdesk.ticket/fields_get
 */
export type HelpdeskTicketFieldsGetInput = {
  allfields?: string[]
  attributes?: string[]
  context?: OdooContext
}

export type HelpdeskTicketFieldsGetOutput = Record<string, Record<string, unknown>>

/**
 * POST /json/2/helpdesk.ticket/search_read
 */
export type HelpdeskTicketSearchReadInput = {
  domain?: OdooDomain
  fields?: string[]
  offset?: number
  limit?: number
  order?: string
  context?: OdooContext
}

export type HelpdeskTicketSearchReadOutput = HelpdeskTicketRecord[]

/**
 * POST /json/2/helpdesk.ticket/read
 */
export type HelpdeskTicketReadInput = {
  ids: number[]
  fields?: string[]
  context?: OdooContext
}

export type HelpdeskTicketReadOutput = HelpdeskTicketRecord[]

/**
 * POST /json/2/helpdesk.ticket/create
 */
export type HelpdeskTicketCreateInput = {
  values: {
    name: string
    description?: string
    partner_id?: number
    partner_name?: string
    partner_email?: string
    email_cc?: string
    team_id?: number
    user_id?: number
    stage_id?: number
    ticket_type_id?: number
    priority?: '0' | '1' | '2' | '3'
    tag_ids?: number[]
    company_id?: number
    [field: string]: unknown
  }
  context?: OdooContext
}

export type HelpdeskTicketCreateOutput = number

/**
 * POST /json/2/helpdesk.ticket/write
 */
export type HelpdeskTicketWriteInput = {
  ids: number[]
  values: Record<string, unknown>
  context?: OdooContext
}

export type HelpdeskTicketWriteOutput = boolean

/**
 * POST /json/2/helpdesk.ticket/unlink
 */
export type HelpdeskTicketUnlinkInput = {
  ids: number[]
  context?: OdooContext
}

export type HelpdeskTicketUnlinkOutput = boolean
