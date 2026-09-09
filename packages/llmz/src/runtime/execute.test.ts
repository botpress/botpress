import { CognitiveMetadata, CognitiveResponse, CognitiveStreamChunk, Model } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Chat, MessageDelta, MessageMetadata } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { RenderedComponent } from '../component.js'
import { ListenExit } from '../context.js'
import { createJsxComponent } from '../jsx.js'
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

/**
 * Streams scripted responses chunk by chunk, emitting a control-only `restart`
 * chunk between consecutive responses — the signature of a mid-stream model
 * fallback, where everything streamed before the restart is void and must be
 * discarded. Ends with a metadata-carrying chunk (or runs dry when `undefined`
 * is passed as the final chunk).
 */
class ScriptedRestartStreamingCognitive extends ScriptedCognitive {
  /** Value of the probe function recorded after each chunk was consumed downstream. */
  public probes: number[] = []

  /** True once the stream is paused in the handoff gap after a restart. */
  public handoffStarted = false

  public constructor(
    private _segments: string[],
    private _probe: () => number = () => 0,
    private _chunkSize = 7,
    private _finalChunk: CognitiveStreamChunk | null = {
      created: Date.now(),
      finished: true,
      metadata: makeFakeMetadata(),
    },
    private _metadataPerAttempt = false,
    private _handoffDelayMs = 0
  ) {
    super(_segments)
  }

  public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    for (let i = 0; i < this._segments.length; i++) {
      const content = this._segments[i]!
      for (let j = 0; j < content.length; j += this._chunkSize) {
        yield { output: content.slice(j, j + this._chunkSize), created: Date.now() }
        this.probes.push(this._probe())
      }
      if (i < this._segments.length - 1) {
        if (this._metadataPerAttempt) {
          // Real streams end each attempt with metadata; it must not survive the restart
          yield { created: Date.now(), finished: true, metadata: makeFakeMetadata() }
          this.probes.push(this._probe())
        }
        yield {
          created: Date.now(),
          restart: { attempt: i + 2, fromModel: 'fake', toModel: 'fake', reason: 'timeout' },
        }
        this.probes.push(this._probe())
        if (this._handoffDelayMs > 0) {
          this.handoffStarted = true
          await new Promise<void>((resolve) => setTimeout(resolve, this._handoffDelayMs))
        }
      }
    }
    if (this._finalChunk) {
      yield this._finalChunk
      this.probes.push(this._probe())
    }
  }
}

/**
 * Streams one chunk, then waits for the stream's abort signal before throwing —
 * mimicking a real HTTP-backed client whose stream dies when its AbortController
 * fires. Used to prove that cancelling a mid-stream-fallback generation keeps
 * whatever the parser completed before the transport died.
 */
class ScriptedAbortAwareCognitive extends ScriptedCognitive {
  public async *generateTextStream(
    _input: any,
    options?: { signal?: AbortSignal }
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const content = this._nextContent()
    yield { output: content.slice(0, 30), created: Date.now() }

    const signal: AbortSignal | undefined = options?.signal
    await new Promise<void>((resolve) => {
      if (signal?.aborted) {
        resolve()
      } else {
        signal?.addEventListener('abort', () => resolve(), { once: true })
      }
    })

    throw new Error('stream interrupted by abort')
  }
}

/**
 * Streams a complete response, then throws — the transport-level failure that
 * ends a mid-stream fallback chain once every model candidate has failed.
 */
class ScriptedChainErrorCognitive extends ScriptedCognitive {
  public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    yield { output: this._nextContent(), created: Date.now() }
    throw new Error('model chain exhausted')
  }
}

/** Options that opt in to mid-stream model fallback (options.midStreamFallback). */
const midStreamOptions = (loop: number) => ({ loop, midStreamFallback: true })

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

/** Text-delta members of a delta sequence (never control deltas). */
type TextDelta = Extract<MessageDelta, { restart: false }>
const textDeltas = (deltas: MessageDelta[]): TextDelta[] => deltas.filter((d): d is TextDelta => !d.restart)

