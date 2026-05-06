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
} from './types'

const modelMap: Record<Model, string> = {
  Lead: 'crm.lead',
  Contact: 'res.partner',
  Ticket: 'helpdesk.ticket',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isOdooRecordArray = (value: unknown): value is OdooRecord[] => Array.isArray(value) && value.every(isRecord)

const isNumber = (value: unknown): value is number => typeof value === 'number'

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

export class OdooAPI {
  private url: string
  private apiKey: string
  private database: string

  constructor(url: string, apiKey: string, database: string) {
    this.url = url.replace(/\/$/, '')
    this.apiKey = apiKey
    this.database = database
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `bearer ${this.apiKey}`,
      'X-ODOO-DATABASE': this.database,
    }
  }

  private async postJson<TResponse>(
    endpoint: string,
    body: object,
    isExpectedResponse: (data: unknown) => data is TResponse,
    expectedResponseDescription: string
  ): Promise<TResponse> {
    const headers = this.getHeaders()

    const response = await fetch(`${this.url}${endpoint}`, {
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

  async getFields(model: Model, request: GetFieldsRequest): Promise<GetFieldsOutput> {
    return this.postJson(`/json/2/${modelMap[model]}/fields_get`, request, isRecord, 'JSON object')
  }

  async searchContacts(input: ResPartnerSearchReadInput): Promise<ResPartnerSearchReadOutput> {
    return this.postJson('/json/2/res.partner/search_read', input, isOdooRecordArray, 'JSON array')
  }

  async getContacts(input: ResPartnerReadInput): Promise<ResPartnerReadOutput> {
    return this.postJson('/json/2/res.partner/read', input, isOdooRecordArray, 'JSON array')
  }

  async createContact(input: ResPartnerCreateInput): Promise<ResPartnerCreateOutput> {
    const { values, ...rest } = input
    const ids = await this.postJson('/json/2/res.partner/create', { ...rest, vals_list: values }, isNumberArray, 'number array')

    if (ids.length !== 1 || ids[0] === undefined) {
      throw new Error('Odoo API request failed: expected one created contact id')
    }

    return ids[0]
  }

  async updateContacts(input: ResPartnerWriteInput): Promise<ResPartnerWriteOutput> {
    const { values, ...rest } = input

    return this.postJson('/json/2/res.partner/write', { ...rest, vals: values }, isBoolean, 'boolean')
  }

  async deleteContacts(input: ResPartnerUnlinkInput): Promise<ResPartnerUnlinkOutput> {
    return this.postJson('/json/2/res.partner/unlink', input, isBoolean, 'boolean')
  }
}

export default OdooAPI
