import type { CognitiveMessage } from '@botpress/cognitive'
import { CognitiveError } from '../errors.js'
import { getTokenizer } from '../utils.js'

/**
 * Estimate text, structured arguments, schemas, and message scaffolding. Media
 * URLs carry bytes or locations, not model text. Cognitive does not expose a
 * media-token estimator; actual media usage is reported by the provider.
 */
export function countNativeRequestTokens(messages: CognitiveMessage[], tools: unknown): number {
  const textMessages = messages.map(omitMediaPayloads)

  const tokens = getTokenizer().count(JSON.stringify({ messages: textMessages, tools }), { approximate: false })
  if (!Number.isSafeInteger(tokens) || tokens < 0) {
    throw new CognitiveError('The tokenizer must return a nonnegative safe integer.')
  }

  return tokens
}

function omitMediaPayloads(message: CognitiveMessage): CognitiveMessage {
  if (!Array.isArray(message.content)) {
    return message
  }

  const content = message.content.map((part) => {
    if (part.type === 'image' || part.type === 'audio') {
      return { ...part, url: undefined }
    }

    return part
  })

  return { ...message, content }
}

type ModelLimits = { input: { maxTokens: number }; output: { maxTokens: number } }

/** Reserve output space within every model that can receive this request. */
export function resolveTokenBudget(model: ModelLimits | readonly ModelLimits[], maxTokens?: number) {
  const models: readonly ModelLimits[] = Array.isArray(model) ? model : [model as ModelLimits]
  if (!models.length) {
    throw new CognitiveError('At least one model is required.')
  }

  const limits: [string, number | undefined][] = [
    ...models.flatMap((item): [string, number][] => [
      ['model input maxTokens', item.input.maxTokens],
      ['model output maxTokens', item.output.maxTokens],
    ]),
    ['options.maxTokens', maxTokens],
  ]
  for (const [name, value] of limits) {
    if (name === 'options.maxTokens' && value === undefined) {
      continue
    }

    if (value === undefined || !Number.isSafeInteger(value) || value < 1) {
      throw new CognitiveError(`Invalid ${name}. Expected a positive safe integer.`)
    }
  }

  const limit = Math.min(...models.map((item) => item.input.maxTokens), maxTokens ?? Infinity)
  if (limit < 2) {
    throw new CognitiveError('The context window must leave room for both input and output.')
  }

  const output = Math.min(
    ...models.map((item) => item.output.maxTokens),
    limit - 1,
    Math.max(256, Math.min(16_000, Math.floor(limit * 0.1)))
  )
  return { limit, output, input: limit - output }
}
