import { Client } from '@botpress/client'
import { BotpressClientLike, Cognitive, Model, Models } from '@botpress/cognitive'

import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import { z } from '@bpinternal/zui'

import { Adapter } from './adapters/adapter'
import { TableAdapter } from './adapters/botpress-table'
import { MemoryAdapter } from './adapters/memory'

/**
 * Active learning configuration for improving AI operations over time.
 *
 * When enabled, Zai stores successful operation results in a table and uses them as examples
 * for future operations, improving accuracy and consistency.
 *
 * @example
 * ```typescript
 * const activeLearning = {
 *   enable: true,
 *   tableName: 'MyAppLearningTable',
 *   taskId: 'sentiment-analysis'
 * }
 * ```
 */
type ActiveLearning = {
  /** Whether to enable active learning for this Zai instance */
  enable: boolean
  /** Name of the Botpress table to store learning examples (must end with 'Table') */
  tableName: string
  /** Unique identifier for this learning task */
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

/**
 * Configuration options for creating a Zai instance.
 *
 * @example
 * ```typescript
 * import { Client } from '@botpress/client'
 * import { Zai } from '@botpress/zai'
 *
 * const client = new Client({ token: 'your-token' })
 * const config: ZaiConfig = {
 *   client,
 *   modelId: 'best', // Use the best available model
 *   userId: 'user-123',
 *   namespace: 'my-app',
 *   activeLearning: {
 *     enable: true,
 *     tableName: 'MyLearningTable',
 *     taskId: 'extraction'
 *   }
 * }
 * const zai = new Zai(config)
 * ```
 */
type ZaiConfig = {
  /** Botpress client or Cognitive client instance */
  client: BotpressClientLike | Cognitive
  /** Optional user ID for tracking and attribution */
  userId?: string
  /** Model to use: 'best' (default), 'fast', or specific model like 'openai:gpt-4' */
  modelId?: Models
  /** Active learning configuration to improve operations over time */
  activeLearning?: ActiveLearning
  /** Namespace for organizing tasks (default: 'zai') */
  namespace?: string
}

const _ZaiConfig = z.object({
  client: z.custom<BotpressClientLike | Cognitive>(),
  userId: z.string().describe('The ID of the user consuming the API').optional(),
  modelId: z
    .custom<Models>(
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
    .default('best' satisfies Models),
  activeLearning: _ActiveLearning.default({ enable: false }),
  namespace: z
    .string()
    .regex(
      /^[A-Za-z0-9_/-]{1,100}$/,
      'Namespace must be alphanumeric and contain only letters, numbers, underscores, hyphens and slashes'
    )
    .default('zai'),
})

/**
 * Zai - A type-safe LLM utility library for production-ready AI operations.
 *
 * Zai provides high-level abstractions for common AI tasks with built-in features like:
 * - Active learning (learns from successful operations)
 * - Automatic chunking for large inputs
 * - Retry logic with error recovery
 * - Usage tracking (tokens, cost, latency)
 * - Type-safe schema validation with Zod
 *
 * @example Basic usage
 * ```typescript
 * import { Client } from '@botpress/client'
 * import { Zai } from '@botpress/zai'
 * import { z } from '@bpinternal/zui'
 *
 * const client = new Client({ token: process.env.BOTPRESS_TOKEN })
 * const zai = new Zai({ client })
 *
 * // Extract structured data
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * })
 * const person = await zai.extract('John is 30 years old', schema)
 * // Output: { name: 'John', age: 30 }
 *
 * // Check conditions
 * const isPositive = await zai.check('I love this product!', 'Is the sentiment positive?')
 * // Output: true
 *
 * // Summarize text
 * const summary = await zai.summarize(longDocument, { length: 100 })
 * ```
 *
 * @example With active learning
 * ```typescript
 * const zai = new Zai({
 *   client,
 *   activeLearning: {
 *     enable: true,
 *     tableName: 'SentimentTable',
 *     taskId: 'product-reviews'
 *   }
 * })
 *
 * // Enable learning for specific task
 * const result = await zai.learn('sentiment').check(review, 'Is this positive?')
 * // Future calls will use approved examples for better accuracy
 * ```
 *
 * @example Chaining configuration
 * ```typescript
 * // Use fast model for quick operations
 * const fastZai = zai.with({ modelId: 'fast' })
 * await fastZai.check(text, 'Is this spam?')
 *
 * // Use specific model
 * const gpt4Zai = zai.with({ modelId: 'openai:gpt-4' })
 * await gpt4Zai.extract(document, complexSchema)
 * ```
 */
export class Zai {
  protected static tokenizer: TextTokenizer = null!
  protected client: Cognitive

  private _originalConfig: ZaiConfig

  private _userId: string | undefined

  protected Model: Models
  protected ModelDetails: Model
  protected namespace: string
  protected adapter: Adapter
  protected activeLearning: ActiveLearning

  /**
   * Creates a new Zai instance with the specified configuration.
   *
   * @param config - Configuration object containing client, model, and learning settings
   *
   * @example
   * ```typescript
   * import { Client } from '@botpress/client'
   * import { Zai } from '@botpress/zai'
   *
   * const client = new Client({ token: 'your-token' })
   * const zai = new Zai({
   *   client,
   *   modelId: 'best',
   *   namespace: 'my-app',
   *   userId: 'user-123'
   * })
   * ```
   *
   * @throws {Error} If the configuration is invalid (e.g., invalid modelId format)
   */
  public constructor(config: ZaiConfig) {
    this._originalConfig = config
    const parsed = _ZaiConfig.parse(config) as ZaiConfig

    this.client = Cognitive.isCognitiveClient(parsed.client)
      ? (parsed.client as unknown as Cognitive)
      : new Cognitive({ client: parsed.client })

    this.namespace = parsed.namespace
    this._userId = parsed.userId
    this.Model = parsed.modelId as Models
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
      reasoningEffort: 'none',
      ...props,
      model: this.Model as Required<Parameters<Cognitive['generateContent']>[0]>['model'],
      userId: this._userId,
    })
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

  /**
   * Creates a new Zai instance with merged configuration options.
   *
   * This method allows you to create variations of your Zai instance with different
   * settings without modifying the original. Useful for switching models, namespaces,
   * or other configuration on a per-operation basis.
   *
   * @param options - Partial configuration to override the current settings
   * @returns A new Zai instance with the merged configuration
   *
   * @example Switch to a faster model
   * ```typescript
   * const zai = new Zai({ client })
   *
   * // Use fast model for simple operations
   * const fastZai = zai.with({ modelId: 'fast' })
   * await fastZai.check(text, 'Is this spam?')
   *
   * // Use best model for complex operations
   * const bestZai = zai.with({ modelId: 'best' })
   * await bestZai.extract(document, complexSchema)
   * ```
   *
   * @example Change namespace
   * ```typescript
   * const customerZai = zai.with({ namespace: 'customer-support' })
   * const salesZai = zai.with({ namespace: 'sales' })
   * ```
   *
   * @example Use specific model
   * ```typescript
   * const gpt4 = zai.with({ modelId: 'openai:gpt-4' })
   * const claude = zai.with({ modelId: 'anthropic:claude-3-5-sonnet-20241022' })
   * ```
   */
  public with(options: Partial<ZaiConfig>): Zai {
    return new Zai({
      ...this._originalConfig,
      ...options,
    })
  }

  /**
   * Creates a new Zai instance with active learning enabled for a specific task.
   *
   * Active learning stores successful operation results and uses them as examples for
   * future operations, improving accuracy and consistency over time. Each task ID
   * maintains its own set of learned examples.
   *
   * @param taskId - Unique identifier for the learning task (alphanumeric, hyphens, underscores, slashes)
   * @returns A new Zai instance with active learning enabled for the specified task
   *
   * @example Sentiment analysis with learning
   * ```typescript
   * const zai = new Zai({
   *   client,
   *   activeLearning: {
   *     enable: false,
   *     tableName: 'AppLearningTable',
   *     taskId: 'default'
   *   }
   * })
   *
   * // Enable learning for sentiment analysis
   * const sentimentZai = zai.learn('sentiment-analysis')
   * const result = await sentimentZai.check(review, 'Is this review positive?')
   *
   * // Each successful call is stored and used to improve future calls
   * ```
   *
   * @example Different tasks for different purposes
   * ```typescript
   * // Extract user info with learning
   * const userExtractor = zai.learn('user-extraction')
   * await userExtractor.extract(text, userSchema)
   *
   * // Extract product info with separate learning
   * const productExtractor = zai.learn('product-extraction')
   * await productExtractor.extract(text, productSchema)
   *
   * // Each task learns independently
   * ```
   *
   * @example Combining with other configuration
   * ```typescript
   * // Use fast model + learning
   * const fastLearner = zai.with({ modelId: 'fast' }).learn('quick-checks')
   * await fastLearner.check(email, 'Is this spam?')
   * ```
   *
   * @see {@link ZaiConfig.activeLearning} for configuration options
   */
  public learn(taskId: string) {
    return new Zai({
      ...this._originalConfig,
      activeLearning: { ...this.activeLearning, taskId, enable: true },
    })
  }
}
