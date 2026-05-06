export type Model = 'Lead' | 'Contact' | 'Ticket'

export type OdooContext = Record<string, unknown>

export type OdooDomainCondition = unknown[]
export type OdooDomainOperator = '&' | '|' | '!'
export type OdooDomain = Array<OdooDomainCondition | OdooDomainOperator>

export type OdooRecord = Record<string, unknown> & {
  id?: number
}

export type GetFieldsRequest = {
  allfields?: string[]
  attributes?: string[]
  context?: OdooContext
}

export type GetFieldsOutput = Record<string, unknown>

/**
 * POST /json/2/res.users/context_get
 */
export type ResUsersContextGetOutput = OdooContext & {
  uid: number
}

/**
 * POST /json/2/res.partner/search_read
 */
export type ResPartnerSearchReadInput = {
  domain?: OdooDomain
  fields?: string[]
  offset?: number
  limit?: number
  order?: string
  context?: OdooContext
}

export type ResPartnerSearchReadOutput = OdooRecord[]

/**
 * POST /json/2/res.partner/read
 */
export type ResPartnerReadInput = {
  ids: number[]
  fields?: string[]
  context?: OdooContext
}

export type ResPartnerReadOutput = OdooRecord[]

/**
 * POST /json/2/res.partner/create
 */
export type ResPartnerCreateInput = {
  values: Record<string, unknown>
  context?: OdooContext
}

export type ResPartnerCreateOutput = number

/**
 * POST /json/2/res.partner/write
 */
export type ResPartnerWriteInput = {
  ids: number[]
  values: Record<string, unknown>
  context?: OdooContext
}

export type ResPartnerWriteOutput = boolean

/**
 * POST /json/2/res.partner/unlink
 */
export type ResPartnerUnlinkInput = {
  ids: number[]
  context?: OdooContext
}

export type ResPartnerUnlinkOutput = boolean
