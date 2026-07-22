import { Client } from '@botpress/client'
import { Cognitive, Model } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test } from 'vitest'

import { Chat } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { RenderedComponent } from '../component.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { SuccessExecutionResult } from '../result.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'

const makeFakeModel = (model: string): Model => ({
  id: model,
  name: 'Fake Model',
  integration: 'botpress',
  description: 'A fake model for testing',
  input: { maxTokens: 128_000, costPer1MTokens: 0 },
  output: { maxTokens: 8_000, costPer1MTokens: 0 },
  ref: `fake:${model}`,
  tags: [],
})

/** A cognitive client that replays scripted ■ protocol responses, one per iteration. */
class ScriptedCognitive extends Cognitive {
  private _index = 0

  public constructor(private _responses: string[]) {
    super({ client: new Client({ botId: 'test-bot' }) })
  }

  public async getModelDetails(model: string): Promise<Model> {
    return makeFakeModel(model)
  }

  protected _nextContent(): string {
    const content = this._responses[this._index++]
    if (content === undefined) {
      throw new Error('No more scripted responses')
    }
    return content
  }

  protected _buildResponse(content: string): any {
    return {
      output: {
        id: 'res_1',
        provider: 'fake',
        model: 'fake',
        choices: [{ type: 'text', content, role: 'assistant', index: 0, stopReason: 'stop' }],
        usage: { inputTokens: 10, inputCost: 0, outputTokens: 10, outputCost: 0 },
        botpress: { cost: 0 },
      },
      meta: {
        cached: false,
        model: { integration: 'fake', model: 'fake' },
        latency: 1,
        cost: { input: 0, output: 0 },
        tokens: { input: 10, output: 10 },
      },
    }
  }

  public async generateContent(): Promise<any> {
    return this._buildResponse(this._nextContent())
  }
}

/** Streams the scripted responses in small chunks, like a Cognitive v2 (beta) client. */
class ScriptedStreamingCognitive extends ScriptedCognitive {
  /** Value of the probe function recorded after each chunk was consumed downstream. */
  public probes: number[] = []

  public constructor(
    responses: string[],
    private _probe: () => number = () => 0,
    private _chunkSize = 7
  ) {
    super(responses)
  }

  public async *generateContentStream(): AsyncGenerator<any, any, void> {
    const content = this._nextContent()
    for (let i = 0; i < content.length; i += this._chunkSize) {
      yield { output: content.slice(i, i + this._chunkSize), created: Date.now() }
      this.probes.push(this._probe())
    }
    return this._buildResponse(content)
  }
}

const makeChat = () => {
  const messages: Array<{ type: string; text: string; props: Record<string, unknown> }> = []
  const chat = new Chat({
    components: [DefaultComponents.Text, DefaultComponents.Button],
    transcript: [{ role: 'user', content: 'hello', name: 'user' }],
    handler: async (component: RenderedComponent) => {
      messages.push({
        type: component.type,
        text: component.children.map((c) => (typeof c === 'string' ? c : '')).join(''),
        props: component.props,
      })
    },
  })
  return { chat, messages }
}

