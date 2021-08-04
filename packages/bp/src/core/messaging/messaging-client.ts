import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { cache } from './messaging-client-cache'
import qs from 'querystring'
import { CloudConfig } from 'core/config'

interface OauthTokenClientProps {
  oauthUrl: string
  clientId: string
  clientSecret: string
}

interface OauthResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

interface MessagingSyncWebHookResponse {
  url: string
  token: string
}

interface MessagingSyncResponse {
  id: string
  token: string
  webhooks?: MessagingSyncWebHookResponse[]
}

type OauthClientProps = OauthTokenClientProps & {
  endpoint: string
}

type ErrorRetrier = AxiosError & { config: { _retry: boolean } }

export class MessagingClient {
  private apiUrl: string
  private client: AxiosInstance

  constructor(
    baseUrl: string,
    cloudConfig: CloudConfig,
    private password?: string,
    private clientId?: string,
    private clientToken?: string
  ) {
    this.apiUrl = `${baseUrl}/api`
    this.client = this.createOauthClient({ ...cloudConfig, endpoint: this.apiUrl })
  }

  async syncClient(config: any) {
    const res = await this.client.post<MessagingSyncResponse>('/sync', config, this.getAxiosConfig())
    return res.data
  }

  async sendMessage(conversationId: string, channel: string, payload: any) {
    await this.client.post(
      '/chat/reply',
      {
        conversationId,
        channel,
        payload
      },
      this.getAxiosConfig(true)
    )
  }

  private getAxiosConfig(auth: boolean = false): AxiosRequestConfig {
    const config: AxiosRequestConfig = { headers: {} }

    if (this.password) {
      config.headers.password = this.password
    }

    if (auth) {
      config.auth = { username: this.clientId!, password: this.clientToken! }
    }

    return config
  }

  private createOauthClient({ clientId, clientSecret, endpoint, oauthUrl }: OauthClientProps) {
    const oauthTokenClient = this._createOauthTokenClient(axios.create(), {
      oauthUrl,
      clientId,
      clientSecret
    })

    const tokenCache = cache(oauthTokenClient, {
      getExpiry: res => res.expires_in * 1000,
      getToken: res => res.access_token
    })

    const axiosClient = axios.create({ baseURL: endpoint })
    axiosClient.interceptors.request.use(this._requestInterceptor(tokenCache))
    axiosClient.interceptors.response.use(undefined, this._errorInterceptor(axiosClient, tokenCache))
    return axiosClient
  }

  private _createOauthTokenClient(axios: AxiosInstance, { oauthUrl, clientId, clientSecret }: OauthTokenClientProps) {
    return () =>
      axios
        .post(
          oauthUrl,
          qs.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })
        )
        .then(res => res.data as OauthResponse)
  }

  private _requestInterceptor(authenticate: () => Promise<string>) {
    return async (config: AxiosRequestConfig) => {
      const token = await authenticate()
      config.headers.Authorization = `Bearer ${token}`
      return config
    }
  }

  private _errorInterceptor(instance: AxiosInstance, authenticate: () => Promise<string>) {
    return async (error: ErrorRetrier) => {
      if (error.response?.status === 401 && !error.config._retry) {
        error.config._retry = true
        const token = await authenticate()
        const config = error.config
        config.headers.Authorization = `Bearer ${token}`
        return instance.request(config)
      }

      return Promise.reject(error)
    }
  }
}
