import Airtable, { type FieldSet, type Records } from 'airtable'
import axios, { AxiosInstance } from 'axios'
import { stringify } from 'querystring'
import { TableFields } from './misc/types'

type TableResponse = {
  id: string
  name: string
  description?: string
  fields: Array<{ name: string; type: string }>
  primaryFieldId: string
  views: Array<{ id: string; name: string; type: string }>
}

type RecordResponse = {
  id: string
  fields: FieldSet
}

export class AirtableApi {
  private _base: Airtable.Base
  private _axiosClient: AxiosInstance
  private _baseId: string

  public constructor(apiKey: string, baseId: string, endpointUrl?: string) {
    this._baseId = baseId
    this._base = new Airtable({ apiKey, endpointUrl }).base(baseId)
    this._axiosClient = axios.create({
      baseURL: endpointUrl || 'https://api.airtable.com/v0/',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  public async testConnection(): Promise<void> {
    return await this._axiosClient.get(`/meta/whoami`)
  }

  public async listRecords({
    tableIdOrName,
    filterByFormula,
    offset,
  }: {
    tableIdOrName: string
    filterByFormula?: string
    offset?: string
  }): Promise<{ records: Records<FieldSet>; offset?: string }> {
    const response = await this._axiosClient.get(
      `${this._baseId}/${tableIdOrName}?${stringify({ offset, filterByFormula })}`
    )

    const records = response.data?.records

    if (!records) {
      return { records: [], offset: undefined }
    }

    return {
      records,
      offset: response.data?.offset,
    }
  }

  public async getTableRecords(tableIdOrName: string): Promise<Records<FieldSet>> {
    const records = await this._base(tableIdOrName).select().all()
    return records
  }

  public async createRecord(tableIdOrName: string, fields: object): Promise<RecordResponse> {
    const record = await this._base(tableIdOrName).create(fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  }

  public async updateRecord(tableIdOrName: string, recordId: string, fields: object): Promise<RecordResponse> {
    const record = await this._base(tableIdOrName).update(recordId, fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  }

  public async createTable(name: string, fields: TableFields, description?: string): Promise<TableResponse> {
    const descriptionLimit = 20000
    const validDescription = description?.slice(0, descriptionLimit)
    const payload = {
      name,
      description: validDescription,
      fields,
    }

    const response = await this._axiosClient.post(`/meta/bases/${this._baseId}/tables`, payload)
    return response.data
  }

  public async updateTable(tableIdOrName: string, name?: string, description?: string): Promise<TableResponse> {
    const response = await this._axiosClient.patch(`/meta/bases/${this._baseId}/tables/${tableIdOrName}`, {
      name,
      description,
    })
    return response.data
  }
}
