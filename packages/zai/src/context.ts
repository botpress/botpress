import {
  Cognitive,
  Model,
  CognitiveMetadata,
  CognitiveRequest,
  CognitiveResponse,
  ClassifyRequest,
  ClassifyResponse,
} from '@botpress/cognitive'
import { Adapter, type GetExamplesProps } from './adapters/adapter'
import { EventEmitter } from './emitter'
import { type ClassifierOption, type Priority, DEFAULT_CLASSIFIER, DEFAULT_PRIORITY } from './operations/classifier'
import { fastHash } from './utils'
import type { Memoizer, ZaiMetadata } from './zai'

/** Per-request accounting in the shape zai has always tracked it. */
type Meta = {
  cached: boolean
  model: { integration: string; model: string }
  latency: number
  cost: { input: number; output: number }
  tokens: { input: number; output: number }
}

const toMeta = (metadata: CognitiveMetadata | undefined): Meta => ({
  cached: metadata?.cached ?? false,
  model: {
    integration: metadata?.provider ?? '',
    model: metadata?.model ?? '',
  },
  latency: metadata?.latency ?? 0,
  cost: {
    input: metadata?.usage?.inputCost ?? 0,
    output: metadata?.usage?.outputCost ?? 0,
  },
  tokens: {
    input: metadata?.usage?.inputTokens ?? 0,
    output: metadata?.usage?.outputTokens ?? 0,
  },
})

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}

type GenerateContentProps<T> = Omit<CognitiveRequest, 'model'> & {
  maxRetries?: number
  transform?: (text: string | undefined, response: CognitiveResponse) => T
  /**
   * Bump when `transform`'s output shape changes, so a memoizer never replays a result saved in the old shape
   * (part of the memo key only when set, so existing keys are unchanged)
   */
  memoVersion?: number
}

export type ZaiContextProps = {
  client: Cognitive
  taskType: string
  taskId: string
  modelId: string | string[]
  adapter?: Adapter
  source?: CognitiveRequest['meta']
  memoizer?: Memoizer
  metadata?: ZaiMetadata
  /** Reasoning effort applied to every LLM call of the operation (overrides the operation's own default) */
  reasoningEffort?: CognitiveRequest['reasoningEffort']
  /** Service tier of every LLM call of the operation (default: `fast` with priority `speed`, `standard` otherwise) */
  serviceTier?: 'fast' | 'standard'
  /** Cognitive classification API model(s) used by operations that support it */
  classifier?: ClassifierOption
  /** Speed/accuracy trade-off of operations that can use the classification API */
  priority?: Priority
}

/**
 * Usage statistics tracking tokens, cost, and request metrics for an operation.
 *
 * This type is returned via Response events and the `.result()` method, providing
 * real-time visibility into:
 * - Token consumption (input/output/total)
 * - Cost in USD (input/output/total)
 * - Request statistics (count, errors, cache hits, progress percentage)
 *
 * @example
 * ```typescript
 * const { usage } = await zai.extract(text, schema).result()
 *
 * console.log(usage.tokens.total)    // 1250
 * console.log(usage.cost.total)      // 0.0075 (USD)
 * console.log(usage.requests.cached) // 0
 * ```
 */
export type Usage = {
  /** Request statistics */
  requests: {
    /** Total number of requests initiated */
    requests: number
    /** Number of requests that failed with errors */
    errors: number
    /** Number of successful responses received */
    responses: number
    /** Number of responses served from cache (no tokens used) */
    cached: number
    /** Operation progress as a decimal (0.0 to 1.0) */
    percentage: number
  }
  /** Cost statistics in USD */
  cost: {
    /** Cost for input tokens */
    input: number
    /** Cost for output tokens */
    output: number
    /** Total cost (input + output) */
    total: number
  }
  /** Token usage statistics */
  tokens: {
    /** Input tokens consumed */
    input: number
    /** Output tokens generated */
    output: number
    /** Total tokens (input + output) */
    total: number
  }
}

type ContextEvents = {
  update: Usage
}

export class ZaiContext {
  private _startedAt = Date.now()

  private _inputCost = 0
  private _outputCost = 0
  private _inputTokens = 0
  private _outputTokens = 0
  private _totalCachedResponses = 0

  private _totalRequests = 0
  private _totalErrors = 0
  private _totalResponses = 0

  public taskId: string
  public taskType: string
  public modelId: CognitiveRequest['model']
  public adapter?: Adapter
  public source?: CognitiveRequest['meta']
  public metadata?: ZaiMetadata
  public reasoningEffort?: CognitiveRequest['reasoningEffort']
  public serviceTier: 'fast' | 'standard'
  public classifier?: ClassifierOption
  public priority: Priority