describe('message-stream protocol execution', () => {
  test('a message-only response sends the message and listens', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedCognitive(['■send=message\nHello **world**!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages).toEqual([{ type: 'MESSAGE', text: 'Hello **world**!', props: {} }])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
  })

  test('a message-only response without ■next implicitly listens', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedCognitive(['■send=message\nJust letting you know!'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Just letting you know!'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
  })

  test('■run executes code, feeds the returned value back, and continues', async () => {
    const { chat, messages } = makeChat()
    const getNumber = new Tool({
      name: 'getNumber',
      description: 'Returns a number',
      output: z.number(),
      handler: async () => 21,
    })

    const client = new ScriptedCognitive([
      '■send=message\nLet me compute that...\n■run\nconst x = await getNumber()\nreturn { doubled: x * 2 }',
      '■send=message\nThe answer is **42**.\n■next=listen',
    ])

    const result = await executeContext({ client, chat, tools: [getNumber], options: { loop: 5 } })

    expect(messages.map((m) => m.text)).toEqual(['Let me compute that...', 'The answer is **42**.'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)

    const firstStatus = result.iterations[0]!.status
    expect(firstStatus.type).toBe('thinking_requested')
    if (firstStatus.type === 'thinking_requested') {
      expect(firstStatus.thinking_requested.variables).toEqual({ doubled: 42 })
    }
  })

  test('■send components carry props', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedCognitive([
      '■send=message\nPick one:\n■send=button { label: "Option A", action: "postback", value: "a" }\n■next=listen',
    ])

    await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages).toEqual([
      { type: 'MESSAGE', text: 'Pick one:', props: {} },
      { type: 'BUTTON', text: '', props: { label: 'Option A', action: 'postback', value: 'a' } },
    ])
  })

  test('worker mode: ■run then ■next with typed exit props', async () => {
    const done = new Exit({
      name: 'done',
      description: 'Task completed',
      schema: z.object({ sum: z.number() }),
    })

    const client = new ScriptedCognitive(['■run\nreturn { sum: 1 + 2 }', '■next=done { sum: 3 }'])

    const result = await executeContext({ client, exits: [done], options: { loop: 5 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    const success = result as SuccessExecutionResult
    expect(success.result.exit.name).toBe('done')
    expect(success.output).toEqual({ sum: 3 })
  })

  test('■next combined with side-effect-only ■run code exits in a single iteration', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    let called = false
    const sideEffect = new Tool({
      name: 'sideEffect',
      description: 'Does something',
      handler: async () => {
        called = true
      },
    })

    const client = new ScriptedCognitive(['■run\nawait sideEffect()\n■next=done'])

    const result = await executeContext({ client, tools: [sideEffect], exits: [done], options: { loop: 3 } })

    expect(called).toBe(true)
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(1)
    expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
  })

  test('an empty worker response yields invalid_code_error and retries', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    const client = new ScriptedCognitive(['I am not following the protocol at all', '■next=done'])

    const result = await executeContext({ client, exits: [done], options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)
    expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
  })

  test('code execution errors are retried with the error context', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    const client = new ScriptedCognitive(['■run\nthrow new Error("kaboom")', '■next=done'])

    const result = await executeContext({ client, exits: [done], options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations[0]!.status.type).toBe('execution_error')
  })

  test('■next combined with returning code hands the value back, then exits next response', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    const client = new ScriptedCognitive(['■run\nreturn { computed: 7 }\n■next=done', '■next=done'])

    const result = await executeContext({ client, exits: [done], options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)
    expect(result.iterations[0]!.status.type).toBe('thinking_requested')
    expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
  })

  test('■next=listen combined with returning code hands the result back instead', async () => {
    const { chat, messages } = makeChat()
    const getNumber = new Tool({
      name: 'getNumber',
      description: 'Returns a number',
      output: z.number(),
      handler: async () => 21,
    })

    const client = new ScriptedCognitive([
      '■send=message\nLooking it up...\n■run\nconst x = await getNumber()\nreturn x\n■next=listen',
      '■send=message\nThe number is **21**.\n■next=listen',
    ])

    const result = await executeContext({ client, chat, tools: [getNumber], options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Looking it up...', 'The number is **21**.'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)
    expect(result.iterations[0]!.status.type).toBe('thinking_requested')
  })

  test('streaming clients dispatch messages while the stream is still in flight', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedStreamingCognitive(
      ['■send=message\nStreaming hello!\n■send=message\nSecond message\n■next=listen'],
      () => messages.length
    )

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Streaming hello!', 'Second message'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)

    // the first message must have been delivered before the stream completed
    expect(client.probes.slice(0, -1).some((count) => count >= 1)).toBe(true)
  })

  test('streaming clients run code and continue like non-streaming clients', async () => {
    const { chat, messages } = makeChat()
    const getNumber = new Tool({
      name: 'getNumber',
      description: 'Returns a number',
      output: z.number(),
      handler: async () => 21,
    })

    const client = new ScriptedStreamingCognitive([
      '■send=message\nComputing...\n■run\nconst x = await getNumber()\nreturn { doubled: x * 2 }',
      '■send=message\nThe answer is **42**.\n■next=listen',
    ])

    const result = await executeContext({ client, chat, tools: [getNumber], options: { loop: 5 } })

    expect(messages.map((m) => m.text)).toEqual(['Computing...', 'The answer is **42**.'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)
  })

  test('streaming clients strip a wrapping code fence', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedStreamingCognitive(['```\n■send=message\nFenced hello!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Fenced hello!'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
  })

  test('an unknown ■next exit yields exit_error and retries', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    const client = new ScriptedCognitive(['■next=nonexistent', '■next=done'])

    const result = await executeContext({ client, exits: [done], options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations[0]!.status.type).toBe('exit_error')
    expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
  })
})
