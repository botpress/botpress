import Airtable from 'airtable'
import axios, { AxiosInstance } from 'axios'
import { TableFields } from './misc/types'

export class AirtableApi {
  private base: Airtable.Base
  private axiosClient: AxiosInstance
  private baseId: string

  constructor(apiKey: string, baseId: string, endpointUrl?: string) {
    this.baseId = baseId
    this.base = new Airtable({ apiKey, endpointUrl }).base(baseId)
    this.axiosClient = axios.create({
      baseURL: endpointUrl || 'https://api.airtable.com/v0/',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async getTableRecords(tableIdOrName: string) {
    const records = await this.base(tableIdOrName).select().all()
    return records
  }

  async createRecord(tableIdOrName: string, fields: object) {
    const record = await this.base(tableIdOrName).create(fields)
    return record
  }

  async updateRecord(tableIdOrName: string, recordId: string, fields: object) {
    const record = await this.base(tableIdOrName).update(recordId, fields)
    return record
  }

  async createTable(name: string, fields: TableFields, description?: string) {
    const descriptionLimit = 20000
    const validDescription = description?.slice(0, descriptionLimit)
    const payload = {
      name,
      description: validDescription,
      fields,
    }

    const response = await this.axiosClient.post(`/meta/bases/${this.baseId}/tables`, payload)
    return response.data
  }

  async updateTable(tableIdOrName: string, name?: string, description?: string) {
    const response = await this.axiosClient.patch(`/meta/bases/${this.baseId}/tables/${tableIdOrName}`, {
      name,
      description,
    })
    return response.data
  }
}
