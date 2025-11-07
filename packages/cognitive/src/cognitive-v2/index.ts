import axios, { AxiosInstance } from 'axios'
import { backOff } from 'exponential-backoff'
import { createNanoEvents, Unsubscribe } from 'nanoevents'
import { defaultModel, models } from './models'
import { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk, Model } from './types'

export { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk }

export type BetaEvents = {
  request: (req: { input: CognitiveRequest }) => void
  response: (req: { input: CognitiveRequest }, res: CognitiveResponse) => void
  error: (req: { input: CognitiveRequest }, error: any) => void
  retry: (req: { input: CognitiveRequest }, error: any) => void
}

type ClientProps = {
  apiUrl?: string
  timeout?: number
  botId?: string
  token?: string
  withCredentials?: boolean
  debug?: boolean
  headers?: Record<string, string | string[]>
}

type RequestOptions = {
  signal?: AbortSignal
  timeout?: number
}

const isBrowser = () => typeof window !== 'undefined' && typeof window.fetch === 'function'

export { Models } from './types'

export class CognitiveBeta {
  private _axiosClient: AxiosInstance
  private readonly _apiUrl: string
  private readonly _timeout: number
  private readonly _withCredentials: boolean
  private readonly _headers: Record<string, string | string[]>
  private readonly _debug: boolean = false
  private _events = createNanoEvents<BetaEvents>()

  public constructor(props: ClientProps) {
    this._apiUrl = props.apiUrl || 'https://api.botpress.cloud'
    this._timeout = props.timeout || 60_001
    this._withCredentials = props.withCredentials || false
    this._headers = { ...props.headers }

    if (props.botId) {
      this._headers['X-Bot-Id'] = props.botId
    }

    if (props.token) {
      this._headers['Authorization'] = `Bearer ${props.token}`
    }

    if (props.debug) {
      this._debug = true
      this._headers['X-Debug'] = '1'
    }

    this._axiosClient = axios.create({
      headers: this._headers,
      withCredentials: this._withCredentials,
      baseURL: this._apiUrl,
    })
  }

  public clone(): CognitiveBeta {
    return new CognitiveBeta({
      apiUrl: this._apiUrl,
      timeout: this._timeout,
      withCredentials: this._withCredentials,
      headers: this._headers,
      debug: this._debug,
    })
  }

  public on<K extends keyof BetaEvents>(event: K, cb: BetaEvents[K]): Unsubscribe {
    return this._events.on(event, cb)
  }

  public async generateText(input: CognitiveRequest, options: RequestOptions = {}) {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req = { input }

    this._events.emit('request', req)

    try {
      const { data } = await this._withServerRetry(
        () =>
          this._axiosClient.post<CognitiveResponse>('/v2/cognitive/generate-text', input, {
            signal,
            timeout: options.timeout ?? this._timeout,
          }),
        options,
        req
      )

      this._events.emit('response', req, data)
      return data
    } catch (error) {
      this._events.emit('error', req, error)
      throw error
    }
  }

  public async listModels() {
    const { data } = await this._withServerRetry(() =>
      this._axiosClient.get<{ models: Model[] }>('/v2/cognitive/models')
    )

    return data.models
  }

