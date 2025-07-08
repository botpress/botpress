import { Cognitive, Model, GenerateContentInput } from '@botpress/cognitive'
import { Adapter } from './adapters/adapter'
import { EventEmitter } from './emitter'

export type ZaiContextProps = {
  client: Cognitive
  taskType: string
  taskId: string
  modelId: string
  adapter?: Adapter
  source?: GenerateContentInput['meta']
}

export type Usage = {
  requests: {
    requests: number
    errors: number
    responses: number
    cached: number
    percentage: number
  }
  cost: {
    input: number
    output: number
    total: number
  }
  tokens: {
    input: number
    output: number
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
  public modelId: GenerateContentInput['model']
  public adapter?: Adapter
  public source?: GenerateContentInput['meta']

  private _eventEmitter: EventEmitter<ContextEvents>

  public controller: AbortController = new AbortController()
  private _client: Cognitive

  public constructor(props: ZaiContextProps) {
    this._client = props.client.clone()
    this.taskId = props.taskId
    this.modelId = props.modelId
    this.adapter = props.adapter
    this.source = props.source
    this.taskType = props.taskType
    this._eventEmitter = new EventEmitter<ContextEvents>()

    this._client.on('request', () => {
      this._totalRequests++
      this._eventEmitter.emit('update', this.usage)
    })

    this._client.on('response', (_req, res) => {
      this._totalResponses++

      if (res.meta.cached) {
        this._totalCachedResponses++
      } else {
        this._inputTokens += res.meta.tokens.input || 0
        this._outputTokens += res.meta.tokens.output || 0
        this._inputCost += res.meta.cost.input || 0
        this._outputCost += res.meta.cost.output || 0
      }

      this._eventEmitter.emit('update', this.usage)
    })

    this._client.on('error', () => {
      this._totalErrors++
      this._eventEmitter.emit('update', this.usage)
    })
  }

  public async getModel(): Promise<Model> {
    return this._client.getModelDetails(this.modelId)
  }

  public on<K extends keyof ContextEvents>(type: K, listener: (event: ContextEvents[K]) => void) {
    this._eventEmitter.on(type, listener)
    return this
  }

  public clear() {
    this._eventEmitter.clear()
  }

  public async generateContent(props: Omit<GenerateContentInput, 'model' | 'signal'>) {
    return this._client.generateContent({
      ...props,
      signal: this.controller.signal,
      model: this.modelId,
      meta: {
        integrationName: props.meta?.integrationName || 'zai',
        promptCategory: props.meta?.promptCategory || `zai:${this.taskType}`,
        promptSource: props.meta?.promptSource || `zai:${this.taskType}:${this.taskId ?? 'default'}`,
      },
    })
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
