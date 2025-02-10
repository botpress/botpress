import { Client } from '@botpress/client'
import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import { z } from '@bpinternal/zui'

import { Adapter } from './adapters/adapter'
import { TableAdapter } from './adapters/botpress-table'
import { MemoryAdapter } from './adapters/memory'
import { GenerateContentInput, GenerateContentOutput, Model } from './llm'
import { Models } from './models'

import { BotpressClient, GenerationMetadata } from './utils'

type ModelId = Model['id']

type ActiveLearning = z.input<typeof ActiveLearning>
const ActiveLearning = z.object({
  enable: z.boolean().describe('Whether to enable active learning').default(false),
  tableName: z
    .string()
    .regex(
      /^[A-Za-z0-9_/-]{1,100}Table$/,
      'Namespace must be alphanumeric and contain only letters, numbers, underscores, hyphens and slashes'
    )
    .describe('The name of the table to store active learning tasks')
    .default('ActiveLearningTable'),
  taskId: z
    .string()
    .regex(
      /^[A-Za-z0-9_/-]{1,100}$/,
      'Namespace must be alphanumeric and contain only letters, numbers, underscores, hyphens and slashes'
    )
    .describe('The ID of the task')
    .default('default'),
})

type ZaiConfig = z.input<typeof ZaiConfig>
const ZaiConfig = z.object({
  client: BotpressClient,
  userId: z.string().describe('The ID of the user consuming the API').optional(),
  retry: z.object({ maxRetries: z.number().min(0).max(100) }).default({ maxRetries: 3 }),
  modelId: z
    .custom<ModelId | string>(
      (value) => {
        if (typeof value !== 'string' || !value.includes('__')) {
          return false
        }

        return true
      },
      {
        message: 'Invalid model ID',
      }
    )
    .describe('The ID of the model you want to use')
    .default('openai__gpt-4o-mini-2024-07-18' satisfies ModelId),
  activeLearning: ActiveLearning.default({ enable: false }),
  namespace: z
    .string()
    .regex(
      /^[A-Za-z0-9_/-]{1,100}$/,
      'Namespace must be alphanumeric and contain only letters, numbers, underscores, hyphens and slashes'
    )
    .default('zai'),
})

export class Zai {
  protected static tokenizer: TextTokenizer = null!
  protected client: Client

  private _originalConfig: ZaiConfig

  private _userId: string | undefined
  private _integration: string
  private _model: string
  private _retry: { maxRetries: number }

  protected Model: Model
  protected namespace: string
  protected adapter: Adapter
  protected activeLearning: ActiveLearning

  public constructor(config: ZaiConfig) {
    this._originalConfig = config
    const parsed = ZaiConfig.parse(config)

    this.client = parsed.client
    const [integration, modelId] = parsed.modelId.split('__')

    if (!integration?.length || !modelId?.length) {
      throw new Error(`Invalid model ID: ${parsed.modelId}. Expected format: <integration>__<modelId>`)
    }

    this._integration = integration!
    this._model = modelId!
    this.namespace = parsed.namespace
    this._userId = parsed.userId
    this._retry = parsed.retry as { maxRetries: number }
    this.Model = Models.find((m) => m.id === parsed.modelId)!
    this.activeLearning = parsed.activeLearning

    this.adapter = parsed.activeLearning?.enable
      ? new TableAdapter({ client: this.client, tableName: parsed.activeLearning.tableName })
      : new MemoryAdapter([])
  }

  /** @internal */
  protected async callModel(
    props: Partial<GenerateContentInput>
  ): Promise<GenerateContentOutput & { metadata: GenerationMetadata }> {
    let retries = this._retry.maxRetries
    while (retries-- >= 0) {
      try {
        return await this._callModel(props)
      } catch {
        if (retries >= 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } else {
          throw new Error('Failed to call model after multiple retries')
        }
      }
    }

    throw new Error('Failed to call model after multiple retries')
  }

  /** @internal */
  private async _callModel(
    props: Partial<GenerateContentInput>
  ): Promise<GenerateContentOutput & { metadata: GenerationMetadata }> {
    let retries = this._retry.maxRetries
    do {
      const start = Date.now()
      const input: GenerateContentInput = {
        messages: [],
        temperature: 0.0,
        topP: 1,
        model: { id: this._model },
        userId: this._userId,
        ...props,
      }

      const { output } = (await this.client.callAction({
        type: `${this._integration}:generateContent`,
        input,
      })) as unknown as { output: GenerateContentOutput }

      const latency = Date.now() - start

      return {
        ...output,
        metadata: {
          model: this._model,
          latency,
          cost: { input: output.usage.inputCost, output: output.usage.outputCost },
          tokens: { input: output.usage.inputTokens, output: output.usage.outputTokens },
        },
      }
    } while (--retries > 0)
  }

  protected async getTokenizer() {
    Zai.tokenizer ??= await (async () => {
      while (!getWasmTokenizer) {
        // there's an issue with wasm, it doesn't load immediately
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      return getWasmTokenizer() as TextTokenizer
    })()
    return Zai.tokenizer
  }

  protected get taskId() {
    if (!this.activeLearning.enable) {
      return undefined
    }

    return `${this.namespace}/${this.activeLearning.taskId}`.replace(/\/+/g, '/')
  }

  public with(options: Partial<ZaiConfig>): Zai {
    return new Zai({
      ...this._originalConfig,
      ...options,
    })
  }

  public learn(taskId: string) {
    return new Zai({
      ...this._originalConfig,
      activeLearning: { ...this.activeLearning, taskId, enable: true },
    })
  }
}