/** Restart-control members of a delta sequence (`restart: true`). */
type RestartDelta = Extract<MessageDelta, { restart: true }>
const restartDeltas = (deltas: MessageDelta[]): RestartDelta[] => deltas.filter((d): d is RestartDelta => d.restart)

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
    const text = textDeltas(deltas)
    expect(text.length).toBeGreaterThan(1)
    expect(text.map((d) => d.delta).join('')).toBe('This is a fairly long streamed message body!')
    expect(text.at(-1)!.content).toBe('This is a fairly long streamed message body!')
    expect(new Set(text.map((d) => d.id)).size).toBe(1)
    expect(text.every((d) => d.component === 'message')).toBe(true)

    // default (no fallback): one message, one stable iteration id, no control deltas
    expect(new Set(text.map((d) => d.iterationId)).size).toBe(1)
    expect(restartDeltas(deltas)).toEqual([])

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

  describe('options.midStreamFallback', () => {
    test('sends are delivered immediately even with midStreamFallback enabled', async () => {
      const { chat, messages } = makeChat()
      const client = new ScriptedStreamingCognitive(
        ['■send=message\nBuffered hello!\n■send=message\nBuffered second\n■next=listen'],
        () => messages.length
      )

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
      expect(messages.map((m) => m.text)).toEqual(['Buffered hello!', 'Buffered second'])

      // there is no delivery queue: the first authoritative send reached the
      // chat while the stream was still in flight
      expect(client.probes.slice(0, -1).some((count) => count >= 1)).toBe(true)
    })

    test('previews stream immediately even with midStreamFallback enabled', async () => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })

      const client = new ScriptedStreamingCognitive(
        ['■send=message\nThis is a fairly long streamed message body!\n■next=listen'],
        () => deltas.length,
        5 // small chunks so the body spans many stream chunks
      )

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(messages.map((m) => m.text)).toEqual(['This is a fairly long streamed message body!'])

      // previews are no longer buffered: the body arrived progressively, chunk by chunk
      const text = textDeltas(deltas)
      expect(text.length).toBeGreaterThan(1)
      expect(text.map((d) => d.delta).join('')).toBe('This is a fairly long streamed message body!')
      expect(new Set(text.map((d) => d.id)).size).toBe(1)
      expect(new Set(text.map((d) => d.iterationId)).size).toBe(1)
      expect(restartDeltas(deltas)).toEqual([])

      // and the previews reached the client while the model was still generating
      expect(client.probes.slice(0, -1).some((count) => count >= 1)).toBe(true)
    })

    test('disables early code execution', async () => {
      const done = new Exit({ name: 'done', description: 'Task completed' })
      const { chat } = makeChat()

      let toolRan = false
      const mark = new Tool({
        name: 'mark',
        description: 'Marks that the code executed',
        handler: async () => {
          toolRan = true
        },
      })

      const client = new ScriptedStreamingCognitive(['■run\nawait mark()\n■next=done'], () => (toolRan ? 1 : 0), 7)

      const result = await executeContext({
        client,
        chat,
        tools: [mark],
        exits: [done],
        options: midStreamOptions(2),
      })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe('done')

      // the code only executed after the stream had fully completed
      expect(toolRan).toBe(true)
      expect(client.probes.every((value) => value === 0)).toBe(true)
    })

    test("sends completed before a restart stay delivered (retraction is the consumer's job)", async () => {
      const { chat, messages } = makeChat()
      // first attempt: a completed ■send and a second ■send cut off mid-body
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■send=message\nPartial',
        '■send=message\nKept!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      // the completed send was committed before the restart; the mid-body second
      // send never completed, and the restart resets the parser state so it is
      // dropped — already-sent messages are retracted by consumers via the
      // restart delta (clearPreview), not by the runtime
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Kept!'])
    })

    test('an unexpected restart throws a CognitiveError when fallback is disabled', async () => {
      const { chat } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■send=message\nKept!\n■next=listen',
      ])

      // midStreamFallback is off: a restart chunk is unexpected and must fail
      // instead of silently concatenating the attempts
      const result = await executeContext({ client, chat, options: { loop: 3 } })

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      const error = (result as ErrorExecutionResult).error
      expect(error).toBeInstanceOf(CognitiveError)
    })

    test('a ■run block completed before a restart never executes', async () => {
      const ran: string[] = []
      const log = new Tool({
        name: 'log',
        description: 'Logs a value',
        handler: async () => {
          ran.push('log')
        },
      })

      const { chat } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■run\nawait log()\n■next=listen',
        '■send=message\nKept!\n■next=listen',
      ])

      const result = await executeContext({
        client,
        chat,
        tools: [log],
        options: midStreamOptions(3),
      })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(ran).toEqual([])
      expect(result.iterations).toHaveLength(1)
    })

    test('only replacement code executes after a completed run is abandoned', async () => {
      const ran: string[] = []
      const mark = new Tool({
        name: 'mark',
        description: 'Records the attempt',
        input: z.object({ attempt: z.string() }),
        handler: async ({ attempt }) => {
          ran.push(attempt)
        },
      })
      const done = new Exit({ name: 'done', description: 'Done' })
      const client = new ScriptedRestartStreamingCognitive([
        '■run\nawait mark({ attempt: "abandoned" })\n■next=done',
        '■run\nawait mark({ attempt: "replacement" })\n■next=done',
      ])
      const result = await executeContext({ client, tools: [mark], exits: [done], options: midStreamOptions(1) })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(ran).toEqual(['replacement'])
      // the trace fires immediately per attempt (never buffered until success):
      // the abandoned ■run and the replacement ■run each emit one
      expect(result.iterations[0]!.traces.filter((trace) => trace.type === 'code_generation_started')).toHaveLength(2)
    })

    test('cancellation still fails the run but the committed send stays delivered', async () => {
      const controller = new AbortController()
      class CancelOnCompletion extends ScriptedStreamingCognitive {
        public override async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
          yield* super.generateTextStream()
          controller.abort(new Error('deadline expired'))
        }
      }
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      const client = new CancelOnCompletion(['■send=message\nBuffered\n■next=listen'])
      const result = await executeContext({ client, chat, signal: controller.signal, options: midStreamOptions(1) })
      expect(result).toBeInstanceOf(ErrorExecutionResult)
      // the send completed while the stream was still in flight; the terminal
      // abort fails the run but does not revoke already-delivered content
      expect(messages.map((m) => m.text)).toEqual(['Buffered'])
      // previews were streamed live alongside the committed send
      expect(
        textDeltas(deltas)
          .map((d) => d.delta)
          .join('')
      ).toBe('Buffered')
      expect(restartDeltas(deltas)).toEqual([])
    })

    test('multiple restarts keep every completed send; previews retract to the survivor', async () => {
      const { chat, messages } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nFirst attempt\n■next=listen',
        '■send=message\nSecond attempt\n■next=listen',
        '■send=message\nFinal!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      // each attempt sent immediately as it was parsed; the runtime keeps what
      // it already delivered and consumers retract previews per iteration on
      // each restart delta
      expect(messages.map((m) => m.text)).toEqual(['First attempt', 'Second attempt', 'Final!'])
    })

    test.each(['```', '```\n■send=message\nAbandoned!\n', '■send=button { "label":'])(
      'a restart resets incomplete parser/fence state: %s',
      async (abandoned) => {
        const { chat, messages } = makeChat()
        // both attempts are wrapped in a code fence; the first fence must not
        // leak into the replacement after the restart
        const client = new ScriptedRestartStreamingCognitive([abandoned, '```\n■send=message\nKept!\n■next=listen'])

        const result = await executeContext({ client, chat, options: midStreamOptions(3) })

        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect(messages.map((m) => m.text)).toEqual(['Kept!'])
      }
    )

    test('a metadata-less replacement fails but its completed sends stay delivered', async () => {
      const cases = [
        // the stream simply runs dry after the replacement content
        null,
        // the stream ends with a finished chunk but no replacement metadata
        { created: Date.now(), finished: true } as CognitiveStreamChunk,
      ]

      for (const finalChunk of cases) {
        const { chat, messages } = makeChat()
        const client = new ScriptedRestartStreamingCognitive(
          ['■send=message\nAbandoned!\n■next=listen', '■send=message\nStill sent\n■next=listen'],
          () => 0,
          7,
          finalChunk
        )

        const result = await executeContext({ client, chat, options: midStreamOptions(3) })

        expect(result).toBeInstanceOf(ErrorExecutionResult)
        const error = (result as ErrorExecutionResult).error
        expect(error).toBeInstanceOf(CognitiveError)
        expect((error as Error).message).toContain('without metadata')
        // sends parsed before the metadata failure were committed immediately;
        // unfinished trailing blocks are dropped because parser.finish() never runs
        expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Still sent'])
      }
    })

    test('cancelling mid-stream keeps the already completed send', async () => {
      const guard = new AbortController()
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      const client = new ScriptedAbortAwareCognitive(['■send=message\nAbandoned!\n■next=listen'])

      const execution = executeContext({ client, chat, signal: guard.signal, options: midStreamOptions(3) })

      // let the first chunk flow through the pipeline, then cancel the stream
      setTimeout(() => guard.abort(new Error('cancelled')), 20)

      const result = await execution

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      expect((result as ErrorExecutionResult).error).toMatchObject({ message: 'cancelled' })
      // the send item completed (■next opened) before the abort: it stays
      // committed even though the run fails terminally
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!'])
      expect(result.iterations[0]!.status.type).toBe('aborted')

      // the preview that streamed before the abort is left in place (best effort)
      expect(textDeltas(deltas).some((d) => d.delta.includes('Abandoned!'))).toBe(true)
      expect(restartDeltas(deltas)).toEqual([])
    })

    test('a stream error delivers completed sends but never abandoned code', async () => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      let ran = false
      const mark = new Tool({
        name: 'mark',
        description: 'Marks that the code executed',
        handler: async () => {
          ran = true
        },
      })
      const done = new Exit({ name: 'done', description: 'Task completed' })

      // The attempt fully parses a ■send and a ■run before the transport dies,
      // as when the whole model chain exhausts mid-stream
      const client = new ScriptedChainErrorCognitive(['■send=message\nBuffered!\n■run\nawait mark()\n■next=done'])

      const result = await executeContext({ client, chat, tools: [mark], exits: [done], options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
      expect(((result as ErrorExecutionResult).error as Error).message).toContain('LLM generation failed')

      // the ■send was committed as soon as it was parsed; the ■run's tool never
      // executed because tool execution stays deferred until the stream succeeds
      expect(
        textDeltas(deltas)
          .map((d) => d.delta)
          .join('')
      ).toBe('Buffered!')
      expect(messages.map((m) => m.text)).toEqual(['Buffered!'])
      expect(ran).toBe(false)
    })

    test('a restart delta is emitted even when the replacement attempt has no send', async () => {
      const deltas: MessageDelta[] = []
      const ran: string[] = []
      const mark = new Tool({
        name: 'mark',
        description: 'Records the attempt',
        input: z.object({ attempt: z.string() }),
        handler: async ({ attempt }) => {
          ran.push(attempt)
        },
      })
      const done = new Exit({ name: 'done', description: 'Done' })
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■run\nawait mark({ attempt: "replacement" })\n■next=done',
      ])
      const result = await executeContext({ client, chat, tools: [mark], exits: [done], options: midStreamOptions(1) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
      // only the abandoned attempt's send was committed (immediately as parsed);
      // the replacement attempt only runs code
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!'])
      expect(ran).toEqual(['replacement'])

      const restarts = restartDeltas(deltas)
      expect(restarts).toHaveLength(1)
      expect(restarts[0]).toMatchObject({
        restart: true,
        attempt: 2,
        fromModel: 'fake',
        toModel: 'fake',
        reason: 'timeout',
      })
      expect(typeof restarts[0]!.iterationId).toBe('string')
    })

    test('a restart delta is emitted even when the replacement attempt fails', async () => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      // the replacement attempt runs dry without metadata: the generation fails,
      // but the restart control delta was already delivered
      const client = new ScriptedRestartStreamingCognitive(
        ['■send=message\nAbandoned!\n■next=listen', '■send=message\nStill buffered\n■next=listen'],
        () => 0,
        7,
        null
      )
      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      const error = (result as ErrorExecutionResult).error
      expect(error).toBeInstanceOf(CognitiveError)
      expect((error as Error).message).toContain('without metadata')
      // both attempts' completed sends were committed before the failure
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Still buffered'])

      const restarts = restartDeltas(deltas)
      expect(restarts).toHaveLength(1)
      expect(restarts[0]).toMatchObject({
        restart: true,
        attempt: 2,
        fromModel: 'fake',
        toModel: 'fake',
        reason: 'timeout',
      })
    })

    test('renderers reset their preview when restart deltas arrive (multiple sends, multiple restarts)', async () => {
      // A minimal renderer: previews accumulate per message id inside a bucket
      // per generation. A restart tells the renderer the whole generation is
      // void, so it clears the bucket for that iteration — not just the latest
      // message — while tracking each message id separately.
      const events: Array<
        { kind: 'text'; id: string; iterationId: string } | { kind: 'restart'; attempt: number; iterationId: string }
      > = []
      const previews = new Map<string, Map<string, string>>()
      const resets: number[] = []
      const { chat, messages } = makeChat((delta) => {
        if (delta.restart) {
          resets.push(delta.attempt)
          events.push({ kind: 'restart', attempt: delta.attempt, iterationId: delta.iterationId })
          previews.delete(delta.iterationId)
        } else {
          let iterationPreviews = previews.get(delta.iterationId)
          if (iterationPreviews === undefined) {
            previews.set(delta.iterationId, (iterationPreviews = new Map()))
          }
          iterationPreviews.set(delta.id, (iterationPreviews.get(delta.id) ?? '') + delta.delta)
          events.push({ kind: 'text', id: delta.id, iterationId: delta.iterationId })
        }
      })
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■send=message\nBeta abandoned\n■next=listen',
        '■send=message\nMid attempt\n■next=listen',
        '■send=message\nDelta!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)

      const restartAt = events
        .map((event, index) => (event.kind === 'restart' ? index : -1))
        .filter((index) => index !== -1)
      expect(restartAt).toHaveLength(2)
      const firstRestart = restartAt[0]!
      const secondRestart = restartAt[1]!

      const isText = (event: (typeof events)[number]): event is { kind: 'text'; id: string; iterationId: string } =>
        event.kind === 'text'

      // every attempt belongs to the same generation: the iteration id stays
      // stable across restarts, unlike the per-message id
      expect(new Set(events.filter(isText).map((event) => event.iterationId)).size).toBe(1)

      // the first attempt streamed two sends → two distinct message ids
      const firstAttemptIds = new Set(
        events
          .slice(0, firstRestart)
          .filter(isText)
          .map((event) => event.id)
      )
      expect(firstAttemptIds.size).toBe(2)

      // each replacement attempt only started previewing after its restart
      // delta, under a message id that never appeared before
      const middleIds = new Set(
        events
          .slice(firstRestart + 1, secondRestart)
          .filter(isText)
          .map((event) => event.id)
      )
      expect(middleIds.size).toBe(1)
      expect([...middleIds].every((id) => !firstAttemptIds.has(id))).toBe(true)

      const finalIds = new Set(
        events
          .slice(secondRestart + 1)
          .filter(isText)
          .map((event) => event.id)
      )
      expect(finalIds.size).toBe(1)
      expect([...finalIds].every((id) => !firstAttemptIds.has(id) && !middleIds.has(id))).toBe(true)

      // each restart cleared the generation's previews (all of its messages):
      // only the surviving message is still rendered
      expect(resets).toEqual([2, 3])
      expect(previews.size).toBe(1)
      expect([...[...previews.values()][0]!.values()]).toEqual(['Delta!'])

      // every send was committed as it was parsed, across all attempts
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Beta abandoned', 'Mid attempt', 'Delta!'])
    })

    test('text deltas from the replacement carry a fresh message id under a stable iteration id', async () => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■send=message\nKept over here!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Kept over here!'])

      const text = textDeltas(deltas)
      const bodies = new Map<string, string>()
      for (const delta of text) {
        bodies.set(delta.id, (bodies.get(delta.id) ?? '') + delta.delta)
      }

      // the per-message id is fresh across the restart: one stable id per
      // message, differing between the abandoned and the replacement attempt
      expect(bodies.size).toBe(2)
      expect([...bodies.values()].sort()).toEqual(['Abandoned!', 'Kept over here!'])
      const ids = [...bodies.keys()]
      expect(ids[0]!).not.toBe(ids[1])
      expect(ids.every((id) => id.length > 0)).toBe(true)

      // but the iteration id is the generation id: identical across attempts
      expect(new Set(text.map((d) => d.iterationId)).size).toBe(1)

      expect(restartDeltas(deltas)).toHaveLength(1)
    })

    test('an async restart handler is awaited before the next preview', async () => {
      const events: string[] = []
      let releaseReset!: () => void
      const resetGate = new Promise<void>((resolve) => (releaseReset = resolve))
      let textBeforeResetSettled = false
      const { chat, messages } = makeChat(async (delta) => {
        if (delta.restart) {
          // block the reset handler until the test releases the gate
          events.push('reset:start')
          await resetGate
          events.push('reset:end')
        } else {
          if (events.includes('reset:start') && !events.includes('reset:end')) {
            textBeforeResetSettled = true
          }
          events.push('text')
        }
      })
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■send=message\nKept!\n■next=listen',
      ])

      const execution = executeContext({ client, chat, options: midStreamOptions(3) })

      // wait for the restart to arrive and the async reset handler to start
      await vi.waitFor(() => expect(events).toContain('reset:start'))
      // the replacement preview must not be delivered while the reset is pending
      expect(textBeforeResetSettled).toBe(false)
      expect(events).not.toContain('reset:end')

      releaseReset()
      const result = await execution

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Kept!'])

      // reset events settled (start → end) before any replacement preview
      const resetStart = events.indexOf('reset:start')
      const resetEnd = events.indexOf('reset:end')
      expect(resetStart).toBeGreaterThanOrEqual(0)
      expect(resetEnd).toBe(resetStart + 1)
      // abandoned previews streamed before the restart; the replacement only after
      expect(events.slice(0, resetStart).every((event) => event === 'text')).toBe(true)
      expect(events.slice(resetEnd + 1).length).toBeGreaterThan(0)
      expect(events.slice(resetEnd + 1).every((event) => event === 'text')).toBe(true)
      expect(textBeforeResetSettled).toBe(false)
    })

    test('a restart clears only the current iteration and leaves earlier previews intact', async () => {
      // A renderer keeps previews from previous generations on screen in
      // per-iteration buckets. A restart must only remove the bucket it names.
      const previews = new Map<string, Map<string, string>>()
      previews.set('previous-iteration', new Map([['prev-msg', 'Committed earlier message']]))

      const { chat, messages } = makeChat((delta) => {
        if (delta.restart) {
          previews.delete(delta.iterationId)
        } else {
          let iterationPreviews = previews.get(delta.iterationId)
          if (iterationPreviews === undefined) {
            previews.set(delta.iterationId, (iterationPreviews = new Map()))
          }
          iterationPreviews.set(delta.id, (iterationPreviews.get(delta.id) ?? '') + delta.delta)
        }
      })
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■send=message\nKept!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Kept!'])

      // the earlier generation's preview survived the restart untouched
      expect(previews.get('previous-iteration')).toEqual(new Map([['prev-msg', 'Committed earlier message']]))

      // only the current generation still holds provisional previews, with the
      // surviving attempt's message
      expect(previews.size).toBe(2)
      const current = [...previews.entries()].find(([key]) => key !== 'previous-iteration')![1]
      expect([...current.values()]).toEqual(['Kept!'])
    })

    test('restart delta errors are best effort and the reset precedes replacement previews', async () => {
      const events: string[] = []
      const seenMessageIds = new Set<string>()
      let resetDelivered = false
      let replacementResumedAfterReset = false
      const { chat, messages } = makeChat((delta) => {
        if (delta.restart) {
          resetDelivered = true
          events.push(`reset:${delta.attempt}`)
        } else {
          // the replacement attempt streams fresh message ids, so the first
          // unseen id proves the reset side effects ran before this preview
          if (resetDelivered && !seenMessageIds.has(delta.id)) {
            replacementResumedAfterReset = true
          }
          seenMessageIds.add(delta.id)
          events.push(`text:${delta.id}`)
        }
        // callback errors are best-effort: they must neither fail the run nor
        // prevent the restart control delta from being delivered
        throw new Error('preview handler boom')
      })

      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■next=listen',
        '■send=message\nKept!\n■next=listen',
      ])
      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Kept!'])

      // the control delta was delivered (and its side effects ran) before any
      // replacement preview, even though every callback threw
      expect(resetDelivered).toBe(true)
      expect(replacementResumedAfterReset).toBe(true)
      expect(events.filter((event) => event.startsWith('reset:'))).toHaveLength(1)
    })

    test('metadata from an abandoned attempt does not satisfy a metadata-less replacement', async () => {
      const { chat, messages } = makeChat()
      // The first attempt ends with metadata, then restarts; the replacement
      // finishes without providing its own
      const client = new ScriptedRestartStreamingCognitive(
        ['■send=message\nAbandoned!\n■next=listen', '■send=message\nStill buffered\n■next=listen'],
        () => 0,
        7,
        { created: Date.now(), finished: true },
        true
      )

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      const error = (result as ErrorExecutionResult).error
      expect(error).toBeInstanceOf(CognitiveError)
      expect((error as Error).message).toContain('without metadata')
      // both attempts' sends completed and were committed before the failure
      expect(messages.map((m) => m.text)).toEqual(['Abandoned!', 'Still buffered'])
    })

    test('a replacement handoff within the stall guard still succeeds', async () => {
      try {
        vi.useFakeTimers()
        const { chat, messages } = makeChat()
        // The replacement attempt starts after a 60s handoff — well inside the
        // 180s inactivity guard the runtime arms between chunks
        const client = new ScriptedRestartStreamingCognitive(
          ['■send=message\nAbandoned!\n', '■send=message\nReplacement output!\n■next=listen'],
          () => 0,
          7,
          undefined,
          false,
          60_000
        )

        const execution = executeContext({ client, chat, options: midStreamOptions(3) })

        // Drive the stream through the restart, then release the handoff
        for (let i = 0; i < 100 && !client.handoffStarted; i++) {
          await vi.advanceTimersByTimeAsync(1)
        }
        expect(client.handoffStarted).toBe(true)
        await vi.advanceTimersByTimeAsync(60_000)

        const result = await execution
        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
        expect(messages.map((m) => m.text)).toEqual(['Replacement output!'])
      } finally {
        vi.useRealTimers()
      }
    })

    test('a replacement handoff past the stall guard fails', async () => {
      try {
        vi.useFakeTimers()
        const { chat, messages } = makeChat()
        // The replacement handoff takes 240s — past the 180s inactivity guard
        const client = new ScriptedRestartStreamingCognitive(
          ['■send=message\nAbandoned!\n', '■send=message\nNever delivered\n■next=listen'],
          () => 0,
          7,
          undefined,
          false,
          240_000
        )

        const execution = executeContext({ client, chat, options: midStreamOptions(3) })

        for (let i = 0; i < 100 && !client.handoffStarted; i++) {
          await vi.advanceTimersByTimeAsync(1)
        }
        expect(client.handoffStarted).toBe(true)

        // Exceed the stall timeout armed after the restart chunk: the guard must
        // still be running across the handoff
        await vi.advanceTimersByTimeAsync(180_001)

        const result = await execution
        expect(result).toBeInstanceOf(ErrorExecutionResult)
        expect(((result as ErrorExecutionResult).error as Error).message).toContain('LLM stream stalled')
        expect(messages).toEqual([])
      } finally {
        vi.useRealTimers()
      }
    })

    test('restarts are traced with the chain fields and usage reflects only the surviving attempt', async () => {
      const { chat, messages } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nFirst attempt\n■send=message\nMore abandoned output\n■next=listen',
        '■send=message\nFinal!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(messages.map((m) => m.text)).toEqual(['First attempt', 'More abandoned output', 'Final!'])

      const iteration = result.iterations[0]!
      const restartTraces = iteration.traces.filter((t) => t.type === 'llm_call_restarted')
      expect(restartTraces).toHaveLength(1)
      expect(restartTraces[0]).toMatchObject({ attempt: 2, fromModel: 'fake', toModel: 'fake', reason: 'timeout' })

      // raw output and usage come from the surviving attempt only
      expect(iteration.llm!.output).toBe('■send=message\nFinal!\n■next=listen')
      expect(iteration.llm!.usage).toEqual({ inputTokens: 10, inputCost: 0, outputTokens: 10, outputCost: 0 })
      expect(iteration.tokens!.input).toBe(10)
      expect(iteration.tokens!.output).toBe(10)
      expect(iteration.tokens!.total).toBe(20)
    })

    test('options.midStreamFallback is forwarded to the streaming request', async () => {
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

      // the flag alone is forwarded
      await run({ midStreamFallback: true })
      expect(received?.options?.midStreamFallback).toBe(true)

      // combined with the time-to-first-token fallback
      await run({ midStreamFallback: true, maxTimeToFirstToken: 1_234 })
      expect(received?.options?.midStreamFallback).toBe(true)
      expect(received?.options?.maxTimeToFirstToken).toBe(1_234)

      // combined with audio transcription
      const audio: Transcript.Attachment[] = [{ type: 'audio', url: 'data:audio/wav;base64,AAAA' }]
      await run({ midStreamFallback: true }, audio)
      expect(received?.options?.midStreamFallback).toBe(true)
      expect(received?.options?.transcriptionModel).toBe('fast')
    })
  })
})

