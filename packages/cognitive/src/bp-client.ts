import { type Client } from '@botpress/client'
import { type AxiosInstance } from 'axios'
import { BotpressClientLike } from './types'

/** @internal */
export type ExtendedClient = Client & {
  botId: string
  axios: AxiosInstance
  clone: () => ExtendedClient
  abortable: (signal: AbortSignal) => ExtendedClient
}

type InternalClientType = BotpressClientLike & {
  _client?: InternalClientType
  config: {
    headers: Record<string, string>
  }
}

export const getExtendedClient = (_client: unknown): ExtendedClient => {
  const client = _client as InternalClientType

  if (!client || client === null || typeof client !== 'object') {
    throw new Error('Client must be a valid instance of a Botpress client (@botpress/client)')
  }

  if (typeof client._client === 'object' && !!client._client) {
    try {
      return getExtendedClient(client._client)
    } catch {}
  }

  if (
    typeof client.constructor !== 'function' ||
    typeof client.callAction !== 'function' ||
    !client.config ||
    typeof client.config !== 'object' ||
    !client.config.headers
  ) {
    throw new Error('Client must be a valid instance of a Botpress client (@botpress/client)')
  }

  const botId = client.config.headers['x-bot-id'] as string

  if (!botId?.length) {
    throw new Error('Client must be instanciated with Bot ID')
  }

  const clone = () => {
    const c = client as any
    if (c.clone && typeof c.clone === 'function') {
      return getExtendedClient(c.clone())
    }
    return getExtendedClient(new c.constructor(c.config))
  }

  return {
    ...client,
    botId,
    axios: (client as any).axiosInstance as AxiosInstance,
    clone,
    abortable: (signal: AbortSignal) => {
      const abortable = clone()
      const instance = abortable.axios
      instance.defaults.signal = signal
      return abortable
    },
  } as ExtendedClient
}
