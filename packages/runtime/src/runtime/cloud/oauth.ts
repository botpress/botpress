import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import qs from 'querystring'
import { cache } from './cache'

type Scope = 'messaging' | 'nlu'

export interface CloudClientProps {
  oauthUrl: string
  clientId: string
  clientSecret: string
}

interface OauthTokenClientProps extends CloudClientProps {
  scopes: Scope[]
}

interface OauthResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

export type ErrorRetrier = AxiosError & { config: { _retry: boolean } }

export const authenticateOAuth = (
  props: {
    axiosInstance: AxiosInstance
  } & OauthTokenClientProps
) => {
  const { axiosInstance, oauthUrl, clientId, clientSecret, scopes } = props

  const oauthTokenClient = createOauthTokenClient(axios.create(), {
    oauthUrl,
    clientId,
    clientSecret,
    scopes
  })

  const tokenCache = cache(oauthTokenClient, {
    getExpiryInMs: res => res.expires_in * 1000,
    getToken: res => res.access_token
  })

  axiosInstance.interceptors.request.use(requestInterceptor(tokenCache))
  axiosInstance.interceptors.response.use(undefined, errorInterceptor(axiosInstance, tokenCache))
}

export const createOauthTokenClient = (
  axios: AxiosInstance,
  oauthTokenClientProps: OauthTokenClientProps
) => async () => {
  const { oauthUrl, clientId, clientSecret, scopes } = oauthTokenClientProps
  const res = await axios.post(
    oauthUrl,
    qs.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: scopes.join(' ')
    })
  )

  return res.data as OauthResponse
}

export const requestInterceptor = (authenticate: (requestConfig: AxiosRequestConfig) => Promise<string>) => async (
  config: AxiosRequestConfig
) => {
  const token = await authenticate(config)
  config.headers.Authorization = `Bearer ${token}`
  return config
}

export const errorInterceptor = (
  instance: AxiosInstance,
  authenticate: (requestConfig: AxiosRequestConfig) => Promise<string>
) => async (error: ErrorRetrier) => {
  const { config } = error
  if (error.response?.status === 401 && !config._retry) {
    error.config._retry = true
    const token = await authenticate(config)
    config.headers.Authorization = `Bearer ${token}`
    return instance.request(config)
  }

  return Promise.reject(error)
}
