import { Client } from '@botpress/client'
import { Cognitive, Model } from '@botpress/cognitive'
import { describe, expect, test } from 'vitest'
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
