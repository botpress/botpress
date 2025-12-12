import axios, { type AxiosInstance } from 'axios'
import * as bp from '.botpress'

const TOKEN_STATE_KEY = 'oauthToken'
const DEFAULT_SCOPE = 'eats.store eats.order'

export class UberEatsClient {
  private _clientId: string
  private _clientSecret: string
  private _scope: string
  private _axios: AxiosInstance
  private _bpClient: bp.Client
  private _ctx: bp.Context

  public constructor({
    clientId,
    clientSecret,
    scope = DEFAULT_SCOPE,
    bpClient,
    ctx,
  }: {
    clientId: string
    clientSecret: string
    scope?: string
    bpClient: bp.Client
    ctx: bp.Context
  }) {
    this._scope = scope
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._bpClient = bpClient
    this._ctx = ctx

    this._axios = axios.create({
      baseURL: 'https://api.uber.com/v1/eats',
      headers: { 'Content-Type': 'application/json' },
    })
  }

  public async getOrder(orderId: string) {
    return this._request('GET', `/orders/${orderId}`)
  }

  public async getCreatedOrders(storeId: string) {
    return this._request('GET', `/stores/${storeId}/created-orders`)
  }

  public async getCanceledOrders(storeId: string) {
    return this._request('GET', `/stores/${storeId}/canceled-orders`)
  }

  public async acceptOrder(orderId: string): Promise<void> {
    await this._request('POST', `/orders/${orderId}/accept_pos_order`)
  }

  public async denyOrder(orderId: string, reason?: string): Promise<void> {
    await this._request('POST', `/orders/${orderId}/deny_pos_order`, reason ? { reason } : undefined)
  }

  public async updateRestaurantDeliveryStatus(orderId: string, status: string): Promise<void> {
    await this._request('POST', `/orders/${orderId}/delivery_status`, { status })
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
      console.warn('Uber Eats token request failed:', error)
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
      payload: {
        accessToken: null,
        expiresAt: null,
      },
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

  private async _request<T = unknown>(method: 'GET' | 'POST' | 'PATCH', url: string, data?: unknown): Promise<T> {
    const token = await this._getAccessToken()

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    const res = await this._axios.request<T>({
      method,
      url,
      data,
      headers,
    })

    return res.data
  }
}
