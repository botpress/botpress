import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import type { CommonHandlerProps } from '../types'
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
import type { ContextOfType, RegisterWebhookParams, WebhooksListParams } from './types'

const API_BASE_URL = 'https://api.calendly.com' as const

// ------ Status Codes ------
const NO_CONTENT = 204 as const

export class CalendlyClient {
  private _axiosClient: AxiosInstance

  private constructor(accessToken: string) {
    this._axiosClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this._axiosClient.interceptors.request.use(async (config) => {
      config.headers.Authorization = `Bearer ${accessToken}`
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
    const { webhookUrl, events, organization, scope, user } = params
    const resp = await this._axiosClient.post<object>('/webhook_subscriptions', {
      url: webhookUrl,
      events,
      organization,
      user,
      scope,
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
    return new CalendlyClient(ctx.configuration.accessToken)
  }

  private static async _createFromOAuthConfig(props: CommonHandlerProps) {
    const accessToken = await _getOAuthAccessToken(props)
    return new CalendlyClient(accessToken)
  }

  public static async create(props: CommonHandlerProps): Promise<CalendlyClient> {
    const { ctx } = props
    switch (ctx.configurationType) {
      case 'manual':
        return this._createFromManualConfig(ctx)
      case null:
        return this._createFromOAuthConfig(props)
      default:
        ctx satisfies never
    }

    throw new RuntimeError(`Unsupported configuration type: ${props.ctx.configurationType}`)
  }
}

const _extractWebhookUuid = (webhookUri: CalendlyUri) => {
  const match = webhookUri.match(/\/webhook_subscriptions\/(.+)$/)
  return match ? match[1] : null
}

const _getOAuthAccessToken = async (props: CommonHandlerProps) => {
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
  if (expiresAt - FIVE_MINUTES_IN_MS <= Date.now()) {
    const authClient = new CalendlyAuthClient()
    const resp = await authClient.getAccessTokenWithRefreshToken(refreshToken)
    if (!resp.success) throw resp.error

    oauthState = (await applyOAuthState(props, resp.data)).oauth
  }

  return oauthState.accessToken
}

const FIVE_MINUTES_IN_MS = 300000 as const
