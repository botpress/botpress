import { type Client } from '@botpress/client'
import { BotpressClientLike } from './types'

/**
 * Structural view of the transport instance carried by a `@botpress/client`
 * Client: the fetch-based http client on recent versions, an axios instance on
 * older ones. Both expose this surface.
 */
type HttpClientLike = {
  defaults: { signal?: AbortSignal }
  get: (url: string, config?: { headers?: Record<string, string | undefined> }) => Promise<{ data: any }>
}

/** @internal */
export type ExtendedClient = Client & {
  botId: string
  http: HttpClientLike
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

  const clone = () => {
    const c = client as any
    if (c.clone && typeof c.clone === 'function') {
      return getExtendedClient(c.clone())
    }
    return getExtendedClient(new c.constructor(c.config))
  }

  return {
    ...client,
    botId: client.config.headers['x-bot-id'] as string,
    // recent @botpress/client versions carry `httpClient`, older ones `axiosInstance`
    http: ((client as any).httpClient ?? (client as any).axiosInstance) as HttpClientLike,
    clone,
    abortable: (signal: AbortSignal) => {
      const abortable = clone()
      const instance = abortable.http
      instance.defaults.signal = signal
      return abortable
    },
  } as ExtendedClient
}
