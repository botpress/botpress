import { Client } from '@botpress/client'
import { Cognitive, Model } from '@botpress/cognitive'
import { describe, expect, test } from 'vitest'

import { LoopExceededError } from '../errors.js'
import { ErrorExecutionResult } from '../result.js'
import { executeContext } from './execute.js'

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

/** A cognitive client that fails if the LLM is ever called. */
class ThrowingCognitive extends Cognitive {
  public constructor() {
    super({ client: new Client({ botId: 'test-bot' }) })
  }

  public async getModelDetails(model: string): Promise<Model> {
    return makeFakeModel(model)
  }

  public async generateContent(): Promise<never> {
    throw new Error('LLM should not have been called')
  }
}

/** A cognitive client that returns a fixed block of code for every generation. */
class FixedCodeCognitive extends Cognitive {
  public calls = 0

  public constructor(private _code: string) {
    super({ client: new Client({ botId: 'test-bot' }) })
  }

  public async getModelDetails(model: string): Promise<Model> {
    return makeFakeModel(model)
  }

  public async generateContent(): Promise<any> {
    this.calls++
    return {
      output: {
        choices: [{ content: `■fn_start\n${this._code}\n■fn_end` }],
        usage: { inputCost: 0, outputCost: 0, inputTokens: 0, outputTokens: 0 },
      },
      meta: {
        cached: false,
        tokens: { input: 0, output: 0 },
        cost: { input: 0, output: 0 },
        model: { integration: 'fake', model: 'test' },
      },
    }
  }
}

describe('executeContext with an initial code seed', () => {
  test('runs the provided code as the first iteration without calling the LLM when it succeeds', async () => {
    const cognitive = new ThrowingCognitive()

    const result = await executeContext({
      client: cognitive,
      options: { loop: 3 },
      initialCode: `return { action: 'done', value: { success: true, result: 42 } }`,
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.iterations.length).toBe(1)
    // The seeded iteration is synthetic: no LLM cost, sentinel model.
    expect(result.iterations[0]?.llm?.spend).toBe(0)
    expect(result.iterations[0]?.llm?.model).toBe('provided-code')
    expect(result.output).toEqual({ success: true, result: 42 })
  })

  test('falls back to the LLM when the provided code throws, and the LLM sees the failed code', async () => {
    const seed = `throw new Error('seed-boom')`
    const cognitive = new FixedCodeCognitive(`return { action: 'done', value: { success: true, result: 'fixed' } }`)

    const result = await executeContext({
      client: cognitive,
      options: { loop: 3 },
      initialCode: seed,
    })

    expect(result.isSuccess()).toBe(true)
    // Iteration 1 = failed seed, iteration 2 = LLM fix.
    expect(result.iterations.length).toBe(2)
    expect(cognitive.calls).toBe(1)
    expect(result.output).toEqual({ success: true, result: 'fixed' })

    // The second iteration's prompt must include the failed seed code so the LLM can fix it.
    const secondIterationText = JSON.stringify(result.iterations[1]?.messages ?? [])
    expect(secondIterationText).toContain('seed-boom')
  })

  test('returns LoopExceededError when the seed fails and no fallback iterations are allowed', async () => {
    const cognitive = new ThrowingCognitive()

    const result = await executeContext({
      client: cognitive,
      options: { loop: 1 },
      initialCode: `throw new Error('seed-boom')`,
    })

    expect(result.isError()).toBe(true)
    expect(result.iterations.length).toBe(1)
    expect((result as ErrorExecutionResult).error).toBeInstanceOf(LoopExceededError)
  })
})
