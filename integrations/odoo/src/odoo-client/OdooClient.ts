import { z } from '@botpress/sdk'
import type {
  GetFieldsOutput,
  GetFieldsRequest,
  Model,
  ResPartnerCreateInput,
  ResPartnerCreateOutput,
  ResPartnerReadInput,
  ResPartnerReadOutput,
  ResPartnerSearchReadInput,
  ResPartnerSearchReadOutput,
  ResPartnerUnlinkInput,
  ResPartnerUnlinkOutput,
  ResPartnerWriteInput,
  ResPartnerWriteOutput,
  ResUsersContextGetOutput,
  CrmLeadCreateInput,
  CrmLeadCreateOutput,
  CrmLeadFieldsGetInput,
  CrmLeadFieldsGetOutput,
  CrmLeadReadInput,
  CrmLeadReadOutput,
  CrmLeadSearchReadInput,
  CrmLeadSearchReadOutput,
  CrmLeadUnlinkInput,
  CrmLeadUnlinkOutput,
  CrmLeadWriteInput,
  CrmLeadWriteOutput,
  HelpdeskTicketCreateInput,
  HelpdeskTicketCreateOutput,
  HelpdeskTicketFieldsGetInput,
  HelpdeskTicketFieldsGetOutput,
  HelpdeskTicketReadInput,
  HelpdeskTicketReadOutput,
  HelpdeskTicketSearchReadInput,
  HelpdeskTicketSearchReadOutput,
  HelpdeskTicketUnlinkInput,
  HelpdeskTicketUnlinkOutput,
  HelpdeskTicketWriteInput,
  HelpdeskTicketWriteOutput,
} from './types'

const modelMap: Record<Model, string> = {
  Lead: 'crm.lead',
  Contact: 'res.partner',
  Ticket: 'helpdesk.ticket',
}
const recordSchema = z.record(z.string(), z.unknown()).and(z.object({ id: z.number().optional() }))

const odooRecordArraySchema = z.array(recordSchema)

const helpdeskTicketRecordSchema = recordSchema.and(z.object({ id: z.number() }))
const helpdeskTicketRecordArraySchema = z.array(helpdeskTicketRecordSchema)

const recordMapSchema = z.record(z.string(), recordSchema)

const createdIdSchema = z.tuple([z.number()])

const booleanSchema = z.boolean()
const resUsersContextGetOutputSchema = recordSchema.and(z.object({ uid: z.number() }))

const odooErrorSchema = recordSchema.and(z.object({ name: z.string().optional(), message: z.string().optional() }))

const readOdooError = (errorMessage: string): string => {
  try {
    const errorBody = JSON.parse(errorMessage) as unknown
    const result = odooErrorSchema.safeParse(errorBody)

    if (!result.success) {
      return errorMessage
    }

    const { name, message } = result.data

    if (name && message) {
      return `${name}: ${message}`
    }

    return message ?? name ?? errorMessage
  } catch {
    return errorMessage
  }
}

export class OdooClient {
  private _url: string
  private _apiKey: string
  private _database: string

  public constructor(url: string, apiKey: string, database: string) {
    this._url = url.replace(/\/$/, '')
    this._apiKey = apiKey
    this._database = database
  }

