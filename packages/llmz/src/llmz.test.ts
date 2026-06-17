import { Client } from '@botpress/client'
import { Cognitive, CognitiveBeta, Model } from '@botpress/cognitive'
import { describe, expect, test, vi } from 'vitest'
import { Context } from './context.js'
import { executeContext } from './llmz.js'
import { ErrorExecutionResult } from './result.js'
import { CognitiveError } from './errors.js'

const makeFakeModel = (model: string): Model => ({
  id: model,
  name: 'Fake Model',
  integration: 'botpress',
  description: 'A fake model for testing',
  input: { maxTokens: 8192, costPer1MTokens: 0 },
  output: { maxTokens: 2048, costPer1MTokens: 0 },
  ref: `fake:${model}`,
  tags: [],
})

test('executeContext should early exit when cognitive service is unreachable', async () => {
  class FailingCognitive extends Cognitive {
    public constructor(private _err: Error) {
      super({ client: new Client({ botId: 'test-bot' }) })
    }

    public async getModelDetails(model: string): Promise<Model> {
      return makeFakeModel(model)
    }

    public async generateContent(): Promise<never> {
      throw this._err
    }
  }

  const err = new Error('Simulated connection error')
  const cognitive = new FailingCognitive(err)

  const output = await executeContext({ client: cognitive, options: { loop: 5 } })

  expect(output.status).toBe('error')
  expect(output.iterations.length).toBe(1)
  expect((output as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
  expect(((output as ErrorExecutionResult).error as Error).message).toContain(err.message)
})

test('executeContext accepts a standalone CognitiveBeta and routes it through the v2 path', async () => {
  // A standalone CognitiveBeta (not wrapped in Cognitive). execute() should
  // detect it via the brand guard and adapt it — going straight to the v2
  // `generateText`/`listModels` surface, never the v1 integration path.
  const generateText = vi.fn().mockRejectedValue(new Error('v2 boom'))
  const listModels = vi.fn().mockResolvedValue([])

  const beta = {
    ['$$IS_COGNITIVE_BETA']: 'v2',
    generateText,
    listModels,
    generateTextStream: vi.fn(),
  } as unknown as CognitiveBeta

  expect(CognitiveBeta.isBetaClient(beta)).toBe(true)

  const output = await executeContext({ client: beta, options: { loop: 5 } })

  // Reaching generateText proves the beta adapter path was taken (model
  // details resolved without throwing, then generation was attempted on v2).
  expect(generateText).toHaveBeenCalled()
  expect(output.status).toBe('error')
  expect((output as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
  expect(((output as ErrorExecutionResult).error as Error).message).toContain('v2 boom')
})

describe('reasoningEffort', () => {
  test('reasoningEffort is available on iteration and in toJSON', async () => {
    const ctx = new Context({ reasoningEffort: 'low' })
    const iteration = await ctx.nextIteration()

    expect(iteration.reasoningEffort).toBe('low')

    const json = iteration.toJSON()
    expect(json.reasoningEffort).toBe('low')
  })

  test('reasoningEffort is undefined on iteration when not set', async () => {
    const ctx = new Context({})
    const iteration = await ctx.nextIteration()

    expect(iteration.reasoningEffort).toBeUndefined()

    const json = iteration.toJSON()
    expect(json.reasoningEffort).toBeUndefined()
  })
})
