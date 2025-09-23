import axios, { AxiosInstance } from 'axios'
import { backOff } from 'exponential-backoff'
import { Readable } from 'stream'
import { StringDecoder } from 'string_decoder'
import { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk } from './models'

export { CognitiveRequest, CognitiveResponse }

type ClientProps = {
  baseUrl?: string
  timeout?: number
  botId?: string
  token?: string
}

type RequestOptions = {
  signal?: AbortSignal
  timeout?: number
}

export class CognitiveBeta {
  private _axiosClient: AxiosInstance
  private readonly _config: Required<ClientProps>

  public constructor(props: ClientProps) {
    this._config = {
      baseUrl: props.baseUrl || 'https://cognitive.botpress.dev',
      timeout: props.timeout || 60_001,
      token: props.token || '',
      botId: props.botId || '',
    }

    this._axiosClient = axios.create({
      headers: {
        Authorization: `Bearer ${this._config.token}`,
        'X-Bot-Id': this._config.botId,
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

  public async *generateTextStream(
    request: CognitiveRequest,
    options: RequestOptions = {}
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const signal = options.signal ?? AbortSignal.timeout(this._config.timeout)

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

    const stream = res.data as Readable
    if (!stream) {
      throw new Error('No response body received for streaming request')
    }

    for await (const obj of CognitiveBeta._ndjson<CognitiveStreamChunk>(stream)) {
      yield obj
    }
  }

  private static async *_ndjson<T>(stream: Readable): AsyncGenerator<T, void, unknown> {
    const decoder = new StringDecoder('utf8')
    let buffer = ''

    for await (const chunk of stream) {
      buffer += decoder.write(chunk as Buffer)

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

    buffer += decoder.end()

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