  public async *generateTextStream(
    request: CognitiveRequest,
    options: RequestOptions = {}
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req = { input: request }
    const chunks: CognitiveStreamChunk[] = []
    let lastChunk: CognitiveStreamChunk | undefined

    this._events.emit('request', req)

    try {
      if (isBrowser()) {
        const res = await fetch(`${this._apiUrl}/v2/cognitive/generate-text-stream`, {
          method: 'POST',
          headers: {
            ...this._headers,
            'Content-Type': 'application/json',
          },
          credentials: this._withCredentials ? 'include' : 'omit',
          body: JSON.stringify({ ...request, stream: true }),
          signal,
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`)
          ;(err as any).response = { status: res.status, data: text }
          throw err
        }

        const body = res.body
        if (!body) {
          throw new Error('No response body received for streaming request')
        }

        const reader = body.getReader()
        const iterable = (async function* () {
          for (;;) {
            const { value, done } = await reader.read()
            if (done) {
              break
            }
            if (value) {
              yield value
            }
          }
        })()

        for await (const obj of this._ndjson<CognitiveStreamChunk>(iterable)) {
          chunks.push(obj)
          lastChunk = obj
          yield obj
        }

        // Emit response event with the final chunk metadata
        if (lastChunk?.metadata) {
          this._events.emit('response', req, {
            output: chunks.map((c) => c.output || '').join(''),
            metadata: lastChunk.metadata,
          })
        }
        return
      }

      const res = await this._withServerRetry(
        () =>
          this._axiosClient.post(
            '/v2/cognitive/generate-text-stream',
            { ...request, stream: true },
            {
              responseType: 'stream',
              signal,
              timeout: options.timeout ?? this._timeout,
            }
          ),
        options,
        req
      )

      const nodeStream: AsyncIterable<Uint8Array> = res.data as any
      if (!nodeStream) {
        throw new Error('No response body received for streaming request')
      }

      for await (const obj of this._ndjson<CognitiveStreamChunk>(nodeStream)) {
        chunks.push(obj)
        lastChunk = obj
        yield obj
      }

      // Emit response event with the final chunk metadata
      if (lastChunk?.metadata) {
        this._events.emit('response', req, {
          output: chunks.map((c) => c.output || '').join(''),
          metadata: lastChunk.metadata,
        })
      }
    } catch (error) {
      this._events.emit('error', req, error)
      throw error
    }
  }

  private async *_ndjson<T>(stream: AsyncIterable<Uint8Array>): AsyncGenerator<T, void, unknown> {
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    for await (const chunk of stream) {
      buffer += decoder.decode(chunk, { stream: true })

      for (;;) {
        const i = buffer.indexOf('\n')
        if (i < 0) {
          break
        }

        const line = buffer.slice(0, i).replace(/\r$/, '')
        buffer = buffer.slice(i + 1)

        if (!line) {
          continue
        }

        yield JSON.parse(line) as T
      }
    }

    buffer += decoder.decode()

    const tail = buffer.trim()
    if (tail) {
      yield JSON.parse(tail) as T
    }
  }

  private _isRetryableServerError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return true
      }

      const status = error.response?.status
      if (status && [502, 503, 504].includes(status)) {
        return true
      }

      if (
        error.code &&
        ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE'].includes(error.code)
      ) {
        return true
      }
    }

    return false
  }

  private async _withServerRetry<T>(
    fn: () => Promise<T>,
    options: RequestOptions = {},
    req?: { input: CognitiveRequest }
  ): Promise<T> {
    let attemptCount = 0
    return backOff(
      async () => {
        try {
          const result = await fn()
          attemptCount = 0
          return result
        } catch (error) {
          if (attemptCount > 0 && req) {
            this._events.emit('retry', req, error)
          }
          attemptCount++
          throw error
        }
      },
      {
        numOfAttempts: 3,
        startingDelay: 300,
        timeMultiple: 2,
        jitter: 'full',
        retry: (e) => !options.signal?.aborted && this._isRetryableServerError(e),
      }
    )
  }
}

export const getCognitiveV2Model = (model: string): Model | undefined => {
  if (models[model]) {
    return models[model]
  }

  const [_provider, baseModel] = model.split(':')

  // Some models (ex fireworks) have a long name (the internal id) so it is now an alias instead of the main id
  const alias = Object.values(models).find((x) =>
    x.aliases ? x.aliases.includes(model) || (baseModel && x.aliases.includes(baseModel)) : false
  )

  if (alias) {
    return alias
  }

  // Special tags like auto, fast dont have explicit limits so we give a default model
  if (['auto', 'fast', 'best'].includes(model)) {
    return { ...defaultModel, id: model, name: model }
  }
  return undefined
}
