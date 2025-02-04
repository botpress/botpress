import type { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'

export const stringify = (input: unknown, beautify = true) => {
  return typeof input === 'string' && !!input.length
    ? input
    : input
      ? JSON.stringify(input, beautify ? null : undefined, beautify ? 2 : undefined)
      : '<input is null, false, undefined or empty>'
}

export const BotpressClient = z.custom<Client | any>(
  (value) =>
    typeof value === 'object' && value !== null && 'callAction' in value && typeof value.callAction === 'function',
  {
    message: 'Invalid Botpress Client. Make sure to pass an instance of @botpress/client',
  }
)

export function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}

export const takeUntilTokens = <T>(arr: T[], tokens: number, count: (el: T) => number) => {
  const result: T[] = []
  let total = 0

  for (const value of arr) {
    const valueTokens = count(value)
    if (total + valueTokens > tokens) {
      break
    }
    total += valueTokens
    result.push(value)
  }

  return result
}

export type GenerationMetadata = z.input<typeof GenerationMetadata>
export const GenerationMetadata = z.object({
  model: z.string(),
  cost: z
    .object({
      input: z.number(),
      output: z.number(),
    })
    .describe('Cost in $USD'),
  latency: z.number().describe('Latency in milliseconds'),
  tokens: z
    .object({
      input: z.number(),
      output: z.number(),
    })
    .describe('Number of tokens used'),
})
