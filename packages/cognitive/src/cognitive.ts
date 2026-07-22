import { backOff } from 'exponential-backoff'
import { createNanoEvents, Unsubscribe } from 'nanoevents'
import { BotpressClientLike, extractClientConfig } from './bp-client'
import { HttpClient, isHttpError } from './http-client'
import { defaultModel, models } from './models'
import {
  CognitiveRequest,
  CognitiveResponse,
  CognitiveStreamChunk,
  TranscribeRequest,
  TranscribeResponse,
  TtsRequest,
  TtsResponse,
  TtsStreamChunk,
  TtsMetadata,
  ImageRequest,
  ImageResponse,
  ImageMetadata,
  Voice,
  Model,
} from './types'

export {
  CognitiveRequest,
  CognitiveResponse,
  CognitiveStreamChunk,
  TranscribeRequest,
  TranscribeResponse,
  TtsRequest,
  TtsResponse,
  TtsStreamChunk,
  TtsMetadata,
  ImageRequest,
  ImageResponse,
  ImageMetadata,
  Voice,
}

export type BetaTextRequest = { type: 'generateText'; input: CognitiveRequest }
export type BetaTranscribeRequest = { type: 'transcribeAudio'; input: TranscribeRequest }
export type BetaTtsRequest = { type: 'generateAudio'; input: TtsRequest }
export type BetaImageRequest = { type: 'generateImage'; input: ImageRequest }
export type BetaRequest = BetaTextRequest | BetaTranscribeRequest | BetaTtsRequest | BetaImageRequest

export type BetaEvents = {
  request: (req: BetaRequest) => void
  response: (req: BetaRequest, res: CognitiveResponse | TranscribeResponse | TtsResponse | ImageResponse) => void
  error: (req: BetaRequest, error: any) => void
  retry: (req: BetaRequest, error: any) => void
}

export type CognitiveProps = {
  apiUrl?: string
  timeout?: number
  botId?: string
  token?: string
  withCredentials?: boolean
  debug?: boolean
  headers?: Record<string, string | string[]>
  /**
   * A botpress client (`@botpress/client`, or anything wrapping one) to derive
   * the api url, auth headers and bot id from. Explicit props take precedence.
   */
  client?: BotpressClientLike | unknown
}

type RequestOptions = {
  signal?: AbortSignal
  timeout?: number
}

export { Models, SttModels } from './types'
export type {
  CommonRequestOptions,
  CognitiveContentPart,
  CognitiveMessage,
  CognitiveToolCall,
  CognitiveTool,
  CognitiveToolControl,
  CognitiveMetadata,
  TranscribeMetadata,
  StopReason,
  ModelTag,
} from './types'

export class Cognitive {
  /**
   * Nominal brand used by {@link Cognitive.isCognitiveClient}. We brand the
   * instance (rather than rely on `instanceof`) so the check survives across
   * duplicated/duelling copies of this package in a dependency tree or bundle.
   * The key is kept from the beta era so pre-1.0 `CognitiveBeta` instances are
   * still recognized.
   */
  public readonly ['$$IS_COGNITIVE_BETA'] = 'v2' as const

  /**
   * Brand-based type guard. Returns true for any `Cognitive` instance,
   * including ones created by a different copy of this package. Prefer this
   * over `instanceof Cognitive`, which is unreliable across bundles.
   */
  public static isCognitiveClient(obj: any): obj is Cognitive {
    return obj?.['$$IS_COGNITIVE_BETA'] === 'v2'
  }

  /** @deprecated Use {@link Cognitive.isCognitiveClient} */
  public static isBetaClient(obj: any): obj is Cognitive {
    return Cognitive.isCognitiveClient(obj)
  }

  /** The botpress client this instance was constructed from, if any */
  public readonly client?: BotpressClientLike

  private _httpClient: HttpClient
  private readonly _apiUrl: string
  private readonly _timeout: number
  private readonly _withCredentials: boolean
  private readonly _headers: Record<string, string | string[]>
  private readonly _debug: boolean = false
  private _events = createNanoEvents<BetaEvents>()
  private _remoteModels: Map<string, Model> | null = null

