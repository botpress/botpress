import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { cache } from './cache'
import qs from 'querystring'

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

const createOauthTokenClient = (axios: AxiosInstance, oauthTokenClientProps: OauthTokenClientProps) => async () => {
  const { oauthUrl, clientId, clientSecret } = oauthTokenClientProps
  const res = await axios.post(
    oauthUrl,
    qs.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })
  )

  return res.data as OauthResponse
}

const requestInterceptor = (authenticate: () => Promise<string>) => async (config: AxiosRequestConfig) => {
  const token = await authenticate()
  config.headers.Authorization = `Bearer ${token}`
  return config
}

type ErrorRetrier = AxiosError & { config: { _retry: boolean } }

const errorInterceptor = (instance: AxiosInstance, authenticate: () => Promise<string>) => async (
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

export type OauthClientProps = OauthTokenClientProps & {
  endpoint: string
}

export const createOauthClient = ({ clientId, clientSecret, endpoint, oauthUrl }: OauthClientProps) => {
  const oauthTokenClient = createOauthTokenClient(axios.create(), {
    oauthUrl,
    clientId,
    clientSecret
  })

  const tokenCache = cache(oauthTokenClient, {
    getExpiryInMs: res => res.expires_in * 1000,
    getToken: res => res.access_token
  })

  const axiosClient = axios.create({ baseURL: endpoint })
  axiosClient.interceptors.request.use(requestInterceptor(tokenCache))
  axiosClient.interceptors.response.use(undefined, errorInterceptor(axiosClient, tokenCache))
  return axiosClient
}