  private _eventEmitter: EventEmitter<ContextEvents>
  private _memoizer: Memoizer

  public controller: AbortController = new AbortController()
  private _client: Cognitive

  private static _noopMemoizer: Memoizer = { run: (_id, fn) => fn() }

  public constructor(props: ZaiContextProps) {
    this._client = props.client.clone()
    this.taskId = props.taskId
    this.modelId = props.modelId
    this.adapter = props.adapter
    this.source = props.source
    this.metadata = props.metadata
    this.taskType = props.taskType
    this.reasoningEffort = props.reasoningEffort
    this.priority = props.priority ?? DEFAULT_PRIORITY
    this.serviceTier = props.serviceTier ?? (this.priority === 'speed' ? 'fast' : 'standard')
    this.classifier = props.classifier ?? DEFAULT_CLASSIFIER
    this._memoizer = props.memoizer ?? ZaiContext._noopMemoizer
    this._eventEmitter = new EventEmitter<ContextEvents>()

    this._client.on('request', () => {
      this._totalRequests++
      this._eventEmitter.emit('update', this.usage)
    })

    this._client.on('response', (_req, res) => {
      this._totalResponses++

      const metadata = res?.metadata

      if (!metadata) {
        // nothing to account for
      } else if ('cached' in metadata && metadata.cached) {
        this._totalCachedResponses++
      } else if ('usage' in metadata && metadata.usage) {
        this._inputTokens += metadata.usage.inputTokens || 0
        this._outputTokens += metadata.usage.outputTokens || 0

        if ('inputCost' in metadata.usage) {
          this._inputCost += metadata.usage.inputCost || 0
          this._outputCost += metadata.usage.outputCost || 0
        } else if ('cost' in metadata && typeof metadata.cost === 'number') {
          // Classification responses only report a total cost
          this._inputCost += metadata.cost || 0
        }
      }

      this._eventEmitter.emit('update', this.usage)
    })

    this._client.on('error', () => {
      this._totalErrors++
      this._eventEmitter.emit('update', this.usage)
    })
  }

  /** The primary model id as a plain string (first entry when fallbacks are configured). */
  public get modelName(): string {
    const primary = Array.isArray(this.modelId) ? this.modelId[0] : this.modelId
    return primary ?? 'auto'
  }

  public async getModel(): Promise<Model> {
    // getModelDetails resolves a single model; for a fallback array we report
    // the primary entry's details. Fallbacks are honored at the request layer.
    const primary = (Array.isArray(this.modelId) ? this.modelId[0] : this.modelId) ?? 'auto'
    return this._client.getModelDetails(primary)
  }

  public on<K extends keyof ContextEvents>(type: K, listener: (event: ContextEvents[K]) => void) {
    this._eventEmitter.on(type, listener)
    return this
  }

  public clear() {
    this._eventEmitter.clear()
  }

  public async generateContent<Out = string>(
    props: GenerateContentProps<Out>
  ): Promise<{
    meta: Meta
    output: CognitiveResponse
    text: string | undefined
    extracted: Out
  }> {
    if (this.reasoningEffort) {
      props = { ...props, reasoningEffort: this.reasoningEffort }
    }
    const memoKey = `zai:memo:${this.taskType}:${this.taskId || 'default'}:${fastHash(
      JSON.stringify({
        model: this.modelId,
        s: props.systemPrompt,
        m: props.messages?.map((m) => [m.role, 'content' in m ? m.content : '']),
        st: props.stopSequences,
        mt: props.maxTokens,
        t: props.temperature,
        rf: props.responseFormat,
        re: props.reasoningEffort,
        ...(props.memoVersion ? { v: props.memoVersion } : {}),
      })
    )}`

    return this._memoizer.run(memoKey, () => this._generateContentInner(props))
  }

