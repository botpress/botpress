import { Client } from '@botpress/client'
import { Cognitive, Model } from '@botpress/cognitive'
import { expect, test } from 'vitest'
import { executeContext } from './llmz.js'
import { ErrorExecutionResult } from './result.js'
import { CognitiveError } from './errors.js'

test('executeContext should early exit when cognitive service is unreachable', async () => {
  class FailingCognitive extends Cognitive {
    public constructor(private _err: Error) {
      super({ client: new Client({}) })
    }

    public async getModelDetails(model: string): Promise<Model> {
      return {
        id: model,
        name: 'Failing Cognitive Model',
        integration: 'botpress',
        description: 'A failing cognitive model that simulates errors',
        input: { maxTokens: 8192, costPer1MTokens: 0 },
        output: { maxTokens: 2048, costPer1MTokens: 0 },
        ref: `failing:${model}`,
        tags: [],
      }
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
