import 'dotenv/config'
import { describe, expect, test } from 'vitest'
import { Cognitive, CognitiveMetadata, CognitiveRequest } from '../src'

const token = process.env.CLOUD_PAT
const botId = process.env.CLOUD_BOT_ID
const apiUrl = process.env.COGNITIVE_API_URL ?? process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud'

// Live model output and provider availability can vary; retain the same assertions on every attempt.
describe.skipIf(!token || !botId)('Cognitive e2e — Mercury 2.5 and service tier', { retry: 2 }, () => {
  const cases = [
    // Mercury requires reasoning and needs room for it before producing the reply.
    {
      model: 'inception:mercury-2.5',
      provider: 'inception',
      temperature: 0,
      reasoningEffort: 'low' as const,
      maxTokens: 512,
      options: { skipCache: true },
    },
    {
      model: 'openai:gpt-5.4-mini',
      provider: 'openai',
      temperature: undefined,
      reasoningEffort: 'none' as const,
      maxTokens: 64,
      options: { skipCache: true, serviceTier: 'fast' as const },
    },
  ]

  test.each(cases)(
    '$model supports nonstreaming generation ($options.serviceTier)',
    async ({ model, provider, options, reasoningEffort, maxTokens, temperature }) => {
      const cognitive = new Cognitive({ apiUrl, token, botId, timeout: 30000 })
      const response = await cognitive.generateText({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: pong' }],
        maxTokens,
        temperature,
        reasoningEffort,
        options,
      })
      expect(response.output.trim()).toMatch(/^pong[.!]?$/i)
      assertMetadata(response.metadata, provider, model)
      console.info(
        JSON.stringify({
          model,
          streaming: false,
          tier: options.serviceTier,
          latency: response.metadata.latency,
          cost: response.metadata.cost,
        })
      )
    },
    45000
  )

  test.each(cases)(
    '$model supports streaming generation ($options.serviceTier)',
    async ({ model, provider, options, reasoningEffort, maxTokens, temperature }) => {
      const cognitive = new Cognitive({ apiUrl, token, botId, timeout: 30000 })
      const request: CognitiveRequest = {
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: pong' }],
        maxTokens,
        temperature,
        reasoningEffort,
        options,
      }
      let output = ''
      let metadata: CognitiveMetadata | undefined
      let finished = false
      for await (const chunk of cognitive.generateTextStream(request)) {
        expect(chunk.restart).toBeUndefined()
        output += chunk.output ?? ''
        metadata = chunk.metadata ?? metadata
        finished ||= chunk.finished === true
      }
      expect(output.trim()).toMatch(/^pong[.!]?$/i)
      expect(finished).toBe(true)
      expect(metadata).toBeDefined()
      assertMetadata(metadata!, provider, model)
      console.info(
        JSON.stringify({
          model,
          streaming: true,
          tier: options.serviceTier,
          latency: metadata?.latency,
          ttft: metadata?.ttft,
          cost: metadata?.cost,
        })
      )
    },
    45000
  )
})

function assertMetadata(metadata: CognitiveMetadata, provider: string, model: string) {
  expect(metadata.provider).toBe(provider)
  expect(metadata.model).toContain(model.split(':')[1])
  expect(metadata.cached).toBe(false)
  expect(metadata.usage.outputTokens).toBeGreaterThan(0)
  expect(metadata.fallbackPath ?? []).toEqual([])
  expect(
    metadata.warnings?.filter((warning) => warning.type === 'parameter_ignored' || warning.type === 'fallback_used') ??
      []
  ).toEqual([])
}