  private async _generateContentInner<Out = string>(
    props: GenerateContentProps<Out>
  ): Promise<{
    meta: Meta
    output: CognitiveResponse
    text: string | undefined
    extracted: Out
  }> {
    const maxRetries = Math.max(props.maxRetries ?? 3, 0)
    const { maxRetries: _mr, transform, memoVersion: _mv, ...request } = props
    let lastError: unknown = undefined
    const messages = [...(props.messages || [])]

    // Aborted before (or while) setting up the operation: surface the abort reason, never `null`
    this.controller.signal.throwIfAborted()

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      this.controller.signal.throwIfAborted()

      // Errors thrown by the request itself (auth, bad request, context too long, network…) are not
      // something the model can fix: Cognitive already retries transient failures, so rethrow as-is.
      const response = await this._client
        .generateText(
          {
            ...request,
            // The tier does not change the answer, so it stays out of the memo key
            ...(this.serviceTier === 'fast' ? { options: { serviceTier: 'fast' as const, ...request.options } } : {}),
            messages,
            model: this.modelId,
            meta: {
              integrationName: props.meta?.integrationName || 'zai',
              promptCategory: props.meta?.promptCategory || `zai:${this.taskType}`,
              promptSource: props.meta?.promptSource || `zai:${this.taskType}:${this.taskId ?? 'default'}`,
              metadata: props.meta?.metadata || this.metadata,
            },
          },
          { signal: this.controller.signal }
        )
        .catch((error: unknown) => {
          this.controller.signal.throwIfAborted()
          throw error
        })

      this.controller.signal.throwIfAborted()

      const str = response.output
      messages.push({
        role: 'assistant',
        content: str || '<Invalid output, no content provided>',
      })

      try {
        const output = transform ? transform(str, response) : (str as Out)
        return {
          meta: toMeta(response.metadata),
          output: response,
          text: str,
          extracted: output,
        }
      } catch (error: unknown) {
        this.controller.signal.throwIfAborted()

        // Only output problems (parsing/validation in `transform`) are retried, with the error fed back to the model
        lastError = error
        if (attempt === maxRetries) {
          break
        }

        messages.push({
          role: 'user',
          content: `ERROR PARSING OUTPUT\n\n${errorMessage(error)}.\n\nPlease return a valid response addressing the error above.`,
        })
      }
    }

    throw lastError ?? new Error('Failed to generate a valid response')
  }

  /** Calls the Cognitive classification API, memoized like generateContent and bound to the operation's abort signal */
  public async classify(request: Omit<ClassifyRequest, 'meta'>): Promise<ClassifyResponse> {
    const memoKey = `zai:memo:${this.taskType}:${this.taskId || 'default'}:classify:${fastHash(JSON.stringify(request))}`
    return this._memoizer.run(memoKey, async () => {
      this.controller.signal.throwIfAborted()
      const response = await this._client
        .classify(
          {
            ...request,
            meta: {
              integrationName: 'zai',
              promptCategory: `zai:${this.taskType}`,
              promptSource: `zai:${this.taskType}:${this.taskId ?? 'default'}`,
              metadata: this.metadata,
            },
          },
          { signal: this.controller.signal }
        )
        .catch((error: unknown) => {
          this.controller.signal.throwIfAborted()
          throw error
        })
      this.controller.signal.throwIfAborted()
      return response
    })
  }

  private _examples = new Map<string, Promise<unknown>>()

  /**
   * adapter.getExamples, deduplicated within the operation: the classifier's "are there learned examples?" probe
   * and the LLM path's lookup for the same input share one Tables query.
   */
  public getExamples<TInput, TOutput>(props: GetExamplesProps<TInput>) {
    if (!this.adapter) {
      throw new Error('No adapter configured')
    }
    const key = JSON.stringify([props.taskType, props.taskId, props.input])
    let pending = this._examples.get(key)
    if (pending === undefined) {
      // A failed lookup is not cached, so a later caller can retry it
      pending = this.adapter.getExamples<TInput, TOutput>(props).catch((error: unknown) => {
        this._examples.delete(key)
        throw error
      })
      this._examples.set(key, pending)
    }
    return pending as ReturnType<typeof this.adapter.getExamples<TInput, TOutput>>
  }

  /** Whether the operation may use the classification API (any priority but `accuracy`) */
  public get usesClassifier(): boolean {
    return this.priority !== 'accuracy'
  }

  public get elapsedTime(): number {
    return Date.now() - this._startedAt
  }

  public get usage(): Usage {
    return {
      requests: {
        errors: this._totalErrors,
        requests: this._totalRequests,
        responses: this._totalResponses,
        cached: this._totalCachedResponses,
        percentage: this._totalRequests > 0 ? (this._totalResponses + this._totalErrors) / this._totalRequests : 0,
      },
      tokens: {
        input: this._inputTokens,
        output: this._outputTokens,
        total: this._inputTokens + this._outputTokens,
      },
      cost: {
        input: this._inputCost,
        output: this._outputCost,
        total: this._inputCost + this._outputCost,
      },
    }
  }
}
