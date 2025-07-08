import { Cognitive, Model, GenerateContentInput, GenerateContentOutput } from '@botpress/cognitive'
import { Adapter } from './adapters/adapter'
import { EventEmitter } from './emitter'

type Meta = Awaited<ReturnType<Cognitive['generateContent']>>['meta']

type GenerateContentProps<T> = Omit<GenerateContentInput, 'model' | 'signal'> & {
  maxRetries?: number
  transform?: (text: string | undefined, output: GenerateContentOutput) => T
}

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

  public async generateContent<Out = string>(
    props: GenerateContentProps<Out>
  ): Promise<{ meta: Meta; output: GenerateContentOutput; text: string | undefined; extracted: Out }> {
    const maxRetries = Math.max(props.maxRetries ?? 3, 0)
    const transform = props.transform
    let lastError: Error | null = null
    const messages = [...(props.messages || [])]

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this._client.generateContent({
          ...props,
          messages,
          signal: this.controller.signal,
          model: this.modelId,
          meta: {
            integrationName: props.meta?.integrationName || 'zai',
            promptCategory: props.meta?.promptCategory || `zai:${this.taskType}`,
            promptSource: props.meta?.promptSource || `zai:${this.taskType}:${this.taskId ?? 'default'}`,
          },
        })

        const content = response.output.choices[0]?.content
        const str = typeof content === 'string' ? content : content?.[0]?.text || ''
        let output: Out

        messages.push({
          role: 'assistant',
          content: str || '<Invalid output, no content provided>',
        })

        if (!transform) {
          output = str as any
        } else {
          output = transform(str, response.output)
        }

        return { meta: response.meta, output: response.output, text: str, extracted: output }
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          throw lastError
        }

        messages.push({
          role: 'user',
          content: `ERROR PARSING OUTPUT\n\n${lastError.message}.\n\nPlease return a valid response addressing the error above.`,
        })
      }
    }

    throw lastError
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
