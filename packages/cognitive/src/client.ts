import { backOff } from 'exponential-backoff'
import { createNanoEvents } from 'nanoevents'

import { ExtendedClient, getExtendedClient } from './bp-client'
import { CognitiveBeta, getCognitiveV2Model, isKnownV2Model } from './cognitive-v2'

import { getActionFromError } from './errors'
import { InterceptorManager } from './interceptors'
import {
  DOWNTIME_THRESHOLD_MINUTES,
  getBestModels,
  getFastModels,
  Model,
  ModelPreferences,
  ModelProvider,
  ModelRef,
  pickModel,
  RemoteModelProvider,
} from './models'
import { GenerateContentOutput } from './schemas.gen'
import { CognitiveProps, Events, CognitiveLike, InputProps, Request, Response } from './types'

export class Cognitive implements CognitiveLike {
  public ['$$IS_COGNITIVE'] = true

  public static isCognitiveClient(obj: any): obj is Cognitive {
    return obj?.$$IS_COGNITIVE === true
  }

  public interceptors = {
    request: new InterceptorManager<Request>(),
    response: new InterceptorManager<Response>(),
  }

  protected _models: Model[] = []
  protected _timeoutMs: number = 5 * 60 * 1000 // Default timeout of 5 minutes
  protected _maxRetries: number = 5 // Default max retries
  protected _client: ExtendedClient
  protected _preferences: ModelPreferences | null = null
  protected _provider: ModelProvider
  protected _downtimes: ModelPreferences['downtimes'] = []
  protected _useBeta: boolean = false
  protected _debug = false
  private _remoteModelCache = new Map<string, Model>()
  private _remoteModelCacheTime = 0
  private _remoteModelCachePending: Promise<Map<string, Model>> | null = null

  private _events = createNanoEvents<Events>()

  public constructor(props: CognitiveProps) {
    this._client = getExtendedClient(props.client)
    this._provider = props.provider ?? new RemoteModelProvider(props.client)
    this._timeoutMs = props.timeout ?? this._timeoutMs
    this._maxRetries = props.maxRetries ?? this._maxRetries
    this._useBeta = props.__experimental_beta ?? false
  }

  public get client(): ExtendedClient {
    return this._client
  }

  public clone(): Cognitive {
    const copy = new Cognitive({
      client: this._client.clone(),
      provider: this._provider,
      timeout: this._timeoutMs,
      maxRetries: this._maxRetries,
      __debug: this._debug,
      __experimental_beta: this._useBeta,
    })

    copy._models = [...this._models]
    copy._preferences = this._preferences ? { ...this._preferences } : null
    copy._downtimes = [...this._downtimes]
    copy._remoteModelCache = new Map(this._remoteModelCache)
    copy._remoteModelCacheTime = this._remoteModelCacheTime
    copy._remoteModelCachePending = null

    copy.interceptors.request = this.interceptors.request
    copy.interceptors.response = this.interceptors.response

    return copy
  }

  public on<K extends keyof Events>(this: this, event: K, cb: Events[K]): { (): void } {
    return this._events.on(event, cb)
  }

  public async fetchInstalledModels(): Promise<Model[]> {
    if (!this._models.length) {
      this._models = await this._provider.fetchInstalledModels()
    }

    return this._models
  }

  public async fetchPreferences(): Promise<ModelPreferences> {
    if (this._preferences) {
      return this._preferences
    }

    this._preferences = await this._provider.fetchModelPreferences()

    if (this._preferences) {
      return this._preferences
    }

    const models = await this.fetchInstalledModels()

    this._preferences = {
      best: getBestModels(models).map((m) => m.ref),
      fast: getFastModels(models).map((m) => m.ref),
      downtimes: [],
    }

    await this._provider.saveModelPreferences(this._preferences)

    return this._preferences
  }

  public async setPreferences(preferences: ModelPreferences, save: boolean = false): Promise<void> {
    this._preferences = preferences

    if (save) {
      await this._provider.saveModelPreferences(preferences)
    }
  }

