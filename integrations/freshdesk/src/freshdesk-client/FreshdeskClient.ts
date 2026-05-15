import * as sdk from '@botpress/sdk'
import type {
  AddNoteInput,
  CreateTicketInput,
  DeleteTicketInput,
  FreshdeskContact,
  FreshdeskConversation,
  FreshdeskTicket,
  GetTicketInput,
  ListTicketsInput,
  SearchTicketsInput,
  SearchTicketsOutput,
  UpdateTicketInput,
} from './types'

const REQUESTER_FIELDS = ['email', 'phone', 'twitter_id', 'facebook_id', 'unique_external_id', 'requester_id'] as const

export class FreshdeskClient {
  private _baseUrl: string
  private _authHeader: string

  public constructor(domain: string, apiKey: string) {
    this._baseUrl = `https://${domain}.freshdesk.com/api/v2`
    this._authHeader = `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`
  }

  private _getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: this._authHeader,
    }
  }

  private async _request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | undefined>,
    body?: object
  ): Promise<T> {
    let url = `${this._baseUrl}${path}`

    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== '') {
          searchParams.set(key, String(value))
        }
      }
      const qs = searchParams.toString()
      if (qs) {
        url = `${url}?${qs}`
      }
    }

    const response = await fetch(url, {
      method,
      headers: this._getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      let detail = text
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>
        if (typeof parsed['description'] === 'string') {
          detail = parsed['description']
        }
        if (Array.isArray(parsed['errors']) && parsed['errors'].length > 0) {
          detail += ` | errors: ${JSON.stringify(parsed['errors'])}`
        }
      } catch {
        // use raw text
      }
      if (response.status === 429) {
        throw new sdk.RuntimeError(`Freshdesk rate limit reached. ${detail}`)
      }
      throw new sdk.RuntimeError(`Freshdesk API error ${response.status}: ${detail}`)
    }

    return response.json() as Promise<T>
  }

  private async _delete(path: string): Promise<void> {
    const url = `${this._baseUrl}${path}`
    const response = await fetch(url, { method: 'DELETE', headers: this._getHeaders() })

    if (!response.ok) {
      const text = await response.text()
      throw new sdk.RuntimeError(`Freshdesk API error ${response.status}: ${text}`)
    }
  }

  public async validateCredentials(): Promise<void> {
    await this._request('GET', '/tickets', { per_page: 1 })
  }

  public async createTicket(input: CreateTicketInput): Promise<FreshdeskTicket> {
    const hasRequester = REQUESTER_FIELDS.some((f) => (input as Record<string, unknown>)[f] != null)
    if (!hasRequester) {
      throw new sdk.RuntimeError(
        'At least one requester field must be provided: email, phone, twitter_id, facebook_id, unique_external_id, or requester_id.'
      )
    }
    const body = {
      status: 2,
      priority: 1,
      ...Object.fromEntries(Object.entries(input).filter(([, v]) => v != null && v !== '')),
    }
    return this._request<FreshdeskTicket>('POST', '/tickets', undefined, body)
  }

  public async getTicket(input: GetTicketInput): Promise<FreshdeskTicket> {
    const params = input.include ? { include: input.include } : undefined
    return this._request<FreshdeskTicket>('GET', `/tickets/${input.id}`, params)
  }

  public async listTickets(input: ListTicketsInput): Promise<FreshdeskTicket[]> {
    const { filter, order_by, order_type, page, per_page } = input
    return this._request<FreshdeskTicket[]>('GET', '/tickets', { filter, order_by, order_type, page, per_page })
  }

  public async updateTicket(input: UpdateTicketInput): Promise<FreshdeskTicket> {
    const { id, ...rest } = input
    const body = Object.fromEntries(Object.entries(rest).filter(([, v]) => v != null && v !== ''))
    return this._request<FreshdeskTicket>('PUT', `/tickets/${id}`, undefined, body)
  }

  public async deleteTicket(input: DeleteTicketInput): Promise<void> {
    await this._delete(`/tickets/${input.id}`)
  }

  public async searchTickets(input: SearchTicketsInput): Promise<SearchTicketsOutput> {
    const query = input.query.startsWith('"') ? input.query : `"${input.query}"`
    const params: Record<string, string | number | undefined> = { query, page: input.page }
    return this._request<SearchTicketsOutput>('GET', '/search/tickets', params)
  }

  public async addNote(ticketId: number, input: AddNoteInput): Promise<FreshdeskConversation> {
    return this._request<FreshdeskConversation>('POST', `/tickets/${ticketId}/notes`, undefined, {
      private: true,
      ...input,
    })
  }

  public async getContact(id: number): Promise<FreshdeskContact> {
    return this._request<FreshdeskContact>('GET', `/contacts/${id}`)
  }

  public async searchContactsByEmail(email: string, page?: number): Promise<FreshdeskContact[]> {
    return this._request<FreshdeskContact[]>('GET', '/contacts', { email, page })
  }

  public async searchContactsByName(term: string): Promise<Array<{ id: number; name: string }>> {
    return this._request<Array<{ id: number; name: string }>>('GET', '/contacts/autocomplete', { term })
  }
}
