import { Client } from '@botpress/client'
import { BotpressClientLike, Cognitive, Model } from '@botpress/cognitive'

import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import { z } from '@bpinternal/zui'

import { Adapter } from './adapters/adapter'
import { TableAdapter } from './adapters/botpress-table'
import { MemoryAdapter } from './adapters/memory'

type ModelId = Required<Parameters<Cognitive['generateContent']>[0]['model']>

type ActiveLearning = {
  enable: boolean
  tableName: string
  taskId: string
}

const _ActiveLearning = z.object({
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

type ZaiConfig = {
  client: BotpressClientLike | Cognitive
  userId?: string
  modelId?: ModelId | string
  activeLearning?: ActiveLearning
  namespace?: string
}

const _ZaiConfig = z.object({
  client: z.custom<BotpressClientLike | Cognitive>(),
  userId: z.string().describe('The ID of the user consuming the API').optional(),
  modelId: z
    .custom<ModelId | string>(
      (value) => {
        if (typeof value !== 'string') {
          return false
        }

        if (value !== 'best' && value !== 'fast' && !value.includes(':')) {
          return false
        }

        return true
      },
      {
        message: 'Invalid model ID',
      }
    )
    .describe('The ID of the model you want to use')
    .default('best' satisfies ModelId),
  activeLearning: _ActiveLearning.default({ enable: false }),
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
  protected client: Cognitive

  private _originalConfig: ZaiConfig

  private _userId: string | undefined

  protected Model: ModelId
  protected ModelDetails: Model
  protected namespace: string
  protected adapter: Adapter
  protected activeLearning: ActiveLearning

  public constructor(config: ZaiConfig) {
    this._originalConfig = config
    const parsed = _ZaiConfig.parse(config) as ZaiConfig

    this.client = Cognitive.isCognitiveClient(parsed.client)
      ? (parsed.client as unknown as Cognitive)
      : new Cognitive({ client: parsed.client })

    this.namespace = parsed.namespace
    this._userId = parsed.userId
    this.Model = parsed.modelId as ModelId
    this.activeLearning = parsed.activeLearning as ActiveLearning

    this.adapter = parsed.activeLearning?.enable
      ? new TableAdapter({
          client: this.client.client as unknown as Client,
          tableName: parsed.activeLearning.tableName,
        })
      : new MemoryAdapter([])
  }

  /** @internal */
  protected async callModel(
    props: Parameters<Cognitive['generateContent']>[0]
  ): ReturnType<Cognitive['generateContent']> {
    return this.client.generateContent({
      ...props,
      model: this.Model,
      userId: this._userId,
    })
  }

  protected async getTokenizer() {
    Zai.tokenizer ??= await (async () => {
      while (!getWasmTokenizer) {
        // there's an issue with wasm, it doesn't load immediately
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      return getWasmTokenizer() as Promise<TextTokenizer>
    })()
    return Zai.tokenizer
  }

  protected async fetchModelDetails(): Promise<void> {
    if (!this.ModelDetails) {
      this.ModelDetails = await this.client.getModelDetails(this.Model)
    }
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