describe('Chat.handler message metadata', () => {
  type Sent = { type: string; metadata: MessageMetadata }

  /** Chat whose handler captures the new second metadata argument. */
  const makeMetadataChat = (onMessageDelta?: (delta: MessageDelta) => Promise<void> | void) => {
    const sent: Sent[] = []
    const chat = new Chat({
      components: [DefaultComponents.Text, DefaultComponents.Button],
      transcript: [{ role: 'user', content: 'hello', name: 'user' }],
      handler: async (component: RenderedComponent, metadata: MessageMetadata) => {
        sent.push({ type: component.type, metadata })
      },
      onMessageDelta,
    })
    return { chat, sent }
  }

  test('tool-yielded messages also receive unique ids scoped to the runtime iteration', async () => {
    const { chat, sent } = makeMetadataChat()
    const notify = new Tool({
      name: 'notify',
      description: 'Emits two messages',
      handler: async function* () {
        yield createJsxComponent({ type: 'MESSAGE', props: {}, children: ['One'] })
        yield createJsxComponent({ type: 'MESSAGE', props: {}, children: ['Two'] })
      },
    })
    const client = new ScriptedStreamingCognitive(['■run\nawait notify()\n■next=listen'])
    const result = await executeContext({ client, chat, tools: [notify], options: { loop: 1 } })
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(sent).toHaveLength(2)
    expect(new Set(sent.map(({ metadata }) => metadata.id)).size).toBe(2)
    expect(sent.every(({ metadata }) => metadata.iterationId === result.iterations[0]!.id)).toBe(true)
  })

  test('streaming: a completed send shares its ids with the text deltas for the same component', async () => {
    const deltas: MessageDelta[] = []
    const { chat, sent } = makeMetadataChat((delta) => {
      deltas.push(delta)
    })
    const client = new ScriptedStreamingCognitive([
      '■send=message\nFirst message!\n■send=message\nSecond message!\n■next=listen',
    ])

    await executeContext({ client, chat, options: { loop: 3 } })

    const text = textDeltas(deltas)
    const deltaIds = [...new Set(text.map((d) => d.id))]
    expect(deltaIds).toHaveLength(2)

    // the consumer persists under both the delta id and the handler metadata
    // id (two records, one per message) — both must point at the same send
    expect(sent.map((s) => s.metadata.id)).toEqual(deltaIds)
    expect(new Set(sent.map((s) => s.metadata.id)).size).toBe(2)
    expect(sent.every((s) => s.metadata.iterationId === text[0]!.iterationId)).toBe(true)
  })

  test('components without body text get handler metadata even though no deltas stream', async () => {
    const deltas: MessageDelta[] = []
    const { chat, sent } = makeMetadataChat((delta) => {
      deltas.push(delta)
    })
    const client = new ScriptedStreamingCognitive([
      '■send=button { label: "Buy", action: "postback", value: "buy" }\n■next=listen',
    ])

    await executeContext({ client, chat, options: { loop: 3 } })

    // a prop-only component has no body characters, so no deltas are emitted
    expect(textDeltas(deltas)).toEqual([])
    expect(sent).toHaveLength(1)
    expect(sent[0]!.type).toBe('BUTTON')
    expect(sent[0]!.metadata.id.startsWith(`${sent[0]!.metadata.iterationId}:`)).toBe(true)
    expect(sent[0]!.metadata.iterationId.length).toBeGreaterThan(0)
  })

  test('handler metadata flows even when onMessageDelta is not registered', async () => {
    const { chat, sent } = makeMetadataChat()
    const client = new ScriptedStreamingCognitive(['■send=message\nStill metadated!\n■next=listen'])

    await executeContext({ client, chat, options: { loop: 3 } })

    expect(sent).toHaveLength(1)
    expect(sent[0]!.metadata.id.startsWith(`${sent[0]!.metadata.iterationId}:`)).toBe(true)
    expect(sent[0]!.metadata.id).not.toBe(sent[0]!.metadata.iterationId)
  })

  test('across a fallback restart handler ids are attempt-specific while the iteration id stays stable', async () => {
    const { chat, sent } = makeMetadataChat(() => {})
    const client = new ScriptedRestartStreamingCognitive([
      '■send=message\nAbandoned!\n■next=listen',
      '■send=message\nSurvivor!\n■next=listen',
    ])

    await executeContext({ client, chat, options: midStreamOptions(3) })

    expect(sent).toHaveLength(2)
    // fallback ids embed the attempt: :1: for the abandoned, :2: for the survivor
    expect(sent[0]!.metadata.id.includes(':1:')).toBe(true)
    expect(sent[1]!.metadata.id.includes(':2:')).toBe(true)
    expect(sent[0]!.metadata.id).not.toBe(sent[1]!.metadata.id)
    // one stable iteration id across both attempts
    expect(new Set(sent.map((s) => s.metadata.iterationId)).size).toBe(1)
  })

  test('non-streaming sends get unique send-index metadata ids', async () => {
    const { chat, sent } = makeMetadataChat()
    const client = new ScriptedCognitive([
      '■send=message\nOne!\n■send=message\nTwo!\n■send=button { label: "Go", action: "say", value: "go" }\n■next=listen',
    ])

    await executeContext({ client, chat, options: { loop: 3 } })

    expect(sent).toHaveLength(3)
    expect(new Set(sent.map((s) => s.metadata.id)).size).toBe(3)
    const iterationId = sent[0]!.metadata.iterationId
    expect(sent.map((s) => s.metadata.id)).toEqual([
      `${iterationId}:send-0`,
      `${iterationId}:send-1`,
      `${iterationId}:send-2`,
    ])
  })

  test('handler deliveries are awaited: abandoned and replacement sends settle in stream order across a restart', async () => {
    const events: string[] = []
    const chat = new Chat({
      components: [DefaultComponents.Text],
      transcript: [{ role: 'user', content: 'hello', name: 'user' }],
      handler: async (_component: RenderedComponent, metadata: MessageMetadata) => {
        // simulate slow persistence: the runtime must await it before moving on
        await new Promise<void>((resolve) => setTimeout(resolve, 10))
        events.push(`handler:${metadata.id}`)
      },
      onMessageDelta: (delta) => {
        events.push(delta.restart ? 'reset' : `delta:${delta.id}`)
      },
    })
    const client = new ScriptedRestartStreamingCognitive([
      '■send=message\nAbandoned!\n■next=listen',
      '■send=message\nSurvivor!\n■next=listen',
    ])

    await executeContext({ client, chat, options: midStreamOptions(3) })

    const handlerEvents = events.filter((e) => e.startsWith('handler:')).map((e) => e.slice('handler:'.length))
    expect(handlerEvents).toHaveLength(2)
    expect(handlerEvents[0]).not.toBe(handlerEvents[1])

    // the abandoned send's handler settled before the reset delta was emitted,
    // and the survivor's after it — every delivery is awaited in stream order
    expect(events.indexOf('reset')).toBeGreaterThan(events.indexOf(`handler:${handlerEvents[0]}`))
    expect(events.indexOf('reset')).toBeLessThan(events.indexOf(`handler:${handlerEvents[1]}`))
  })
})