  public constructor(props: CognitiveProps = {}) {
    const clientConfig = props.client ? extractClientConfig(props.client) : undefined
    this.client = props.client as BotpressClientLike | undefined

    this._apiUrl = props.apiUrl || clientConfig?.apiUrl || 'https://api.botpress.cloud'
    this._timeout = props.timeout || clientConfig?.timeout || 60_001
    this._withCredentials = props.withCredentials ?? clientConfig?.withCredentials ?? false
    this._headers = { ...clientConfig?.headers, ...props.headers }

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

    this._httpClient = new HttpClient({
      headers: this._headers,
      withCredentials: this._withCredentials,
      baseURL: this._apiUrl,
    })
  }

  public clone(): Cognitive {
    return new Cognitive({
      client: this.client,
      apiUrl: this._apiUrl,
      timeout: this._timeout,
      withCredentials: this._withCredentials,
      headers: this._headers,
      debug: this._debug,
    })
  }

  /**
   * Resolves the details (context window sizes, costs, tags, lifecycle) of a
   * model id like `openai:gpt-4o` or a special selector (`auto`, `best`,
   * `fast`). Resolution order: the static model table shipped with this
   * package, then the live `/v2/cognitive/models` endpoint, then a permissive
   * default — this never throws; an invalid model surfaces its real error on
   * the generate call instead.
   */
  public async getModelDetails(model: string): Promise<Model> {
    const resolved = getCognitiveV2Model(model)
    if (resolved) {
      return resolved
    }

    try {
      const found = (await this._fetchRemoteModels()).get(model)
      if (found) {
        return found
      }
    } catch {
      // fall through to permissive default
    }

    return {
      id: model,
      name: model,
      description: '',
      tags: [],
      lifecycle: 'production',
      input: { maxTokens: 128_000, costPer1MTokens: 0 },
      output: { maxTokens: 8_192, costPer1MTokens: 0 },
    }
  }

  private async _fetchRemoteModels(): Promise<Map<string, Model>> {
    if (this._remoteModels) {
      return this._remoteModels
    }

    const list = await this.listModels()
    const map = new Map<string, Model>()
    for (const model of list) {
      map.set(model.id, model)
      for (const alias of model.aliases ?? []) {
        map.set(alias, model)
      }
    }

    this._remoteModels = map
    return map
  }

  public on<K extends keyof BetaEvents>(event: K, cb: BetaEvents[K]): Unsubscribe {
    return this._events.on(event, cb)
  }

  /**
   * `systemPrompt` is deprecated in favor of a leading system message; migrate
   * it automatically so both spellings produce the same request.
   */
  private _migrateSystemPrompt(input: CognitiveRequest): CognitiveRequest {
    if (!input.systemPrompt) {
      return input
    }
    const { systemPrompt, ...rest } = input
    return { ...rest, messages: [{ role: 'system', content: systemPrompt }, ...input.messages] }
  }