  private _cleanupOldDowntimes(): void {
    const now = Date.now()
    const thresholdMs = 1000 * 60 * DOWNTIME_THRESHOLD_MINUTES

    this._preferences!.downtimes = this._preferences!.downtimes.filter((downtime) => {
      const downtimeStart = new Date(downtime.startedAt).getTime()
      return now - downtimeStart <= thresholdMs
    })
  }

  private async _selectModel(ref: string): Promise<{ integration: string; model: string }> {
    const parseRef = (ref: string) => {
      const parts = ref.split(':')
      return { integration: parts[0]!, model: parts.slice(1).join(':') }
    }

    const preferences = await this.fetchPreferences()

    preferences.best ??= []
    preferences.fast ??= []
    preferences.downtimes ??= []

    const downtimes = [...preferences.downtimes, ...(this._downtimes ?? [])]

    if (ref === 'best') {
      return parseRef(pickModel(preferences.best, downtimes))
    }

    if (ref === 'fast') {
      return parseRef(pickModel(preferences.fast, downtimes))
    }

    return parseRef(pickModel([ref as ModelRef, ...preferences.best, ...preferences.fast], downtimes))
  }

  public async fetchRemoteModels(): Promise<Map<string, Model>> {
    if (this._remoteModelCacheTime > 0 && Date.now() - this._remoteModelCacheTime < 60 * 60 * 1000) {
      return this._remoteModelCache
    }

    if (this._remoteModelCachePending !== null) {
      return this._remoteModelCachePending
    }

    this._remoteModelCachePending = this._doFetchRemoteModels().finally(() => {
      this._remoteModelCachePending = null
    })

    return this._remoteModelCachePending
  }

  private async _doFetchRemoteModels(): Promise<Map<string, Model>> {
    const betaClient = new CognitiveBeta(this._client.config)
    const remoteModels = await betaClient.listModels()

    this._remoteModelCache.clear()
    this._remoteModelCacheTime = Date.now()

    for (const m of remoteModels) {
      const converted: Model = { ...m, ref: m.id as ModelRef, integration: 'cognitive-v2' }
      this._remoteModelCache.set(m.id, converted)

      if (m.aliases) {
        for (const alias of m.aliases) {
          this._remoteModelCache.set(alias, converted)
        }
      }
    }

    return this._remoteModelCache
  }

  public async getModelDetails(model: string): Promise<Model> {
    if (this._useBeta) {
      const resolvedModel = getCognitiveV2Model(model)
      if (resolvedModel) {
        return { ...resolvedModel, ref: resolvedModel.id as ModelRef, integration: 'cognitive-v2' }
      }

      if (isKnownV2Model(model)) {
        try {
          const remoteModels = await this.fetchRemoteModels()
          const found = remoteModels.get(model)
          if (found) {
            return found
          }
        } catch {
          // v2 unavailable — fall through to integration path
        }
      }
    }

    await this.fetchInstalledModels()
    const { integration, model: modelName } = await this._selectModel(model)
    const def = this._models.find((m) => m.integration === integration && (m.name === modelName || m.id === modelName))
    if (!def) {
      throw new Error(`Model ${modelName} not found`)
    }

    return def
  }

  public async generateContent(input: InputProps): Promise<Response> {
    if (!this._useBeta || !isKnownV2Model(input.model)) {
      return this._generateContent(input)
    }

    try {
      return await this._generateContentV2(input)
    } catch (err) {
      if (input.signal?.aborted) {
        throw err
      }
      // v2 failed — fall back to integration path transparently
      return this._generateContent(input)
    }
  }

