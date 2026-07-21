import { Client } from '@botpress/client'
import { Cognitive, Model } from '@botpress/cognitive'
import { describe, expect, test } from 'vitest'

import { Tool } from './tool.js'
import { generateCode } from './one-shot.js'

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

/** Returns a scripted sequence of raw model outputs, one per generation call. */
class ScriptedCognitive extends Cognitive {
  public calls = 0
  public lastMessages: any[] = []
  public lastSystemPrompt: string | undefined

  public constructor(private _outputs: string[]) {
    super({ client: new Client({ botId: 'test-bot' }) })
  }

  public async getModelDetails(model: string): Promise<Model> {
    return makeFakeModel(model)
  }

  public async generateContent(props: any): Promise<any> {
    this.lastMessages = props.messages
    this.lastSystemPrompt = props.systemPrompt
    const content = this._outputs[Math.min(this.calls, this._outputs.length - 1)]!
    this.calls++
    return {
      output: {
        choices: [{ content }],
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

const fn = (code: string) => `■fn_start\n${code}\n■fn_end`
const done = (expr: string) => `return { action: 'done', value: { success: true, result: ${expr} } }`

const summarize = new Tool({ name: 'summarize', handler: async () => ({}) })

describe('oneShot generateCode', () => {
  test('returns success on the first attempt when the code is valid', async () => {
    const cognitive = new ScriptedCognitive([fn(`const s = await summarize({}); ${done('s')}`)])

    const result = await generateCode({ client: cognitive, tools: [summarize] })

    expect(result.status).toBe('success')
    expect(cognitive.calls).toBe(1)
  })

  test('uses the one-shot system prompt (not the worker/chat prompt)', async () => {
    const cognitive = new ScriptedCognitive([fn(`const s = await summarize({}); ${done('s')}`)])

    await generateCode({ client: cognitive, tools: [summarize] })

    // One-shot-specific content must be present in the system prompt actually sent.
    expect(cognitive.lastSystemPrompt).toBeTruthy()
    expect(cognitive.lastSystemPrompt).toContain('One-Shot Execution')
    expect(cognitive.lastSystemPrompt).toContain('not present while the code runs')
    expect(cognitive.lastSystemPrompt).toContain('bail')
  })

  test('retries and fixes when the first code references an unavailable tool', async () => {
    const cognitive = new ScriptedCognitive([
      fn(`const t = await translate({}); ${done('t')}`), // invalid: translate not provided
      fn(`const s = await summarize({}); ${done('s')}`), // valid fix
    ])

    const result = await generateCode({ client: cognitive, tools: [summarize] })

    expect(result.status).toBe('success')
    expect(cognitive.calls).toBe(2)
    // The fix attempt's prompt must include the validation failure.
    expect(JSON.stringify(cognitive.lastMessages)).toContain('translate')
  })

  test('gives up with an invalid result after exhausting the fix attempts', async () => {
    // Always references an unavailable tool → never validates.
    const cognitive = new ScriptedCognitive([fn(`const t = await translate({}); ${done('t')}`)])

    const result = await generateCode({ client: cognitive, tools: [summarize] })

    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.errors.join(' ')).toContain('translate')
      expect(result.code).toContain('translate')
    }
    // 1 initial + 3 fix attempts.
    expect(cognitive.calls).toBe(4)
  })

  test('bails when the model emits a bail block', async () => {
    const cognitive = new ScriptedCognitive([`■bail_start\nNo summarization tool is available.\n■bail_end`])

    const result = await generateCode({ client: cognitive, tools: [] })

    expect(result.status).toBe('bailed')
    if (result.status === 'bailed') {
      expect(result.reason).toContain('No summarization tool')
    }
    expect(cognitive.calls).toBe(1)
  })
})
