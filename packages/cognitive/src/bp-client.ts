export type BotpressClientLike = {
  callAction(...params: any): Promise<any>
  constructor: Function
}

export type ExtractedClientConfig = {
  apiUrl?: string
  headers: Record<string, string | string[]>
  timeout?: number
  withCredentials?: boolean
}

type ClientWithConfig = {
  _client?: unknown
  config?: {
    apiUrl?: string
    headers?: Record<string, string | string[]>
    timeout?: number
    withCredentials?: boolean
  }
}

const INVALID_CLIENT_MESSAGE = 'Client must be a valid instance of a Botpress client (@botpress/client)'

/**
 * Extracts the http configuration (api url, auth/bot headers, timeout) from a
 * `@botpress/client` Client — or anything wrapping one under `_client`, like
 * the sdk's client — so a {@link import('./cognitive').Cognitive} can be
 * constructed directly from it.
 */
export const extractClientConfig = (client: unknown): ExtractedClientConfig => {
  const c = client as ClientWithConfig | null
  if (!c || typeof c !== 'object') {
    throw new Error(INVALID_CLIENT_MESSAGE)
  }

  if (typeof c._client === 'object' && !!c._client) {
    try {
      return extractClientConfig(c._client)
    } catch {}
  }

  if (!c.config || typeof c.config !== 'object' || !c.config.headers) {
    throw new Error(INVALID_CLIENT_MESSAGE)
  }

  return {
    apiUrl: c.config.apiUrl,
    headers: { ...c.config.headers },
    timeout: c.config.timeout,
    withCredentials: c.config.withCredentials,
  }
}
