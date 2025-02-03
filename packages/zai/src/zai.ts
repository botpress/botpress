import { Client } from '@botpress/client'
import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import { z } from '@bpinternal/zui'

import { Adapter } from './adapters/adapter'
import { TableAdapter } from './adapters/botpress-table'
import { MemoryAdapter } from './adapters/memory'
import { Models } from './models'
import { llm } from './sdk-interfaces/llm/generateContent'

import { BotpressClient, GenerationMetadata } from './utils'

type ModelId = (typeof Models)[number]['id']

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

  private originalConfig: ZaiConfig

  private userId: string | undefined
  private integration: string
  private model: string
  private retry: { maxRetries: number }

  protected Model: (typeof Models)[number]
  protected namespace: string
  protected adapter: Adapter
  protected activeLearning: ActiveLearning

  constructor(config: ZaiConfig) {
    this.originalConfig = config
    const parsed = ZaiConfig.parse(config)

    this.client = parsed.client
    const [integration, modelId] = parsed.modelId.split('__')

    if (!integration?.length || !modelId?.length) {
      throw new Error(`Invalid model ID: ${parsed.modelId}. Expected format: <integration>__<modelId>`)
    }

    this.integration = integration!
    this.model = modelId!
    this.namespace = parsed.namespace
    this.userId = parsed.userId
    this.retry = parsed.retry as { maxRetries: number }
    this.Model = Models.find((m) => m.id === parsed.modelId)!
    this.activeLearning = parsed.activeLearning

    this.adapter = parsed.activeLearning?.enable
      ? new TableAdapter({ client: this.client, tableName: parsed.activeLearning.tableName })
      : new MemoryAdapter([])
  }

  /** @internal */
  protected async callModel(
    props: Partial<llm.generateContent.Input>
  ): Promise<llm.generateContent.Output & { metadata: GenerationMetadata }> {
    let retries = this.retry.maxRetries
    while (retries-- >= 0) {
      try {
        return await this._callModel(props)
      } catch (e) {
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
    props: Partial<llm.generateContent.Input>
  ): Promise<llm.generateContent.Output & { metadata: GenerationMetadata }> {
    let retries = this.retry.maxRetries
    do {
      const start = Date.now()
      const input: llm.generateContent.Input = {
        messages: [],
        temperature: 0.0,
        topP: 1,
        model: { id: this.model },
        userId: this.userId,
        ...props,
      }

      const { output } = (await this.client.callAction({
        type: `${this.integration}:generateContent`,
        input,
      })) as unknown as { output: llm.generateContent.Output }

      const latency = Date.now() - start

      return {
        ...output,
        metadata: {
          model: this.model,
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
      return getWasmTokenizer()
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
      ...this.originalConfig,
      ...options,
    })
  }

  public learn(taskId: string) {
    return new Zai({
      ...this.originalConfig,
      activeLearning: { ...this.activeLearning, taskId, enable: true },
    })
  }
}
