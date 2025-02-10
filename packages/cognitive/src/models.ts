import { ResourceNotFoundError } from '@botpress/client'
import { ExtendedClient, getExtendedClient } from './bp-client'
import { Model as RawModel } from './llm'
import { BotpressClientLike } from './types'

export const DOWNTIME_THRESHOLD_MINUTES = 5
const PREFERENCES_FILE_SUFFIX = 'models.config.json'

// Biases for vendors and models
const VendorPreferences = ['google-ai', 'anthropic', 'openai']
const BestModelPreferences = ['4o', '3-5-sonnet', 'gemini-1.5-pro']
const FastModelPreferences = ['gemini-1.5-flash', '4o-mini', 'flash', 'haiku']

const InputPricePenalty = 3 // $3 per 1M tokens
const OutputPricePenalty = 10 // $10 per 1M tokens
const LowTokensPenalty = 128_000 // 128k tokens

export type Model = RawModel & {
  ref: ModelRef
  integration: string
}

export type ModelRef = `${string}:${string}`

export type ModelPreferences = {
  best: ModelRef[]
  fast: ModelRef[]
  downtimes: Array<{ ref: ModelRef; startedAt: string; reason: string }>
}

const isRecommended = (model: Model) => model.tags.includes('recommended')
const isDeprecated = (model: Model) => model.tags.includes('deprecated')
const isLowCost = (model: Model) => model.tags.includes('low-cost')
const hasVisionSupport = (model: Model) => model.tags.includes('vision')
const isGeneralPurpose = (model: Model) => model.tags.includes('general-purpose')

const scoreModel = (model: Model, type: 'best' | 'fast', boosts: Record<ModelRef, number> = {}) => {
  let score: number = 0

  const scores: Array<[string, boolean, number]> = [
    ['input price penalty', model.input.costPer1MTokens > InputPricePenalty, -1],
    ['output price penalty', model.output.costPer1MTokens > OutputPricePenalty, -1],
    ['low tokens penalty', (model.input.maxTokens ?? 0 + model.output.maxTokens ?? 0) < LowTokensPenalty, -1],
    ['recommended', isRecommended(model), 2],
    ['deprecated', isDeprecated(model), -2],
    ['vision support', hasVisionSupport(model), 1],
    ['general purpose', isGeneralPurpose(model), 1],
    ['vendor preference', VendorPreferences.includes(model.integration), 1],
    ['best model preference', type === 'best' && BestModelPreferences.some((x) => model.id.includes(x)), 1],
    ['fast model preference penalty', type === 'best' && FastModelPreferences.some((x) => model.id.includes(x)), -2],
    ['fast model preference', type === 'fast' && FastModelPreferences.some((x) => model.id.includes(x)), 2],
    ['low cost', type === 'fast' && isLowCost(model), 1],
  ]

  for (const rule in boosts) {
    if (model.ref.includes(rule)) {
      scores.push([`boost (${rule})`, true, Number(boosts[rule as ModelRef]) ?? 0] as const)
    }
  }

  for (const [, condition, value] of scores) {
    if (condition) {
      score += value
    }
  }

  return score
}

export const getBestModels = (models: Model[], boosts: Record<ModelRef, number> = {}) =>
  models.sort((a, b) => scoreModel(b, 'best', boosts) - scoreModel(a, 'best', boosts))

export const getFastModels = (models: Model[], boosts: Record<ModelRef, number> = {}) =>
  models.sort((a, b) => scoreModel(b, 'fast', boosts) - scoreModel(a, 'fast', boosts))

export const pickModel = (models: ModelRef[], downtimes: ModelPreferences['downtimes'] = []) => {
  const copy = [...models]
  const elasped = (date: string) => new Date().getTime() - new Date(date).getTime()
  const DOWNTIME_THRESHOLD = 1000 * 60 * DOWNTIME_THRESHOLD_MINUTES

  if (!copy.length) {
    throw new Error('At least one model is required')
  }

  while (copy.length) {
    const ref = copy.shift() as ModelRef
    const downtime = downtimes.find((o) => o.ref === ref && elasped(o.startedAt) < DOWNTIME_THRESHOLD)
    if (downtime) {
      continue
    } else {
      return ref
    }
  }

  throw new Error(`All models are down: ${models.join(', ')}`)
}

export abstract class ModelProvider {
  public abstract fetchInstalledModels(): Promise<Model[]>
  public abstract fetchModelPreferences(): Promise<ModelPreferences | null>
  public abstract saveModelPreferences(preferences: ModelPreferences): Promise<void>
  public abstract deleteModelPreferences(): Promise<void>
}

export class RemoteModelProvider extends ModelProvider {
  private _client: ExtendedClient

  public constructor(client: BotpressClientLike) {
    super()
    this._client = getExtendedClient(client)
  }

  public async fetchInstalledModels() {
    const { bot } = await this._client.getBot({ id: this._client.botId })
    const models: any[] = []

    const registered = Object.values(bot.integrations).filter((x) => x.status === 'registered')

    await Promise.allSettled(
      registered.map(async (integration) => {
        const { output } = await this._client.callAction({
          type: `${integration.name}:listLanguageModels`,
          input: {},
        })

        if (!output?.models?.length) {
          return
        }

        for (const model of output.models as RawModel[]) {
          if (model.name && model.id && model.input && model.tags) {
            models.push({
              ref: `${integration.name}:${model.id}`,
              integration: integration.name,
              id: model.id,
              name: model.name,
              description: model.description,
              input: model.input,
              output: model.output,
              tags: model.tags,
            } satisfies Model)
          }
        }
      })
    )

    return models
  }

  public async fetchModelPreferences(): Promise<ModelPreferences | null> {
    try {
      const { file } = await this._client.getFile({ id: this._preferenceFileKey })

      if (globalThis.fetch !== undefined) {
        const response = await fetch(file.url)
        return (await response.json()) as ModelPreferences
      } else {
        const { data } = await this._client.axios.get(file.url, {
          // we piggy-back axios to avoid adding a new dependency
          // unset all headers to avoid S3 pre-signed signature mismatch
          headers: Object.keys(this._client.config.headers).reduce(
            (acc, key) => {
              acc[key] = undefined
              return acc
            },
            {} as Record<string, undefined>
          ),
        })
        return data as ModelPreferences
      }
    } catch (err) {
      if (err instanceof ResourceNotFoundError) {
        return null
      }
      throw err
    }
  }

  public async saveModelPreferences(preferences: ModelPreferences) {
    await this._client.uploadFile({
      key: this._preferenceFileKey,
      content: JSON.stringify(preferences, null, 2),
      index: false,
      tags: {
        system: 'true',
        purpose: 'config',
      },
    })
  }

  public async deleteModelPreferences() {
    await this._client.deleteFile({ id: this._preferenceFileKey }).catch(() => {})
  }

  private get _preferenceFileKey() {
    return `bot->${this._client.botId}->${PREFERENCES_FILE_SUFFIX}`
  }
}
