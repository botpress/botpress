import { Client } from '@botpress/nlu-client'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import qs from 'querystring'
import { cache } from './cache'

interface OauthTokenClientProps {
  oauthUrl: string
  clientId: string
  clientSecret: string
}

type OauthClientProps = OauthTokenClientProps & {
  endpoint: string
}

interface OauthResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

type ErrorRetrier = AxiosError & { config: { _retry: boolean } }

export class CloudClient extends Client {
  constructor(options: OauthClientProps) {
    super({ baseURL: options.endpoint, validateStatus: () => true })

    const { oauthUrl, clientId, clientSecret } = options
    const oauthTokenClient = this._createOauthTokenClient(axios.create(), {
      oauthUrl,
      clientId,
      clientSecret
    })

    const tokenCache = cache(oauthTokenClient, {
      getExpiryInMs: res => res.expires_in * 1000,
      getToken: res => res.access_token
    })

    this.axios.interceptors.request.use(this._requestInterceptor(tokenCache).bind(this))
    this.axios.interceptors.response.use(undefined, this._errorInterceptor(this.axios, tokenCache).bind(this))
  }

  private _createOauthTokenClient = (
    axios: AxiosInstance,
    oauthTokenClientProps: OauthTokenClientProps
  ) => async () => {
    const { oauthUrl, clientId, clientSecret } = oauthTokenClientProps
    const res = await axios.post(
      oauthUrl,
      qs.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })
    )

    return res.data as OauthResponse
  }

  private _requestInterceptor = (authenticate: () => Promise<string>) => async (config: AxiosRequestConfig) => {
    const token = await authenticate()
    config.headers.Authorization = `Bearer ${token}`
    return config
  }

  private _errorInterceptor = (instance: AxiosInstance, authenticate: () => Promise<string>) => async (
    error: ErrorRetrier
  ) => {
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
