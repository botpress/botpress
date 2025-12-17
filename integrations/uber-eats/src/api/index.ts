import type { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'
import * as uberApi from './gen'
import * as bp from '.botpress'

const TOKEN_STATE_KEY = 'oauthToken'
const DEFAULT_SCOPE = 'eats.store eats.order'

export class UberEatsClient {
  private _clientId: string
  private _clientSecret: string
  private _scope: string
  private _bpClient: bp.Client
  private _ctx: bp.Context
  private _logger: IntegrationLogger

  public constructor({
    clientId,
    clientSecret,
    scope = DEFAULT_SCOPE,
    bpClient,
    ctx,
    logger,
  }: {
    clientId: string
    clientSecret: string
    scope?: string
    bpClient: bp.Client
    ctx: bp.Context
    logger: IntegrationLogger
  }) {
    this._scope = scope
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._bpClient = bpClient
    this._ctx = ctx
    this._logger = logger
  }

  public async getOrder(orderId: string) {
    return uberApi.getOrder(orderId, {}, await this._authOptions())
  }

  public async listStoreOrders(props: uberApi.GetOrdersParams) {
    return uberApi.getOrders(this._ctx.configuration.storeId, props, await this._authOptions())
  }

  public async acceptOrder(orderId: string) {
    return uberApi.acceptOrder(orderId, {}, await this._authOptions())
  }

  public async denyOrder(orderId: string, body: uberApi.DenyOrderBody) {
    return uberApi.denyOrder(orderId, body, await this._authOptions())
  }

  public async markOrderReady(orderId: string) {
    return uberApi.orderReady(orderId, {}, await this._authOptions())
  }

  private async _requestNewToken(): Promise<string> {
    try {
      const body = new URLSearchParams({
        client_id: this._clientId,
        client_secret: this._clientSecret,
        grant_type: 'client_credentials',
        scope: this._scope,
      })

      const response = await axios.post('https://auth.uber.com/oauth/v2/token', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const { access_token, expires_in } = response.data

      if (!access_token) {
        throw new Error('Uber Eats token response missing access_token')
      }

      await this._saveToken(access_token, expires_in)
      return access_token
    } catch (error) {
      this._logger.warn('Uber Eats token request failed:', error)
      throw error
    }
  }

  private async _saveToken(token: string, expiresIn: number) {
    await this._bpClient.setState({
      type: 'integration',
      name: TOKEN_STATE_KEY,
      id: this._ctx.integrationId,
      payload: {
        accessToken: token,
        expiresAt: Date.now() + expiresIn * 1000,
      },
    })
  }

  private async _getAccessToken(): Promise<string> {
    const { state } = await this._bpClient.getOrSetState({
      type: 'integration',
      name: TOKEN_STATE_KEY,
      id: this._ctx.integrationId,
      payload: {},
    })

    const accessToken = state.payload.accessToken
    const expiresAt = state.payload.expiresAt

    if (accessToken && Date.now() < (expiresAt ?? 0)) {
      return accessToken
    }

    return await this._requestNewToken()
  }

  public async testConnection() {
    await this._getAccessToken()
    return true
  }

  private async _authOptions(): Promise<{ headers: Record<string, string> }> {
    const token = await this._getAccessToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }
}
