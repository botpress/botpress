import type { OdooContext, OdooDomain, OdooRecord } from './odoo.types'

/**
 * POST /json/2/crm.lead/fields_get
 */
export type CrmLeadFieldsGetInput = {
  allfields?: string[]
  attributes?: string[]
  context?: OdooContext
}

export type CrmLeadFieldMetadata = Record<string, unknown>

export type CrmLeadFieldsGetOutput = Record<string, CrmLeadFieldMetadata>

/**
 * POST /json/2/crm.lead/search_read
 */
export type CrmLeadSearchReadInput = {
  domain?: OdooDomain
  fields?: string[]
  offset?: number
  limit?: number
  order?: string
  context?: OdooContext
}

export type CrmLeadSearchReadOutput = OdooRecord[]

/**
 * POST /json/2/crm.lead/read
 */
export type CrmLeadReadInput = {
  ids: number[]
  fields?: string[]
  context?: OdooContext
}

export type CrmLeadReadOutput = OdooRecord[]

/**
 * POST /json/2/crm.lead/create
 */
export type CrmLeadCreateInput = {
  values: {
    name: string
    email_from?: string
    phone?: string
    mobile?: string
    contact_name?: string
    partner_name?: string
    partner_id?: number
    stage_id?: number
    user_id?: number
    team_id?: number
    type?: 'lead' | 'opportunity'
    probability?: number
    expected_revenue?: number
    description?: string
    referred?: string
    source_id?: number
    medium_id?: number
    campaign_id?: number
    [field: string]: unknown
  }
  context?: OdooContext
}

export type CrmLeadCreateOutput = number

/**
 * POST /json/2/crm.lead/write
 */
export type CrmLeadWriteInput = {
  ids: number[]
  values: Partial<CrmLeadCreateInput['values']>
  context?: OdooContext
}

export type CrmLeadWriteOutput = boolean

/**
 * POST /json/2/crm.lead/unlink
 */
export type CrmLeadUnlinkInput = {
  ids: number[]
  context?: OdooContext
}

export type CrmLeadUnlinkOutput = boolean
