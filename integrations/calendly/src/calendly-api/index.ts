import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import type { CommonHandlerProps, ContextOfType, Supplier } from '../types'
import { applyOAuthState, CalendlyAuthClient } from './auth'
import {
  type CalendlyUri,
  type CreateSchedulingLinkResp,
  createSchedulingLinkRespSchema,
  type CreateWebhookResp,
  createWebhookRespSchema,
  type EventType,
  type GetCurrentUserResp,
  getCurrentUserRespSchema,
  type GetEventTypesListResp,
  getEventTypesListRespSchema,
  type GetWebhooksListResp,
  getWebhooksListRespSchema,
} from './schemas'
import type { RegisterWebhookParams, WebhooksListParams } from './types'

const API_BASE_URL = 'https://api.calendly.com' as const

// ------ Status Codes ------
const NO_CONTENT = 204 as const

export class CalendlyClient {
  private _axiosClient: AxiosInstance

  private constructor(getAccessToken: Supplier<Promise<string> | string>) {
    this._axiosClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this._axiosClient.interceptors.request.use(async (config) => {
      const token = await getAccessToken()
      config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }

  public async getCurrentUser(): Promise<GetCurrentUserResp> {
    const resp = await this._axiosClient.get<object>('/users/me')
    try {
      return getCurrentUserRespSchema.parse(resp.data)
    } catch {
      throw new RuntimeError('Failed to get current user due to unexpected api response')
    }
  }

  public async getEventTypesList(userUri: CalendlyUri): Promise<GetEventTypesListResp> {
    const searchParams = new URLSearchParams({ user: userUri })
    const resp = await this._axiosClient.get<object>(`/event_types?${searchParams}`)
    try {
      return getEventTypesListRespSchema.parse(resp.data)
    } catch {
      throw new RuntimeError('Failed to get event types list due to unexpected api response')
    }
  }

  public async getWebhooksList(params: WebhooksListParams): Promise<GetWebhooksListResp> {
    const searchParams = new URLSearchParams({ ...params, count: '100' })
    const resp = await this._axiosClient.get<object>(`/webhook_subscriptions?${searchParams}`)

    try {
      return getWebhooksListRespSchema.parse(resp.data)
    } catch {
      throw new RuntimeError('Failed to get webhooks list due to unexpected api response')
    }
  }

  public async createWebhook(params: RegisterWebhookParams): Promise<CreateWebhookResp> {
    const { webhookUrl, events, organization, scope, user, signingKey } = params
    const resp = await this._axiosClient.post<object>('/webhook_subscriptions', {
      url: webhookUrl,
      events,
      organization,
      user,
      scope,
      signing_key: signingKey,
    })

    try {
      return createWebhookRespSchema.parse(resp.data)
    } catch {
      throw new RuntimeError('Failed to create webhook due to unexpected api response')
    }
  }

  public async removeWebhook(webhookUri: CalendlyUri): Promise<boolean> {
    const webhookUuid = _extractWebhookUuid(webhookUri)
    const resp = await this._axiosClient.delete<object>(`/webhook_subscriptions/${webhookUuid}`)
    return resp.status === NO_CONTENT
  }

  public async createSingleUseSchedulingLink(eventType: EventType): Promise<CreateSchedulingLinkResp> {
    const resp = await this._axiosClient.post<object>('/scheduling_links', {
      max_event_count: 1,
      owner: eventType.uri,
      owner_type: 'EventType',
    })

    try {
      return createSchedulingLinkRespSchema.parse(resp.data)
    } catch {
      throw new RuntimeError('Failed to create scheduling link due to unexpected api response')
    }
  }

  private static async _createFromManualConfig(ctx: ContextOfType<'manual'>) {
    const { accessToken } = ctx.configuration
    return new CalendlyClient(() => accessToken)
  }

  private static async _createFromOAuthConfig(props: CommonHandlerProps) {
    return new CalendlyClient(_useGetOAuthAccessToken(props))
  }

  public static async create(props: CommonHandlerProps): Promise<CalendlyClient> {
    switch (props.ctx.configurationType) {
      case 'manual':
        return this._createFromManualConfig(props.ctx)
      case null:
        return this._createFromOAuthConfig(props)
      default:
        // @ts-ignore
        throw new Error(`Unsupported configuration type: ${props.ctx.configurationType}`)
    }
  }
}

const _extractWebhookUuid = (webhookUri: CalendlyUri) => {
  const match = webhookUri.match(/\/webhook_subscriptions\/(.+)$/)
  return match ? match[1] : null
}

const _useGetOAuthAccessToken = (props: CommonHandlerProps) => {
  return async () => {
    const { state } = await props.client.getOrSetState({
      type: 'integration',
      name: 'configuration',
      id: props.ctx.integrationId,
      payload: {
        oauth: null,
      },
    })
    let oauthState = state.payload.oauth

    if (!oauthState) {
      throw new RuntimeError('User authentication has not been completed')
    }

    const { expiresAt, refreshToken } = oauthState
    if (expiresAt <= Date.now()) {
      const authClient = new CalendlyAuthClient()
      const resp = await authClient.getAccessTokenWithRefreshToken(refreshToken)
      if (!resp.success) throw resp.error

      oauthState = (await applyOAuthState(props, resp.data)).oauth
    }

    return oauthState.accessToken
  }
}
