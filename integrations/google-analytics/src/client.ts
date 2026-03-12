import axios, { AxiosInstance, isAxiosError } from 'axios'

export type EventParams = Record<string, unknown>

type UserPropertyValue = string | number | boolean | null

type DebugResponse = {
  validationMessages?: Array<{
    description?: string
    fieldPath?: string
    validationCode?: string
  }>
}

type CollectPayload = {
  client_id: string
  events: Array<{
    name: string
    params?: EventParams
  }>
  user_properties?: Record<string, { value: UserPropertyValue }>
}

export class GoogleAnalyticsClient {
  private readonly _client: AxiosInstance

  public constructor(
    private readonly _measurementId: string,
    private readonly _apiSecret: string
  ) {
    this._client = axios.create({
      baseURL: 'https://www.google-analytics.com',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  public async validateConfiguration(): Promise<void> {
    const { data } = await this._client.post<DebugResponse>(
      '/debug/mp/collect',
      {
        client_id: 'botpress-validation',
        events: [
          {
            name: 'botpress_configuration_validation',
            params: {
              engagement_time_msec: 1,
            },
          },
        ],
      },
      {
        params: this._buildQueryParams(),
      }
    )

    const validationMessages = data.validationMessages ?? []
    if (validationMessages.length > 0) {
      const details = validationMessages
        .map(({ fieldPath, description, validationCode }) =>
          [fieldPath, description, validationCode].filter(Boolean).join(': ')
        )
        .join(', ')

      throw new Error(details || 'Google Analytics rejected the configuration')
    }
  }

  public async trackEvent(clientId: string, eventName: string, params: EventParams = {}): Promise<void> {
    await this._collect({
      client_id: clientId,
      events: [
        {
          name: eventName,
          params,
        },
      ],
    })
  }

  public async updateUserProfile(clientId: string, userProfile: EventParams): Promise<void> {
    await this._collect({
      client_id: clientId,
      user_properties: buildUserProperties(userProfile),
      events: [
        {
          name: 'update_user_profile',
          params: {
            ...userProfile,
            engagement_time_msec: 1,
          },
        },
      ],
    })
  }

  private async _collect(payload: CollectPayload): Promise<void> {
    await this._client.post('/mp/collect', payload, {
      params: this._buildQueryParams(),
    })
  }

  private _buildQueryParams(): { measurement_id: string; api_secret: string } {
    return {
      measurement_id: this._measurementId,
      api_secret: this._apiSecret,
    }
  }
}

export function parseJsonObject(value: string | undefined, fieldName: string): EventParams {
  if (!value) {
    return {}
  }

  const parsed: unknown = JSON.parse(value)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${fieldName} must be a valid JSON object`)
  }

  return parsed as EventParams
}

export function parseError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response) {
      const responseData =
        typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)

      return `Request failed with status ${error.response.status}: ${responseData || error.message}`
    }

    if (error.request) {
      return `No response received: ${error.message}`
    }

    return `Axios error: ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
    return String(error)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return parseError(error.message)
  }

  return 'An unexpected error occurred'
}

function buildUserProperties(userProfile: EventParams): Record<string, { value: UserPropertyValue }> {
  return Object.fromEntries(
    Object.entries(userProfile).map(([key, value]) => [
      key,
      {
        value: toUserPropertyValue(value),
      },
    ])
  )
}

function toUserPropertyValue(value: unknown): UserPropertyValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value
  }

  return JSON.stringify(value)
}
