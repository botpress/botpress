// globalThis.crypto covers browsers, web workers, node >= 19 and most edge runtimes
const randomUUID = (): string =>
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15)

export type HttpHeaders = Record<string, string | string[] | undefined>
export type HttpResponseHeaders = Record<string, string>

export type HttpRequestConfig<D = any> = {
  url?: string
  method?: string
  baseURL?: string
  headers?: HttpHeaders
  data?: D
  timeout?: number
  signal?: AbortSignal
  responseType?: 'json' | 'text' | 'arraybuffer' | 'stream'
  withCredentials?: boolean
}

export type HttpResponse<T = any> = {
  data: T
  status: number
  statusText: string
  headers: HttpResponseHeaders
  config: HttpRequestConfig
}

export class HttpError<T = any> extends Error {
  public readonly isHttpError = true

  public constructor(
    message: string,
    public readonly config: HttpRequestConfig,
    public readonly code?: string,
    public readonly response?: HttpResponse<T>,
    cause?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export const isHttpError = (err: unknown): err is HttpError =>
  err instanceof HttpError ||
  (typeof err === 'object' && err !== null && (err as { isHttpError?: unknown }).isHttpError === true)

const IDEMPOTENT_METHODS = ['get', 'head', 'options', 'put', 'delete']

export const isNetworkError = (error: unknown): boolean => isHttpError(error) && !error.response

export const isNetworkOrIdempotentRequestError = (error: unknown): boolean => {
  if (!isHttpError(error)) {
    return false
  }
  if (!error.response) {
    return true
  }
  const method = error.config.method?.toLowerCase() ?? ''
  return IDEMPOTENT_METHODS.includes(method) && error.response.status >= 500 && error.response.status <= 599
}

export type RetryConfig = {
  retries?: number
  retryCondition?: (error: HttpError) => boolean | Promise<boolean>
  retryDelay?: (retryCount: number, error: HttpError) => number
}

export type HttpClientDefaults = {
  baseURL?: string
  headers: HttpHeaders
  timeout?: number
  withCredentials?: boolean
  signal?: AbortSignal
  debug?: boolean
}

type HttpClientConfig = {
  apiUrl: string
  headers: HttpHeaders
  withCredentials: boolean
  timeout: number
  debug: boolean
}

export const createHttpClient = (config: HttpClientConfig): HttpClient =>
  new HttpClient({
    baseURL: config.apiUrl,
    headers: config.headers,
    withCredentials: config.withCredentials,
    timeout: config.timeout,
    debug: config.debug,
  })

export class HttpClient {
  public defaults: HttpClientDefaults
  public retry?: RetryConfig

  public constructor(defaults: Partial<HttpClientDefaults> = {}) {
    this.defaults = { headers: {}, ...defaults }
  }

  public async request<T = any, D = any>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>> {
    const retry = this.retry
    if (!retry?.retries) {
      return this._requestOnce<T, D>(config)
    }

    for (let attempt = 1; ; attempt++) {
      try {
        return await this._requestOnce<T, D>(config)
      } catch (thrown) {
        const aborted = config.signal?.aborted || this.defaults.signal?.aborted
        if (!isHttpError(thrown) || aborted || attempt > retry.retries) {
          throw thrown
        }
        const shouldRetry = await (retry.retryCondition ?? isNetworkOrIdempotentRequestError)(thrown)
        if (!shouldRetry) {
          throw thrown
        }
        const delay = retry.retryDelay?.(attempt, thrown) ?? 0
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
  }

  public get<T = any>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'get', url })
  }

  public delete<T = any>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'delete', url })
  }

  public post<T = any, D = any>(url: string, data?: D, config: HttpRequestConfig<D> = {}): Promise<HttpResponse<T>> {
    return this.request<T, D>({ ...config, method: 'post', url, data })
  }

  public put<T = any, D = any>(url: string, data?: D, config: HttpRequestConfig<D> = {}): Promise<HttpResponse<T>> {
    return this.request<T, D>({ ...config, method: 'put', url, data })
  }

  private async _requestOnce<T, D>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>> {
    const method = (config.method ?? 'get').toUpperCase()
    const url = buildUrl(config.baseURL ?? this.defaults.baseURL, config.url ?? '')
    const resolvedConfig: HttpRequestConfig = { ...config, method, url }

    const headers = new Headers()
    appendHeaders(headers, this.defaults.headers)
    appendHeaders(headers, config.headers)

    let body: BodyInit | undefined
    if (config.data !== undefined && config.data !== null) {
      if (isRawBody(config.data)) {
        body = config.data
      } else {
        body = JSON.stringify(config.data)
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json')
        }
      }
    }

    const timeout = config.timeout ?? this.defaults.timeout
    const signals: AbortSignal[] = []
    if (config.signal) {
      signals.push(config.signal)
    }
    if (this.defaults.signal) {
      signals.push(this.defaults.signal)
    }

    let timedOut = false
    let timer: ReturnType<typeof setTimeout> | undefined
    if (timeout && timeout > 0 && Number.isFinite(timeout)) {
      const timeoutController = new AbortController()
      timer = setTimeout(() => {
        timedOut = true
        timeoutController.abort()
      }, timeout)
      signals.push(timeoutController.signal)
    }

    const debug = this.defaults.debug ?? false
    const requestId = debug ? randomUUID() : undefined
    const startTime = Date.now()
    if (debug) {
      console.debug(formatRequestLog(resolvedConfig, headers, requestId))
    }

    const toHttpError = (thrown: unknown): HttpError => {
      if (timedOut) {
        return new HttpError(`timeout of ${timeout}ms exceeded`, resolvedConfig, 'ECONNABORTED', undefined, thrown)
      }
      if (config.signal?.aborted || this.defaults.signal?.aborted) {
        return new HttpError('canceled', resolvedConfig, 'ERR_CANCELED', undefined, thrown)
      }
      const cause = (thrown as Error)?.cause as { code?: string } | undefined
      const message = (thrown as Error)?.message ?? 'Network Error'
      return new HttpError(message, resolvedConfig, cause?.code ?? 'ERR_NETWORK', undefined, thrown)
    }

    // the timeout covers the whole request including reading the response body;
    // for streams it covers up to the response headers, after which the
    // caller's signal governs the (potentially long-lived) body
    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: combineSignals(signals),
        credentials: (config.withCredentials ?? this.defaults.withCredentials) ? 'include' : undefined,
      })

      const responseHeaders: HttpResponseHeaders = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let data: any
      const responseType = config.responseType ?? 'json'
      if (!res.ok || responseType === 'json' || responseType === 'text') {
        const text = await res.text()
        data = !res.ok || responseType === 'json' ? tryParseJson(text) : text
      } else if (responseType === 'arraybuffer') {
        data = await res.arrayBuffer()
      } else {
        data = res.body ? streamBody(res.body) : undefined
      }

      const response: HttpResponse<T> = {
        data,
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        config: resolvedConfig,
      }

      if (debug) {
        console.debug(formatResponseLog(response, requestId, startTime))
      }

      if (!res.ok) {
        throw new HttpError(`Request failed with status code ${res.status}`, resolvedConfig, undefined, response)
      }

      return response
    } catch (thrown) {
      const error = isHttpError(thrown) ? thrown : toHttpError(thrown)
      if (debug && !error.response) {
        console.debug(formatErrorLog(error, requestId, startTime))
      }
      throw error
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
    }
  }
}

