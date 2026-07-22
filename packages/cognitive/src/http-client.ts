/**
 * Minimal fetch-based http client, just enough surface for the cognitive api.
 * Replaces axios so the package has no http client dependency.
 */

export type HttpErrorResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
}

export class HttpError extends Error {
  public readonly isHttpError = true

  public constructor(
    message: string,
    public readonly code?: string,
    public readonly response?: HttpErrorResponse,
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

type RequestOptions = {
  headers?: Record<string, string | string[] | undefined>
  params?: Record<string, string | undefined>
  signal?: AbortSignal
  timeout?: number
  responseType?: 'json' | 'stream'
}

type HttpResponse<T> = {
  data: T
  status: number
  headers: Record<string, string>
}

type HttpClientConfig = {
  baseURL: string
  headers?: Record<string, string | string[]>
  withCredentials?: boolean
}

export class HttpClient {
  public defaults: { signal?: AbortSignal } = {}

  public constructor(private _config: HttpClientConfig) {}

  public get<T = any>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this._request<T>('GET', url, undefined, options)
  }

  public post<T = any>(url: string, data?: unknown, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this._request<T>('POST', url, data, options)
  }

  private async _request<T>(
    method: string,
    url: string,
    data: unknown,
    options: RequestOptions
  ): Promise<HttpResponse<T>> {
    const fullUrl = this._buildUrl(url, options.params)

    const headers = new Headers()
    appendHeaders(headers, this._config.headers)
    appendHeaders(headers, options.headers)

    let body: string | undefined
    if (data !== undefined && data !== null) {
      body = JSON.stringify(data)
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json')
      }
    }

    const signals: AbortSignal[] = []
    if (options.signal) {
      signals.push(options.signal)
    }
    if (this.defaults.signal) {
      signals.push(this.defaults.signal)
    }

    let timedOut = false
    let timer: ReturnType<typeof setTimeout> | undefined
    if (options.timeout && options.timeout > 0 && Number.isFinite(options.timeout)) {
      const timeoutController = new AbortController()
      timer = setTimeout(() => {
        timedOut = true
        timeoutController.abort()
      }, options.timeout)
      signals.push(timeoutController.signal)
    }

    const toHttpError = (thrown: unknown): HttpError => {
      if (timedOut) {
        return new HttpError(`timeout of ${options.timeout}ms exceeded`, 'ECONNABORTED', undefined, thrown)
      }
      if (options.signal?.aborted || this.defaults.signal?.aborted) {
        return new HttpError('canceled', 'ERR_CANCELED', undefined, thrown)
      }
      const cause = (thrown as Error)?.cause as { code?: string } | undefined
      return new HttpError(
        (thrown as Error)?.message ?? 'Network Error',
        cause?.code ?? 'ERR_NETWORK',
        undefined,
        thrown
      )
    }

    // the timeout covers the whole request including reading the response body;
    // for streams it covers up to the response headers, after which the
    // caller's signal governs the (potentially long-lived) body
    try {
      const res = await fetch(fullUrl, {
        method,
        headers,
        body,
        signal: combineSignals(signals),
        credentials: this._config.withCredentials ? 'include' : undefined,
      })

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new HttpError(`HTTP ${res.status}: ${text || res.statusText}`, undefined, {
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          data: tryParseJson(text),
        })
      }

      let responseData: any
      if (options.responseType === 'stream') {
        responseData = res.body ? streamBody(res.body) : undefined
      } else {
        responseData = tryParseJson(await res.text())
      }

      return { data: responseData as T, status: res.status, headers: responseHeaders }
    } catch (thrown) {
      throw isHttpError(thrown) ? thrown : toHttpError(thrown)
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
    }
  }

  private _buildUrl(url: string, params: Record<string, string | undefined> | undefined): string {
    const base = /^https?:\/\//i.test(url)
      ? url
      : `${this._config.baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`

    const query = Object.entries(params ?? {})
      .filter((pair): pair is [string, string] => pair[1] !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    return query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base
  }
}

const appendHeaders = (target: Headers, headers: Record<string, string | string[] | undefined> | undefined): void => {
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value === undefined) {
      target.delete(key)
    } else if (Array.isArray(value)) {
      target.delete(key)
      for (const item of value) {
        target.append(key, item)
      }
    } else {
      target.set(key, value)
    }
  }
}

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
  if (signals.length <= 1) {
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
