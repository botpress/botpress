import axios, { AxiosInstance } from 'axios'
import { LeadPayload, Lead, SearchLeadsPayload } from '../definitions/schemas'

type LeadPayloadWithOptionalEmail = Omit<LeadPayload, 'email'> & Partial<Pick<LeadPayload, 'email'>>

export class HunterClient {
  private _client: AxiosInstance

  public constructor(apiKey: string) {
    this._client = axios.create({
      baseURL: 'https://api.hunter.io/v2/',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-API-KEY': apiKey,
      },
    })
  }

  public async getLeads(data?: SearchLeadsPayload): Promise<Lead[]> {
    const params = new URLSearchParams()
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(key + '[]', String(v))
          }
        } else if (typeof value === 'object' && value !== null) {
          for (const [k, v] of Object.entries(value)) {
            params.append(`${key}[${k}]`, String(v))
          }
        } else if (value !== undefined) {
          params.append(key, String(value))
        }
      }
    }

    const res = await this._client.get('leads?' + params.toString())
    return res.data.data.leads
  }

  public async retrieveLead(id: number): Promise<Lead> {
    const res = await this._client.get(`leads/${id}`)
    return res.data.data
  }

  public async createLead(data: LeadPayload): Promise<Lead> {
    const res = await this._client.post('leads', data)
    return res.data.data
  }

  public async createOrUpdateLead(data: LeadPayload): Promise<Lead> {
    const res = await this._client.put('leads', data)
    return res.data.data
  }

  public async updateLead(id: number, data: LeadPayloadWithOptionalEmail): Promise<void> {
    await this._client.put(`leads/${id}`, data)
  }

  public async deleteLead(id: number): Promise<void> {
    await this._client.delete(`leads/${id}`)
  }
}
