import Airtable, { type FieldSet } from 'airtable'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { stringify } from 'querystring'
import { handleErrorsDecorator } from './api/error-handling'
import type { CreatableField } from './misc/field-schemas'
import * as bp from '.botpress'

const handleErrors = handleErrorsDecorator
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
  private _logger: bp.Logger

  public constructor({ ctx, logger }: bp.CommonHandlerProps) {
    this._logger = logger
    const endpointUrl = ctx.configuration.endpointUrl || 'https://api.airtable.com/v0/'
    const apiKey = ctx.configuration.accessToken
    const baseId = ctx.configuration.baseId
    this._baseId = baseId

    // This split is done because the Airtable SDK appends /v0/ path itself
    this._base = new Airtable({ apiKey, endpointUrl: endpointUrl.replace('/v0/', '') }).base(baseId)
    this._axiosClient = axios.create({
      baseURL: endpointUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  @handleErrors('Failed to test connection to Airtable')
  public async testConnection(): Promise<AxiosResponse> {
    return await this._axiosClient.get('/meta/whoami')
  }

  @handleErrors('Failed to list records')
  public async listRecords({
    tableIdOrName,
    filterByFormula,
    nextToken,
  }: {
    tableIdOrName: string
    filterByFormula?: string
    nextToken?: string
  }): Promise<{ records: RecordResponse[]; nextToken?: string }> {
    const response = await this._axiosClient.get(
      `${this._baseId}/${tableIdOrName}?${stringify({ nextToken, filterByFormula })}`
    )

    const records = response.data?.records

    if (!records) {
      return { records: [], nextToken: undefined }
    }

    return {
      records,
      nextToken: response.data?.offset,
    }
  }

  @handleErrors('Failed to create record')
  public async createRecord(tableIdOrName: string, fields: FieldSet): Promise<RecordResponse> {
    const record = await this._base(tableIdOrName).create(fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  }

  @handleErrors('Failed to update record')
  public async updateRecord(tableIdOrName: string, recordId: string, fields: FieldSet): Promise<RecordResponse> {
    const record = await this._base(tableIdOrName).update(recordId, fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  }

  @handleErrors('Failed to create table')
  public async createTable(name: string, fields: CreatableField[], description?: string): Promise<TableResponse> {
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

  @handleErrors('Failed to update table')
  public async updateTable(tableIdOrName: string, name?: string, description?: string): Promise<TableResponse> {
    const response = await this._axiosClient.patch(`/meta/bases/${this._baseId}/tables/${tableIdOrName}`, {
      name,
      description,
    })
    return response.data
  }
}
