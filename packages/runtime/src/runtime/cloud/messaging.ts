import { MessagingChannel, MessagingChannelOptions, uuid } from '@botpress/messaging-client'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { CloudConfig } from 'botpress/runtime-sdk'
import { VError } from 'verror'
import { cache } from './cache'
import { createOauthTokenClient, errorInterceptor, ErrorRetrier, requestInterceptor } from './oauth'

export interface ClientIdToCloudConfig {
  [clientId: uuid]: CloudConfig
}

type Props = MessagingChannelOptions & {
  clientIdToCloudConfig: ClientIdToCloudConfig
}

export class CloudMessagingChannel extends MessagingChannel {
  constructor(props: Props) {
    super(props)

    const { clientIdToCloudConfig } = props

    const axiosInstance = this.http
    axiosInstance.interceptors.request.use(
      requestInterceptor((requestConfig: AxiosRequestConfig) => {
        const messagingClientId = getClientIdFromRequestConfig(requestConfig)
        if (!messagingClientId) {
          throw new VError(
            `could not find messagingClientId in axios request, config: ${JSON.stringify(requestConfig)}`
          )
        }
        return getToken(messagingClientId, clientIdToCloudConfig)
      })
    )
    axiosInstance.interceptors.response.use(
      undefined,
      errorInterceptor(axiosInstance, async requestConfig => {
        const messagingClientId = getClientIdFromRequestConfig(requestConfig)
        return getToken(messagingClientId, clientIdToCloudConfig)
      })
    )
  }
}

const authByMessagingClientId = {}

const getClientIdFromRequestConfig = (config: AxiosRequestConfig) => {
  return config.headers?.['x-bp-messaging-client-id']
}

const getToken = async (clientId: uuid, clientIdToCloudConfig: ClientIdToCloudConfig) => {
  let auth = authByMessagingClientId[clientId]
  if (!auth) {
    const { oauthUrl, clientId: oauthClientId, clientSecret } = clientIdToCloudConfig[clientId]
    auth = cache(
      createOauthTokenClient(axios.create(), {
        oauthUrl,
        clientId: oauthClientId,
        clientSecret,
        scopes: ['messaging']
      }),
      {
        getExpiryInMs: res => res.expires_in * 1000,
        getToken: res => res.access_token
      }
    )
    authByMessagingClientId[clientId] = auth
  }

  return auth()
}
