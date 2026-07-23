import { CognitiveMetadata, CognitiveResponse, CognitiveStreamChunk, Model } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test } from 'vitest'

import { Chat, MessageDelta } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { RenderedComponent } from '../component.js'
import { ListenExit } from '../context.js'
import { CognitiveError } from '../errors.js'
import { Exit } from '../exit.js'
import { ErrorExecutionResult, SuccessExecutionResult } from '../result.js'
import { _CustomModelClient } from '../custom-client.js'
import { Tool } from '../tool.js'
import { Transcript } from '../transcript.js'
import { executeContext } from './execute.js'

const makeFakeModel = (model: string): Model => ({
  id: model,
  name: 'Fake Model',
  description: 'A fake model for testing',
  input: { maxTokens: 128_000, costPer1MTokens: 0 },
  output: { maxTokens: 8_000, costPer1MTokens: 0 },
  tags: [],
  lifecycle: 'production',
})

const makeFakeMetadata = (): CognitiveMetadata => ({
  provider: 'fake',
  model: 'fake',
  usage: { inputTokens: 10, inputCost: 0, outputTokens: 10, outputCost: 0 },
  cost: 0,
  cached: false,
  latency: 1,
})

/**
 * A cognitive client that replays scripted ■ protocol responses, one per
 * iteration. Built on the runtime's custom-client escape hatch so it exposes
 * exactly the minimal surface (no network-backed streaming inherited from the
 * real Cognitive class).
 */
class ScriptedCognitive extends _CustomModelClient {
  private _index = 0

  public constructor(private _responses: string[]) {
    super()
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

  protected _buildResponse(content: string): CognitiveResponse {
    return { output: content, metadata: makeFakeMetadata() }
  }

  public async generateText(): Promise<CognitiveResponse> {
    return this._buildResponse(this._nextContent())
  }
}

/**
 * A scripted client guaranteed to have no `generateTextStream`, forcing the
 * true non-streaming code path in generate.ts.
 */
class ScriptedNonStreamingCognitive extends ScriptedCognitive {}

/** Streams the scripted responses in small chunks, like the real Cognitive client. */
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

  public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const content = this._nextContent()
    for (let i = 0; i < content.length; i += this._chunkSize) {
      yield { output: content.slice(i, i + this._chunkSize), created: Date.now() }
      this.probes.push(this._probe())
    }
    yield { created: Date.now(), finished: true, metadata: makeFakeMetadata() }
  }
}