  private _getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._apiKey}`,
      'X-ODOO-DATABASE': this._database,
    }
  }

  private async _postJson<TResponse>(
    endpoint: string,
    body: object,
    responseSchema: z.ZodType<TResponse>
  ): Promise<TResponse> {
    const headers = this._getHeaders()

    const response = await fetch(`${this._url}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorMessage = await response.text()
      const details = errorMessage ? ` - ${readOdooError(errorMessage)}` : ''

      throw new Error(`Odoo API request failed with status ${response.status} ${response.statusText}${details}`)
    }

    const data = (await response.json()) as unknown
    const parse = responseSchema.safeParse(data)
    if (!parse.success) {
      throw new Error(`Odoo API request failed: expected ${parse.error.message} response`)
    }

    return parse.data
  }

  public async listFields(model: Model, request: GetFieldsRequest): Promise<GetFieldsOutput> {
    return this._postJson(`/json/2/${modelMap[model]}/fields_get`, request, recordSchema)
  }

  public async listLeadFields(input: CrmLeadFieldsGetInput): Promise<CrmLeadFieldsGetOutput> {
    return this._postJson('/json/2/crm.lead/fields_get', input, recordMapSchema)
  }

  public async listTicketFields(input: HelpdeskTicketFieldsGetInput): Promise<HelpdeskTicketFieldsGetOutput> {
    return this._postJson('/json/2/helpdesk.ticket/fields_get', input, recordMapSchema)
  }

  public async getCurrentUserId(): Promise<number> {
    const context = await this._postJson<ResUsersContextGetOutput>(
      '/json/2/res.users/context_get',
      {},
      resUsersContextGetOutputSchema
    )

    return context.uid
  }

  public async searchContacts(input: ResPartnerSearchReadInput): Promise<ResPartnerSearchReadOutput> {
    return this._postJson('/json/2/res.partner/search_read', input, odooRecordArraySchema)
  }

  public async searchLeads(input: CrmLeadSearchReadInput): Promise<CrmLeadSearchReadOutput> {
    return this._postJson('/json/2/crm.lead/search_read', input, odooRecordArraySchema)
  }

  public async searchTickets(input: HelpdeskTicketSearchReadInput): Promise<HelpdeskTicketSearchReadOutput> {
    return this._postJson('/json/2/helpdesk.ticket/search_read', input, helpdeskTicketRecordArraySchema)
  }

  public async listContacts(input: ResPartnerReadInput): Promise<ResPartnerReadOutput> {
    return this._postJson('/json/2/res.partner/read', input, odooRecordArraySchema)
  }

  public async listLeads(input: CrmLeadReadInput): Promise<CrmLeadReadOutput> {
    return this._postJson('/json/2/crm.lead/read', input, odooRecordArraySchema)
  }

  public async listTickets(input: HelpdeskTicketReadInput): Promise<HelpdeskTicketReadOutput> {
    return this._postJson('/json/2/helpdesk.ticket/read', input, helpdeskTicketRecordArraySchema)
  }

  public async createContact(input: ResPartnerCreateInput): Promise<ResPartnerCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson('/json/2/res.partner/create', { ...rest, vals_list: [values] }, createdIdSchema)
    return ids[0]
  }

  public async createLead(input: CrmLeadCreateInput): Promise<CrmLeadCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson('/json/2/crm.lead/create', { ...rest, vals_list: [values] }, createdIdSchema)

    return ids[0]
  }

  public async createTicket(input: HelpdeskTicketCreateInput): Promise<HelpdeskTicketCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson(
      '/json/2/helpdesk.ticket/create',
      { ...rest, vals_list: [values] },
      createdIdSchema
    )

    return ids[0]
  }

  public async updateContacts(input: ResPartnerWriteInput): Promise<ResPartnerWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/res.partner/write', { ...rest, vals: values }, booleanSchema)
  }

  public async updateLeads(input: CrmLeadWriteInput): Promise<CrmLeadWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/crm.lead/write', { ...rest, vals: values }, booleanSchema)
  }

  public async updateTickets(input: HelpdeskTicketWriteInput): Promise<HelpdeskTicketWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/helpdesk.ticket/write', { ...rest, vals: values }, booleanSchema)
  }

  public async deleteContacts(input: ResPartnerUnlinkInput): Promise<ResPartnerUnlinkOutput> {
    return this._postJson('/json/2/res.partner/unlink', input, booleanSchema)
  }

  public async deleteLeads(input: CrmLeadUnlinkInput): Promise<CrmLeadUnlinkOutput> {
    return this._postJson('/json/2/crm.lead/unlink', input, booleanSchema)
  }

  public async deleteTickets(input: HelpdeskTicketUnlinkInput): Promise<HelpdeskTicketUnlinkOutput> {
    return this._postJson('/json/2/helpdesk.ticket/unlink', input, booleanSchema)
  }
}

export default OdooClient
