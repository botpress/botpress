import * as sdk from '@botpress/sdk'

// Types for API responses and requests
export type RecordIdentifier = {
  workspace_id: string
  object_id: string
  record_id: string
}

export type AttioRecord = {
  id: RecordIdentifier
  created_at: string
  web_url: string
  values: Record<string, any>
}

export type AttioObject = {
  id?: {
    workspace_id: string
    object_id: string
  }
  api_slug?: string
  singular_noun?: string
  plural_noun?: string
  created_at?: string
}

export type Attribute = {
  id?: {
    workspace_id: string
    object_id: string
    attribute_id: string
  }
  title?: string
  description?: string | null
  api_slug?: string
  type?: string
  slug?: string
  options?: Array<{
    id?: string
    label?: string
    name?: string
    value?: string
    title?: string
    slug?: string
  }>
}

export type Filter = {
  attribute: string
  value: string
}

export type Sort = {
  direction: 'asc' | 'desc'
  attribute: string
  field: string
}

export type ListRecordsParams = {
  filter?: Filter[]
  sorts?: Sort[]
  limit?: number
  offset?: number
}

export type CreateRecordData = {
  values: Record<string, any>
}

export type UpdateRecordData = {
  values: Record<string, any>
}

export type ApiResponse<T> = {
  data: T
}

export type ListRecordsResponse = ApiResponse<AttioRecord[]>
export type GetRecordResponse = ApiResponse<AttioRecord>
export type CreateRecordResponse = ApiResponse<AttioRecord>
export type UpdateRecordResponse = ApiResponse<AttioRecord>
export type ListObjectsResponse = ApiResponse<AttioObject[]>
export type GetObjectResponse = ApiResponse<AttioObject>
export type ListAttributesResponse = ApiResponse<Attribute[]>

export class AttioApiClient {
  private _accessToken: string
  private _baseUrl: string = 'https://api.attio.com/v2'

  public constructor(accessToken: string) {
    this._accessToken = accessToken
  }

  private async _makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this._baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this._accessToken}`,
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorText = await response.text()
        throw new sdk.RuntimeError(`Attio API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof sdk.RuntimeError) {
        throw error
      }
      throw new sdk.RuntimeError(`Request failed: ${error}`)
    }
  }

  // Records API methods
  public async listRecords(object: string, params?: ListRecordsParams): Promise<ListRecordsResponse> {
    const endpoint = `/objects/${object}/records/query`

    // Transform filter array into single object
    let filterObject: Record<string, string> = {}
    if (params?.filter) {
      filterObject = params.filter.reduce(
        (acc, filterItem) => {
          // Each filterItem has { attribute: value } or { name: value }
          return { ...acc, ...filterItem }
        },
        {} as Record<string, string>
      )
    }

    const body = {
      filter: Object.keys(filterObject).length > 0 ? filterObject : undefined,
      sorts: params?.sorts,
      limit: params?.limit,
      offset: params?.offset,
    }

    return this._makeRequest<ListRecordsResponse>('POST', endpoint, body)
  }

  public async getRecord(object: string, recordId: string): Promise<GetRecordResponse> {
    const endpoint = `/objects/${object}/records/${recordId}`
    return this._makeRequest<GetRecordResponse>('GET', endpoint)
  }

  public async createRecord(object: string, data: CreateRecordData): Promise<CreateRecordResponse> {
    const endpoint = `/objects/${object}/records`
    return this._makeRequest<CreateRecordResponse>('POST', endpoint, data)
  }

  public async updateRecord(object: string, recordId: string, data: UpdateRecordData): Promise<UpdateRecordResponse> {
    const endpoint = `/objects/${object}/records/${recordId}`
    return this._makeRequest<UpdateRecordResponse>('PUT', endpoint, data)
  }

  // Objects API methods
  public async listObjects(): Promise<ListObjectsResponse> {
    const endpoint = '/objects'
    return this._makeRequest<ListObjectsResponse>('GET', endpoint)
  }

  public async getObject(object: string): Promise<GetObjectResponse> {
    const endpoint = `/objects/${object}`
    return this._makeRequest<GetObjectResponse>('GET', endpoint)
  }

  // Attributes API methods
  public async listAttributes(object: string): Promise<ListAttributesResponse> {
    const endpoint = `/objects/${object}/attributes`
    return this._makeRequest<ListAttributesResponse>('GET', endpoint)
  }

  // Utility method to test connection
  public async testConnection(): Promise<boolean> {
    try {
      await this._makeRequest<{ data: any }>('GET', '/self')
      return true
    } catch {
      return false
    }
  }
}
