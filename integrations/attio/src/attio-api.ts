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
  values: Record<string, unknown>
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

export type Sort = {
  direction: 'asc' | 'desc'
  attribute: string
  field: string
}

export type ListRecordsParams = {
  filter?: Record<string, string>
  sorts?: Sort[]
  limit?: number
  offset?: number
}

export type CreateRecordData = {
  data: {
    values: Record<string, unknown>
  }
}

export type UpdateRecordData = {
  data: {
    values: Record<string, unknown>
  }
}

export type ApiResponse<T> = {
  data: T
}

export type WebhookData = {
  event_type: string
  filter: Record<string, string> | null
}

export type WebhookCreateData = {
  data: {
    target_url: string
    subscriptions: WebhookData[]
  }
}

export type WebhookId = {
  workspace_id: string
  webhook_id: string
}

export type WebhookResponse = {
  id: WebhookId
  target_url: string
  subscriptions: WebhookData[]
  created_at: string
  secret: string
}

export type ListRecordsResponse = ApiResponse<AttioRecord[]>
export type GetRecordResponse = ApiResponse<AttioRecord>
export type CreateRecordResponse = ApiResponse<AttioRecord>
export type UpdateRecordResponse = ApiResponse<AttioRecord>
export type ListObjectsResponse = ApiResponse<AttioObject[]>
export type GetObjectResponse = ApiResponse<AttioObject>
export type ListAttributesResponse = ApiResponse<Attribute[]>

export type CreateWebhookResponse = ApiResponse<WebhookResponse>

export class AttioApiClient {
  private _accessToken: string
  private _baseUrl: string = 'https://api.attio.com/v2'

  public constructor(accessToken: string) {
    this._accessToken = accessToken
  }

  private async _makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
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

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Attio API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data
  }

  // Records API methods
  public async listRecords(object: string, params?: ListRecordsParams): Promise<ListRecordsResponse> {
    const endpoint = `/objects/${object}/records/query`

    const body = {
      filter: params?.filter,
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

  // Webhook API methods
  public async createWebhook(data: WebhookCreateData): Promise<CreateWebhookResponse> {
    const endpoint = '/webhooks'
    return this._makeRequest<CreateWebhookResponse>('POST', endpoint, data)
  }

  public async deleteWebhook(webhookId: string): Promise<void> {
    const endpoint = `/webhooks/${webhookId}`
    await this._makeRequest<void>('DELETE', endpoint)
  }

  // Utility method to test connection
  public async testConnection(): Promise<void> {
    await this._makeRequest<{ data: unknown }>('GET', '/self')
  }
}
