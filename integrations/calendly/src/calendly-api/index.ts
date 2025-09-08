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

    const result = getCurrentUserRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError('Failed to get current user due to unexpected api response')
    }
    return result.data
  }

  public async getEventTypesList(userUri: CalendlyUri): Promise<GetEventTypesListResp> {
    const searchParams = new URLSearchParams({ user: userUri })
    const resp = await this._axiosClient.get<object>(`/event_types?${searchParams}`)

    const result = getEventTypesListRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError('Failed to get event types list due to unexpected api response')
    }
    return result.data
  }

  public async getWebhooksList(params: WebhooksListParams): Promise<GetWebhooksListResp> {
    const searchParams = new URLSearchParams({ ...params, count: '100' })
    const resp = await this._axiosClient.get<object>(`/webhook_subscriptions?${searchParams}`)

    const result = getWebhooksListRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError('Failed to get webhooks list due to unexpected api response')
    }
    return result.data
  }

  public async createWebhook(params: RegisterWebhookParams): Promise<CreateWebhookResp> {
    const { webhookUrl, events, organization, scope, user, signingKey } = params

    try {
      const resp = await this._axiosClient.post<object>('/webhook_subscriptions', {
        url: webhookUrl,
        events,
        organization,
        user,
        scope,
        signing_key: signingKey,
      })

      const result = createWebhookRespSchema.safeParse(resp.data)
      if (!result.success) {
        throw new RuntimeError('Failed to create webhook due to unexpected api response', result.error)
      }
      return result.data
    } catch (thrown: unknown) {
      if (axios.isAxiosError(thrown)) {
        if (thrown.status === 403) {
          let errorMsg: string
          const respData = thrown.response?.data
          if (typeof respData === 'object' && 'message' in respData) {
            errorMsg = respData.message
          } else {
            errorMsg =
              "Either the user's account plan is insufficient (requires standard or above) or the user's account does not have the permission to register webhooks"
          }

          throw new RuntimeError(errorMsg, thrown)
        }

        throw new RuntimeError(thrown.message, thrown)
      }

      if (thrown instanceof RuntimeError) {
        throw thrown
      }

      const error = thrown instanceof Error ? new RuntimeError(thrown.message) : new RuntimeError(String(thrown))
      throw error
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

    const result = createSchedulingLinkRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError('Failed to create scheduling link due to unexpected api response')
    }
    return result.data
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

const FIVE_MINUTES_IN_MS = 300000 as const
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
