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

export const getExtendedClient = (client: BotpressClientLike): ExtendedClient => {
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