  public async generateText(input: CognitiveRequest, options: RequestOptions = {}) {
    input = this._migrateSystemPrompt(input)
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaTextRequest = { type: 'generateText', input }

    this._events.emit('request', req)

    try {
      const { data } = await this._withServerRetry(
        () =>
          this._httpClient.post<CognitiveResponse>('/v2/cognitive/generate-text', input, {
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
      this._httpClient.get<{ models: Model[] }>('/v2/cognitive/models', {
        timeout: this._timeout,
      })
    )

    return data.models
  }

  public async listVoices(filter: { model?: string; language?: string } = {}): Promise<Voice[]> {
    const { data } = await this._withServerRetry(() =>
      this._httpClient.get<{ voices: Voice[] }>('/v2/cognitive/voices', {
        params: filter,
        timeout: this._timeout,
      })
    )

    return data.voices
  }

  public async generateAudio(input: TtsRequest, options: RequestOptions = {}): Promise<TtsResponse> {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaTtsRequest = { type: 'generateAudio', input }

    this._events.emit('request', req)

    try {
      const { data } = await this._withServerRetry(
        () =>
          this._httpClient.post<TtsResponse>('/v2/cognitive/generate-audio', input, {
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

  public async generateImage(input: ImageRequest, options: RequestOptions = {}): Promise<ImageResponse> {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaImageRequest = { type: 'generateImage', input }

    this._events.emit('request', req)

    try {
      const { data } = await this._withServerRetry(
        () =>
          this._httpClient.post<ImageResponse>('/v2/cognitive/generate-image', input, {
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

  public async transcribeAudio(input: TranscribeRequest, options: RequestOptions = {}) {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaTranscribeRequest = { type: 'transcribeAudio', input }

    this._events.emit('request', req)

    try {
      const { data } = await this._withServerRetry(
        () =>
          this._httpClient.post<TranscribeResponse>('/v2/cognitive/transcribe-audio', input, {
            signal,
            timeout: options.timeout ?? this._timeout,
          }),
        options,
        req
      )

      if (data.error) {
        throw new Error(`Transcription error: ${data.error}`)
      }

      this._events.emit('response', req, data)
      return data
    } catch (error) {
      this._events.emit('error', req, error)
      throw error
    }
  }

  public async *generateTextStream(
    request: CognitiveRequest,
    options: RequestOptions = {}
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    request = this._migrateSystemPrompt(request)
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaTextRequest = { type: 'generateText', input: request }
    const chunks: CognitiveStreamChunk[] = []
    let lastChunk: CognitiveStreamChunk | undefined

    this._events.emit('request', req)

    try {
      const res = await this._withServerRetry(
        () =>
          this._httpClient.post(
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

      const stream: AsyncIterable<Uint8Array> = res.data as any
      if (!stream) {
        throw new Error('No response body received for streaming request')
      }

      for await (const obj of this._ndjson<CognitiveStreamChunk>(stream)) {
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

  public async *generateAudioStream(
    input: TtsRequest,
    options: RequestOptions = {}
  ): AsyncGenerator<TtsStreamChunk, void, unknown> {
    const signal = options.signal ?? AbortSignal.timeout(this._timeout)
    const req: BetaTtsRequest = { type: 'generateAudio', input }
    let finalChunk: Extract<TtsStreamChunk, { finished: true }> | undefined

    this._events.emit('request', req)

    try {
      const res = await this._withServerRetry(
        () =>
          this._httpClient.post('/v2/cognitive/generate-audio-stream', input, {
            responseType: 'stream',
            signal,
            timeout: options.timeout ?? this._timeout,
          }),
        options,
        req
      )

      const stream: AsyncIterable<Uint8Array> = res.data as any
      if (!stream) {
        throw new Error('No response body received for streaming request')
      }

      for await (const obj of this._ndjson<TtsStreamChunk>(stream)) {
        if (obj.finished) {
          finalChunk = obj
        }
        yield obj
      }

      if (finalChunk) {
        this._events.emit('response', req, {
          output: { audioUrl: finalChunk.audioUrl },
          metadata: finalChunk.metadata,
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
    if (isHttpError(error)) {
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

  private async _withServerRetry<T>(fn: () => Promise<T>, options: RequestOptions = {}, req?: BetaRequest): Promise<T> {
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

const COGNITIVE_V2_PROVIDERS = new Set([
  'openai',
  'anthropic',
  'google-ai',
  'groq',
  'cerebras',
  'fireworks-ai',
  'xai',
  'openrouter',
])

export const isKnownV2Model = (model: string | undefined): boolean => {
  if (!model || ['auto', 'best', 'fast'].includes(model)) {
    return true
  }

  const provider = model.split(':')[0]
  return !!provider && COGNITIVE_V2_PROVIDERS.has(provider)
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

/** @deprecated Use {@link Cognitive} — the beta client is now the one and only Cognitive */
export const CognitiveBeta = Cognitive
/** @deprecated Use {@link Cognitive} */
export type CognitiveBeta = Cognitive
