type Model = 'Lead' | 'Contact' | 'Ticket'

const modelMap: Record<Model, string> = {
  Lead: 'crm.lead',
  Contact: 'res.partner',
  Ticket: 'helpdesk.ticket',
}

type GetFieldsRequest = {
  allfields?: string[]
  attributes?: string[]
  context?: Record<string, unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

  async getFields(model: Model, request: GetFieldsRequest): Promise<Record<string, unknown>> {
    const endpoint = `/json/2/${modelMap[model]}/fields_get`
    const headers = this.getHeaders()
    const body = request

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
    if (!isRecord(data)) {
      throw new Error('Odoo API request failed: expected a JSON object response')
    }

    return data
  }
}

export default OdooAPI
