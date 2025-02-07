import { backOff } from 'exponential-backoff'
import { createNanoEvents, Unsubscribe } from 'nanoevents'

import { ExtendedClient, getExtendedClient } from './bp-client'
import { getActionFromError } from './errors'
import { InterceptorManager } from './interceptors'
import { GenerateContentOutput } from './llm'
import {
  DOWNTIME_THRESHOLD_MINUTES,
  getBestModels,
  getFastModels,
  ModelPreferences,
  ModelProvider,
  ModelRef,
  pickModel,
  RemoteModelProvider,
} from './models'
import { CognitiveProps, Events, InputProps, Request, Response } from './types'

export class Cognitive {
  public interceptors = {
    request: new InterceptorManager<Request>(),
    response: new InterceptorManager<Response>(),
  }

  private _client: ExtendedClient
  private _preferences: ModelPreferences | null = null
  private _provider: ModelProvider
  private _events = createNanoEvents<Events>()
  private _downtimes: ModelPreferences['downtimes'] = []

  public constructor(props: CognitiveProps) {
    this._client = getExtendedClient(props.client)
    this._provider = props.provider ?? new RemoteModelProvider(props.client)

    // debug('new cognitive client instance created')
  }

  public on<K extends keyof Events>(this: this, event: K, cb: Events[K]): Unsubscribe {
    return this._events.on(event, cb)
  }

  public async fetchPreferences(): Promise<ModelPreferences> {
    if (this._preferences) {
      return this._preferences
    }

    this._preferences = await this._provider.fetchModelPreferences()

    if (this._preferences) {
      return this._preferences
    }

    const models = await this._provider.fetchInstalledModels()

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

  public async generateContent(input: InputProps): Promise<Response> {
    const start = Date.now()

    const signal = input.signal ?? AbortSignal.timeout(30_000)

    const client = this._client.abortable(signal)

    let props: Request = { input }
    let integration: string
    let model: string

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
            return false
          }

          if (_attempt > 3) {
            // We don't want to retry more than 3 times
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
