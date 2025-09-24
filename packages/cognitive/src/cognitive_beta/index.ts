import axios, { AxiosInstance } from 'axios'
import { backOff } from 'exponential-backoff'
import { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk, Model } from './models'

export { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk }

type ClientProps = {
  baseUrl?: string
  timeout?: number
  botId?: string
  token?: string
  headers?: Record<string, string>
}

type RequestOptions = {
  signal?: AbortSignal
  timeout?: number
}

const isBrowser = () => typeof window !== 'undefined' && typeof window.fetch === 'function'

export class CognitiveBeta {
  private _axiosClient: AxiosInstance
  private readonly _config: Required<ClientProps>

  public constructor(props: ClientProps) {
    this._config = {
      baseUrl: props.baseUrl || 'https://cognitive.botpress.cloud',
      timeout: props.timeout || 60_001,
      token: props.token || '',
      botId: props.botId || '',
      headers: props.headers || {},
    }

    this._axiosClient = axios.create({
      headers: {
        Authorization: `Bearer ${this._config.token}`,
        'X-Bot-Id': this._config.botId,
        ...this._config.headers,
      },
      baseURL: this._config.baseUrl,
    })
  }

  public async generateText(input: CognitiveRequest, options: RequestOptions = {}) {
    const signal = options.signal ?? AbortSignal.timeout(this._config.timeout)

    const { data } = await this._withServerRetry(() =>
      this._axiosClient.post<CognitiveResponse>('/v1/generate-text', input, {
        signal,
        timeout: options.timeout ?? this._config.timeout,
      })
    )

    return data
  }

  public async listModels(input: void, options: RequestOptions = {}) {
    const signal = options.signal ?? AbortSignal.timeout(this._config.timeout)

    const { data } = await this._withServerRetry(() =>
      this._axiosClient.post<Model[]>('/v1/models', input, {
        signal,
        timeout: options.timeout ?? this._config.timeout,
      })
    )

    return data
  }

  public async *generateTextStream(
    request: CognitiveRequest,
    options: RequestOptions = {}
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const signal = options.signal ?? AbortSignal.timeout(this._config.timeout)

    if (isBrowser()) {
      const res = await fetch(`${this._config.baseUrl}/v1/generate-text-stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this._config.token}`,
          'X-Bot-Id': this._config.botId,
          'Content-Type': 'application/json',
        },
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
        yield obj
      }
      return
    }

    const res = await this._withServerRetry(() =>
      this._axiosClient.post(
        '/v1/generate-text-stream',
        { ...request, stream: true },
        {
          responseType: 'stream',
          signal,
          timeout: options.timeout ?? this._config.timeout,
        }
      )
    )

    const nodeStream: AsyncIterable<Uint8Array> = res.data as any
    if (!nodeStream) {
      throw new Error('No response body received for streaming request')
    }

    for await (const obj of this._ndjson<CognitiveStreamChunk>(nodeStream)) {
      yield obj
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

  private async _withServerRetry<T>(fn: () => Promise<T>): Promise<T> {
    return backOff(fn, {
      numOfAttempts: 3,
      startingDelay: 300,
      timeMultiple: 2,
      jitter: 'full',
      retry: (e) => this._isRetryableServerError(e),
    })
  }
}
