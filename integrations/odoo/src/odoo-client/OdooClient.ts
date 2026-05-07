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
} from './types'

const modelMap: Record<Model, string> = {
  Lead: 'crm.lead',
  Contact: 'res.partner',
  Ticket: 'helpdesk.ticket',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isOdooRecordArray = (value: unknown): value is OdooRecord[] => Array.isArray(value) && value.every(isRecord)

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

  public async getFields(model: Model, request: GetFieldsRequest): Promise<GetFieldsOutput> {
    return this._postJson(`/json/2/${modelMap[model]}/fields_get`, request, isRecord, 'JSON object')
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

  public async getContacts(input: ResPartnerReadInput): Promise<ResPartnerReadOutput> {
    return this._postJson('/json/2/res.partner/read', input, isOdooRecordArray, 'JSON array')
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

  public async updateContacts(input: ResPartnerWriteInput): Promise<ResPartnerWriteOutput> {
    const { values, ...rest } = input

    return this._postJson('/json/2/res.partner/write', { ...rest, vals: values }, isBoolean, 'boolean')
  }

  public async deleteContacts(input: ResPartnerUnlinkInput): Promise<ResPartnerUnlinkOutput> {
    return this._postJson('/json/2/res.partner/unlink', input, isBoolean, 'boolean')
  }
}

export default OdooClient