const buildUrl = (baseURL: string | undefined, url: string): string => {
  if (!baseURL || /^https?:\/\//i.test(url)) {
    return url
  }
  if (!url) {
    return baseURL
  }
  return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

const appendHeaders = (target: Headers, headers: HttpHeaders | undefined): void => {
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value === undefined) {
      target.delete(key) // an explicit undefined removes a default header
      continue
    }
    if (Array.isArray(value)) {
      target.delete(key)
      for (const item of value) {
        target.append(key, item)
      }
    } else {
      target.set(key, value)
    }
  }
}

const isRawBody = (data: unknown): data is BodyInit =>
  typeof data === 'string' ||
  data instanceof Uint8Array ||
  data instanceof ArrayBuffer ||
  (typeof Blob !== 'undefined' && data instanceof Blob) ||
  (typeof FormData !== 'undefined' && data instanceof FormData) ||
  (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams)

const tryParseJson = (text: string): any => {
  if (!text) {
    return undefined
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const combineSignals = (signals: AbortSignal[]): AbortSignal | undefined => {
  if (signals.length === 0) {
    return undefined
  }
  if (signals.length === 1) {
    return signals[0]
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(signals)
  }
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

async function* streamBody(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array, void, unknown> {
  const reader = body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      if (value) {
        yield value
      }
    }
  } finally {
    reader.releaseLock()
  }
}

const formatRequestLog = (config: HttpRequestConfig, headers: Headers, requestId: string | undefined): string => {
  const headerRecord: HttpResponseHeaders = {}
  headers.forEach((value, key) => {
    headerRecord[key] = value
  })
  return (
    'REQUEST: ' +
    JSON.stringify({
      method: config.method?.toUpperCase(),
      url: config.url,
      timestamp: new Date().toISOString(),
      requestId,
      headers: headerRecord,
      body: config.data,
    }) +
    '\n'
  )
}

const formatResponseLog = (response: HttpResponse, requestId: string | undefined, startTime: number): string =>
  'RESPONSE: ' +
  JSON.stringify({
    method: response.config.method?.toUpperCase(),
    status: response.status,
    url: response.config.url,
    timestamp: new Date().toISOString(),
    requestId,
    duration: `${Date.now() - startTime}ms`,
    headers: response.headers,
    body: response.data,
  }) +
  '\n'

const formatErrorLog = (error: HttpError, requestId: string | undefined, startTime: number): string =>
  'ERROR: ' +
  JSON.stringify({
    status: error.code,
    url: error.config.url,
    timestamp: new Date().toISOString(),
    requestId: requestId ?? 'N/A',
    duration: `${Date.now() - startTime}ms`,
  })
