import type {
  GetFieldsOutput,
  GetFieldsRequest,
  Model,
  OdooRecord,
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
} from './contact.types'
import type {
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
} from './lead.types'
import type {
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
  OdooRecord as HelpdeskTicketRecord,
} from './ticket.types'

const modelMap: Record<Model, string> = {
  Lead: 'crm.lead',
  Contact: 'res.partner',
  Ticket: 'helpdesk.ticket',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isOdooRecordArray = (value: unknown): value is OdooRecord[] => Array.isArray(value) && value.every(isRecord)

const isHelpdeskTicketRecordArray = (value: unknown): value is HelpdeskTicketRecord[] =>
  Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.id === 'number')

const isRecordMap = (value: unknown): value is Record<string, Record<string, unknown>> =>
  isRecord(value) && Object.values(value).every(isRecord)

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

const readOdooError = (errorMessage: string): string => {
  try {
    const errorBody = JSON.parse(errorMessage) as unknown

    if (isRecord(errorBody)) {
      const name = typeof errorBody.name === 'string' ? errorBody.name : undefined
      const message = typeof errorBody.message === 'string' ? errorBody.message : undefined

      if (name && message) {
        return `${name}: ${message}`
      }

      return message ?? name ?? errorMessage
    }

    return errorMessage
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
    isExpectedResponse: (data: unknown) => data is TResponse,
    expectedResponseDescription: string
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
    if (!isExpectedResponse(data)) {
      throw new Error(`Odoo API request failed: expected ${expectedResponseDescription} response`)
    }

    return data
  }

  public async listFields(model: Model, request: GetFieldsRequest): Promise<GetFieldsOutput> {
    return this._postJson(`/json/2/${modelMap[model]}/fields_get`, request, isRecord, 'JSON object')
  }

  public async listLeadFields(input: CrmLeadFieldsGetInput): Promise<CrmLeadFieldsGetOutput> {
    return this._postJson('/json/2/crm.lead/fields_get', input, isRecordMap, 'JSON object')
  }

  public async listTicketFields(input: HelpdeskTicketFieldsGetInput): Promise<HelpdeskTicketFieldsGetOutput> {
    return this._postJson('/json/2/helpdesk.ticket/fields_get', input, isRecordMap, 'JSON object')
  }

  public async getCurrentUserId(): Promise<number> {
    const context = await this._postJson<ResUsersContextGetOutput>(
      '/json/2/res.users/context_get',
      {},
      (data): data is ResUsersContextGetOutput => isRecord(data) && typeof data.uid === 'number',
      'JSON object with uid'
    )

    return context.uid
  }

  public async searchContacts(input: ResPartnerSearchReadInput): Promise<ResPartnerSearchReadOutput> {
    return this._postJson('/json/2/res.partner/search_read', input, isOdooRecordArray, 'JSON array')
  }

  public async searchLeads(input: CrmLeadSearchReadInput): Promise<CrmLeadSearchReadOutput> {
    return this._postJson('/json/2/crm.lead/search_read', input, isOdooRecordArray, 'JSON array')
  }

  public async searchTickets(input: HelpdeskTicketSearchReadInput): Promise<HelpdeskTicketSearchReadOutput> {
    return this._postJson('/json/2/helpdesk.ticket/search_read', input, isHelpdeskTicketRecordArray, 'JSON array')
  }

  public async listContacts(input: ResPartnerReadInput): Promise<ResPartnerReadOutput> {
    return this._postJson('/json/2/res.partner/read', input, isOdooRecordArray, 'JSON array')
  }

  public async listLeads(input: CrmLeadReadInput): Promise<CrmLeadReadOutput> {
    return this._postJson('/json/2/crm.lead/read', input, isOdooRecordArray, 'JSON array')
  }

  public async listTickets(input: HelpdeskTicketReadInput): Promise<HelpdeskTicketReadOutput> {
    return this._postJson('/json/2/helpdesk.ticket/read', input, isHelpdeskTicketRecordArray, 'JSON array')
  }

  public async createContact(input: ResPartnerCreateInput): Promise<ResPartnerCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson(
      '/json/2/res.partner/create',
      { ...rest, vals_list: [values] },
      isNumberArray,
      'number array'
    )

    if (ids.length !== 1 || ids[0] === undefined) {
      throw new Error('Odoo API request failed: expected one created contact id')
    }

    return ids[0]
  }

  public async createLead(input: CrmLeadCreateInput): Promise<CrmLeadCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson(
      '/json/2/crm.lead/create',
      { ...rest, vals_list: [values] },
      isNumberArray,
      'number array'
    )

    if (ids.length !== 1 || ids[0] === undefined) {
      throw new Error('Odoo API request failed: expected one created lead id')
    }

    return ids[0]
  }

  public async createTicket(input: HelpdeskTicketCreateInput): Promise<HelpdeskTicketCreateOutput> {
    const { values, ...rest } = input
    const ids = await this._postJson(
      '/json/2/helpdesk.ticket/create',
      { ...rest, vals_list: [values] },
      isNumberArray,
      'number array'
    )

    if (ids.length !== 1 || ids[0] === undefined) {
      throw new Error('Odoo API request failed: expected one created ticket id')
    }

    return ids[0]
  }

  public async updateContacts(input: ResPartnerWriteInput): Promise<ResPartnerWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/res.partner/write', { ...rest, vals: values }, isBoolean, 'boolean')
  }

  public async updateLeads(input: CrmLeadWriteInput): Promise<CrmLeadWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/crm.lead/write', { ...rest, vals: values }, isBoolean, 'boolean')
  }

  public async updateTickets(input: HelpdeskTicketWriteInput): Promise<HelpdeskTicketWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/helpdesk.ticket/write', { ...rest, vals: values }, isBoolean, 'boolean')
  }

  public async deleteContacts(input: ResPartnerUnlinkInput): Promise<ResPartnerUnlinkOutput> {
    return this._postJson('/json/2/res.partner/unlink', input, isBoolean, 'boolean')
  }

  public async deleteLeads(input: CrmLeadUnlinkInput): Promise<CrmLeadUnlinkOutput> {
    return this._postJson('/json/2/crm.lead/unlink', input, isBoolean, 'boolean')
  }

  public async deleteTickets(input: HelpdeskTicketUnlinkInput): Promise<HelpdeskTicketUnlinkOutput> {
    return this._postJson('/json/2/helpdesk.ticket/unlink', input, isBoolean, 'boolean')
  }
}

export default OdooClient