  private async _generateContentV2(input: InputProps): Promise<Response> {
    const v2Input = { ...input, messages: [...input.messages] }
    if (v2Input.systemPrompt) {
      // @ts-expect-error - system role is not supported in the integrations api, but is used in v2
      v2Input.messages.unshift({ role: 'system', content: v2Input.systemPrompt })
      delete v2Input.systemPrompt
    }

    const betaClient = new CognitiveBeta(this._client.config)
    const props: Request = { input }

    // Forward beta client events to main client events
    betaClient.on('request', () => {
      this._events.emit('request', props)
    })

    betaClient.on('error', (_req, error) => {
      this._events.emit('error', props, error)
    })

    betaClient.on('retry', (_req, error) => {
      this._events.emit('retry', props, error)
    })

    const response = await betaClient.generateText(v2Input as any, {
      signal: input.signal,
      timeout: this._timeoutMs,
    })

    const result: Response = {
      output: {
        id: 'beta-output',
        provider: response.metadata.provider,
        model: response.metadata.model!,
        choices: [
          {
            type: 'text',
            content: response.output,
            role: 'assistant',
            index: 0,
            stopReason: response.metadata.stopReason ?? 'stop',
          },
        ],
        usage: {
          inputTokens: response.metadata.usage.inputTokens,
          inputCost: 0,
          outputTokens: response.metadata.usage.outputTokens,
          outputCost: response.metadata.cost ?? 0,
        },
        botpress: {
          cost: response.metadata.cost ?? 0,
        },
      },
      meta: {
        cached: response.metadata.cached,
        model: { integration: response.metadata.provider, model: response.metadata.model! },
        latency: response.metadata.latency!,
        cost: {
          input: 0,
          output: response.metadata.cost || 0,
        },
        tokens: {
          input: response.metadata.usage.inputTokens,
          output: response.metadata.usage.outputTokens,
        },
      },
    }

    // Emit final response event with actual data
    this._events.emit('response', props, result)

    return result
  }

  private async _generateContent(input: InputProps): Promise<Response> {
    const start = Date.now()

    const signal = input.signal ?? AbortSignal.timeout(this._timeoutMs)

    const client = this._client.abortable(signal)

    let props: Request = { input }
    let integration: string
    let model: string

    this._events.emit('request', props)

    const { output, meta } = await backOff<{
      output: GenerateContentOutput
      meta: any
    }>(
      async () => {
        const selection = await this._selectModel(input.model ?? 'best')

        integration = selection.integration
        model = selection.model

        props = await this.interceptors.request.run({ input }, signal)

        return client.callAction({
          type: `${integration}:generateContent`,
          input: {
            ...props.input,
            model: { id: model },
          },
        }) as Promise<{ output: GenerateContentOutput; meta: any }>
      },
      {
        retry: async (err, _attempt) => {
          if (signal?.aborted) {
            // We don't want to retry if the request was aborted
            this._events.emit('aborted', props, err)
            signal.throwIfAborted()
            return false
          }

          if (_attempt > this._maxRetries) {
            this._events.emit('error', props, err)
            return false
          }

          const action = getActionFromError(err)

          if (action === 'abort') {
            this._events.emit('error', props, err)
            return false
          }

          if (action === 'fallback') {
            // We don't want to retry if the request was already retried with a fallback model
            this._downtimes.push({
              ref: `${integration!}:${model!}`,
              startedAt: new Date().toISOString(),
              reason: 'Model is down',
            })

            this._cleanupOldDowntimes()

            await this._provider.saveModelPreferences({
              ...(this._preferences ?? { best: [], downtimes: [], fast: [] }),
              downtimes: [...(this._preferences!.downtimes ?? []), ...(this._downtimes ?? [])],
            })

            this._events.emit('fallback', props, err)
            return true
          }

          this._events.emit('retry', props, err)
          return true
        },
      }
    )

    const response = {
      output,
      meta: {
        cached: meta.cached ?? false,
        model: { integration: integration!, model: model! },
        latency: Date.now() - start,
        cost: { input: output.usage.inputCost, output: output.usage.outputCost },
        tokens: { input: output.usage.inputTokens, output: output.usage.outputTokens },
      },
    } satisfies Response

    this._events.emit('response', props, response)

    return this.interceptors.response.run(response, signal)
  }
}