const makeChat = (onMessageDelta?: (delta: MessageDelta) => Promise<void> | void) => {
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
    onMessageDelta,
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

  test('streaming clients forward message body chunks to Chat.onMessageDelta', async () => {
    const deltas: MessageDelta[] = []
    const { chat, messages } = makeChat((delta) => {
      deltas.push(delta)
    })

    const client = new ScriptedStreamingCognitive(
      ['■send=message\nThis is a fairly long streamed message body!\n■next=listen'],
      () => deltas.length,
      5 // small chunks so the body spans many stream chunks
    )

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(messages.map((m) => m.text)).toEqual(['This is a fairly long streamed message body!'])

    // the body was delivered progressively, chunk by chunk
    expect(deltas.length).toBeGreaterThan(1)
    expect(deltas.map((d) => d.delta).join('')).toBe('This is a fairly long streamed message body!')
    expect(deltas.at(-1)!.content).toBe('This is a fairly long streamed message body!')
    expect(new Set(deltas.map((d) => d.id)).size).toBe(1)
    expect(deltas.every((d) => d.component === 'message')).toBe(true)

    // deltas were flowing while the stream was still in flight
    expect(client.probes.slice(0, -1).some((count) => count >= 1)).toBe(true)
  })

  test('onMessageDelta errors are ignored and the message is still delivered', async () => {
    const { chat, messages } = makeChat(() => {
      throw new Error('delta handler boom')
    })

    const client = new ScriptedStreamingCognitive(['■send=message\nStill delivered!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(messages.map((m) => m.text)).toEqual(['Still delivered!'])
  })

  test('streaming iterations record time to first and last token', async () => {
    const { chat } = makeChat()
    const client = new ScriptedStreamingCognitive(['■send=message\nHello there, streaming world!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    const llm = result.iterations[0]!.llm
    expect(llm).toBeDefined()
    expect(typeof llm!.time_to_first_token).toBe('number')
    expect(typeof llm!.time_to_last_token).toBe('number')
    expect(llm!.time_to_first_token!).toBeGreaterThanOrEqual(0)
    expect(llm!.time_to_last_token!).toBeGreaterThanOrEqual(llm!.time_to_first_token!)
    expect(llm!.ended_at - llm!.started_at).toBeGreaterThanOrEqual(llm!.time_to_last_token!)
  })

  test('non-streaming iterations do not record token timings', async () => {
    const { chat } = makeChat()
    const client = new ScriptedNonStreamingCognitive(['■send=message\nHello!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    const llm = result.iterations[0]!.llm
    expect(llm).toBeDefined()
    expect(llm!.time_to_first_token).toBeUndefined()
    expect(llm!.time_to_last_token).toBeUndefined()
  })

  test('streaming clients emit code_generation_started when a ■run block begins', async () => {
    const { chat } = makeChat()
    const getNumber = new Tool({
      name: 'getNumber',
      description: 'Returns a number',
      output: z.number(),
      handler: async () => 21,
    })

    const client = new ScriptedStreamingCognitive([
      '■send=message\nComputing...\n■run\nconst x = await getNumber()\nreturn { x }',
      '■send=message\nDone!\n■next=listen',
    ])

    const result = await executeContext({ client, chat, tools: [getNumber], options: { loop: 5 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)

    // the trace fires as soon as the ■run directive is parsed, before the
    // generation completes (llm_call_success) and the code executes
    const traces = result.iterations[0]!.traces
    const generationIndex = traces.findIndex((t) => t.type === 'code_generation_started')
    const successIndex = traces.findIndex((t) => t.type === 'llm_call_success')
    expect(generationIndex).toBeGreaterThanOrEqual(0)
    expect(generationIndex).toBeLessThan(successIndex)

    // the second response has no ■run block: no trace
    expect(result.iterations[1]!.traces.some((t) => t.type === 'code_generation_started')).toBe(false)
  })

  test('streaming clients start executing the ■run block before the stream ends', { timeout: 10_000 }, async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })

    let release!: () => void
    const toolRan = new Promise<void>((resolve) => (release = resolve))
    const sideEffect = new Tool({
      name: 'sideEffect',
      description: 'Does something',
      handler: async () => {
        release()
      },
    })

    /**
     * Streams the ■run block and the start of the ■next block (which
     * completes the run item and triggers early execution), then BLOCKS the
     * rest of the stream until the tool inside the code has run. If execution
     * only started after the stream ended, this would deadlock.
     */
    class GatedStreamingCognitive extends ScriptedCognitive {
      public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
        const content = this._nextContent()
        const gateAt = content.indexOf('■next')
        yield { output: content.slice(0, gateAt), created: Date.now() }
        yield { output: content.slice(gateAt, gateAt + 5), created: Date.now() } // '■next' — completes the ■run item
        await toolRan
        yield { output: content.slice(gateAt + 5), created: Date.now() }
        yield { created: Date.now(), finished: true, metadata: makeFakeMetadata() }
      }
    }

    const client = new GatedStreamingCognitive(['■run\nawait sideEffect()\n■next=done'])
    const result = await executeContext({ client, tools: [sideEffect], exits: [done], options: { loop: 2 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(1)
    expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
  })

  test('streaming clients strip a wrapping code fence', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedStreamingCognitive(['```\n■send=message\nFenced hello!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Fenced hello!'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
  })

  test('iterations expose token usage and a context breakdown', async () => {
    const { chat } = makeChat()
    const getNumber = new Tool({
      name: 'getNumber',
      description: 'Returns a number',
      output: z.number(),
      handler: async () => 21,
    })

    const client = new ScriptedCognitive([
      '■run\nconst x = await getNumber()\nreturn { value: x }',
      '■send=message\nThe number is **21**.\n■next=listen',
    ])

    const result = await executeContext({
      client,
      chat,
      tools: [getNumber],
      instructions: 'Help the user with numbers.',
      options: { loop: 3 },
    })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)

    const first = result.iterations[0]!.tokens!
    expect(first.input).toBe(10)
    expect(first.output).toBe(10)
    expect(first.total).toBe(20)

    // the effective context window limit allows computing % of context used
    expect(first.limit).toBe(128_000)
    expect(first.context.total / first.limit!).toBeGreaterThan(0)
    expect(first.context.total / first.limit!).toBeLessThan(1)

    // every part of the prompt is measured
    expect(first.context.framework).toBeGreaterThan(0)
    expect(first.context.instructions).toBeGreaterThan(0)
    expect(first.context.tools).toBeGreaterThan(0)
    expect(first.context.transcript).toBeGreaterThan(0)
    expect(first.context.protocol).toBeGreaterThan(0)
    expect(first.context.iterations).toBe(0)
    expect(first.context.total).toBe(
      first.context.framework +
        first.context.instructions +
        first.context.tools +
        first.context.transcript +
        first.context.protocol +
        first.context.iterations
    )

    // the second iteration carries the previous iteration's messages
    const second = result.iterations[1]!.tokens!
    expect(second.context.iterations).toBeGreaterThan(0)
    expect(second.context.total).toBeGreaterThan(first.context.total)

    // the final result aggregates the usage of all iterations
    expect(result.tokens).toEqual({ input: 20, output: 20, total: 40 })
  })

  test('options.maxTokens caps the context window and truncates the prompt', async () => {
    const instructions = 'Reply to the user. ' + 'The sky is blue and the grass is green. '.repeat(3_000)
    const done = new Exit({ name: 'done', description: 'Task completed' })

    const run = async (maxTokens?: number) => {
      const client = new ScriptedCognitive(['■next=done'])
      const result = await executeContext({ client, exits: [done], instructions, options: { loop: 2, maxTokens } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      const system = result.iterations[0]!.messages.find((m) => m.role === 'system')!
      return { length: (system.content as string).length, limit: result.iterations[0]!.tokens!.limit }
    }

    const unbounded = await run()
    const capped = await run(10_000)

    // the fake model allows 128k input tokens, so without the cap nothing is truncated
    expect(capped.length).toBeLessThan(unbounded.length)

    // the effective limit is min(override, model max)
    expect(unbounded.limit).toBe(128_000)
    expect(capped.limit).toBe(10_000)
  })

  test('a maxTokens too small to fit the prompt fails fast instead of looping', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    // No scripted responses: the failure must happen before any LLM call
    const client = new ScriptedCognitive([])

    const result = await executeContext({ client, exits: [done], options: { loop: 10, maxTokens: 100 } })

    expect(result).toBeInstanceOf(ErrorExecutionResult)
    // Terminal on the first iteration — not an execution_error retried until the loop limit
    expect(result.iterations.length).toBeLessThanOrEqual(1)
    const error = (result as ErrorExecutionResult).error
    expect(error).toBeInstanceOf(CognitiveError)
    expect((error as Error).message).toContain('context window')
    expect((error as Error).message).toContain('options.maxTokens')
  })

  test('options.maxTimeToFirstToken is forwarded to the streaming request', async () => {
    let received: any
    class ProbeCognitive extends ScriptedStreamingCognitive {
      public override async *generateTextStream(input?: any): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
        received = input
        yield* super.generateTextStream()
      }
    }

    const { chat } = makeChat()
    const client = new ProbeCognitive(['■send=message\nHello!\n■next=listen'])

    const result = await executeContext({
      client,
      chat,
      options: { loop: 2, maxTimeToFirstToken: 1_234 },
    })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(received?.options?.maxTimeToFirstToken).toBe(1_234)
  })

  test('JSON-wrapped message bodies are unwrapped before reaching the chat handler', async () => {
    const run = async (body: string) => {
      const { chat, messages } = makeChat()
      const client = new ScriptedCognitive([`■send=message\n${body}\n■next=listen`])
      const result = await executeContext({ client, chat, options: { loop: 2 } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      return { text: messages[0]?.text, result }
    }

    // single-key wrappers are unwrapped, whatever the key
    const long = 'Cloudflare Workers are like tiny couriers. '.repeat(5).trim()
    expect((await run(`{"body": ${JSON.stringify(long)}}`)).text).toBe(long)
    expect((await run('{"content": "Hello!"}')).text).toBe('Hello!')

    // the unwrap is traced
    const { result } = await run('{"body": "traced"}')
    const logs = result.iterations[0]!.traces.filter((t) => t.type === 'log')
    expect(logs.some((t) => 'message' in t && t.message.includes('Unwrapped JSON-wrapped message body'))).toBe(true)

    // legitimate bodies that merely look JSON-ish are delivered untouched
    expect((await run('{"a": 1, "b": 2}')).text).toBe('{"a": 1, "b": 2}')
    expect((await run('{not json}')).text).toBe('{not json}')
    expect((await run('plain markdown **body**')).text).toBe('plain markdown **body**')
  })

  test('progressive deltas are suppressed for JSON-looking bodies', async () => {
    const deltas: string[] = []
    const { chat, messages } = makeChat((delta) => {
      deltas.push(delta.content)
    })
    const client = new ScriptedStreamingCognitive(['■send=message\n{"body": "Hello from JSON"}\n■next=listen'])
    const result = await executeContext({ client, chat, options: { loop: 2 } })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    // no raw JSON was ever streamed as a preview
    expect(deltas.every((d) => !d.trimStart().startsWith('{'))).toBe(true)
    // the authoritative delivery got the unwrapped body
    expect(messages[0]?.text).toBe('Hello from JSON')
  })

  test('options.transcriptionModel is forwarded when the transcript has audio', async () => {
    let received: any
    class ProbeCognitive extends ScriptedStreamingCognitive {
      public override async *generateTextStream(input?: any): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
        received = input
        yield* super.generateTextStream()
      }
    }

    const run = async (options: Record<string, unknown>, attachments?: Transcript.Attachment[]) => {
      received = undefined
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [{ role: 'user', content: 'hello', attachments }],
        handler: async () => {},
      })
      const client = new ProbeCognitive(['■send=message\nHello!\n■next=listen'])
      const result = await executeContext({ client, chat, options: { loop: 2, ...options } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
    }

    const audio: Transcript.Attachment[] = [{ type: 'audio', url: 'data:audio/wav;base64,AAAA' }]

    // explicit model
    await run({ transcriptionModel: 'groq:whisper-large-v3' }, audio)
    expect(received?.options?.transcriptionModel).toBe('groq:whisper-large-v3')

    // defaults to 'fast' when audio is present
    await run({}, audio)
    expect(received?.options?.transcriptionModel).toBe('fast')

    // not sent at all when the prompt has no audio
    await run({ transcriptionModel: 'groq:whisper-large-v3' })
    expect(received?.options).toBeUndefined()
  })

  test('onExit and onTrace hooks receive the abort controller', async () => {
    const done = new Exit({ name: 'done', description: 'Task completed' })
    const client = new ScriptedCognitive(['■next=done'])

    let exitController: AbortController | undefined
    let traceController: AbortController | undefined

    const result = await executeContext({
      client,
      exits: [done],
      options: { loop: 2 },
      onExit: (_result, controller) => {
        exitController = controller
      },
      onTrace: ({ controller }) => {
        traceController ??= controller
      },
    })

    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(exitController).toBeInstanceOf(AbortController)
    expect(traceController).toBeInstanceOf(AbortController)
    expect(exitController).toBe(traceController)
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
