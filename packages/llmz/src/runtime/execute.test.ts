import { CognitiveMetadata, CognitiveResponse, CognitiveStreamChunk, Model } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Chat, MessageDelta, MessageMetadata } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { Component, RenderedComponent } from '../component.js'
import { ListenExit } from '../context.js'
import { createJsxComponent } from '../jsx.js'
import { CognitiveError, ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Example } from '../example.js'
import { ErrorExecutionResult, SuccessExecutionResult } from '../result.js'
import { _CustomModelClient } from '../custom-client.js'
import { Tool } from '../tool.js'
import { Transcript } from '../transcript.js'
import { qwenProtocolFailures } from './fixtures/qwen-protocol-failures.js'
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

/** Block-focused fixtures below describe the envelope contents. Raw malformed envelopes
 * are tested without this helper in protocol-adherence.test.ts and the framed tests. */
const wire = (blocks: string): string =>
  /^■(?:send[=\s]|run(?:\n|$)|next[=\s])/.test(blocks) ? `■start\n${blocks}\n■end` : blocks

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
    return wire(content)
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
      const content = wire(this._segments[i]!)
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
  describe('framed response execution', () => {
    const modes = ['nonstreaming', 'whole', 'characters', 'chunks', 'fallback', 'restart'] as const
    test.each(modes)('%s ignores trailing blocks after ■end without retries or side effects', async (mode) => {
      const called = vi.fn(async () => undefined)
      const forbidden = vi.fn(async () => undefined)
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const raw =
        '■start\n■send=message\nDone.\n■run\nawait record()\n■next=listen\n■end■start\n■send=message\nDiscarded\n■run\nawait forbidden()\n■next=listen\n■end'
      const client =
        mode === 'nonstreaming'
          ? new ScriptedNonStreamingCognitive([raw])
          : mode === 'restart'
            ? new ScriptedRestartStreamingCognitive(['■start\n■send=message\nAbandoned', raw], undefined, 1)
            : new ScriptedStreamingCognitive(
                [raw],
                undefined,
                mode === 'whole' ? 100_000 : mode === 'characters' ? 1 : 7
              )
      const result = await executeContext({
        client,
        chat,
        tools: [new Tool({ name: 'record', handler: called }), new Tool({ name: 'forbidden', handler: forbidden })],
        options: { loop: 1, midStreamFallback: mode === 'fallback' || mode === 'restart' },
      })
      expect(result.isSuccess()).toBe(true)
      expect(result.iterations.map((iteration) => iteration.status.type)).toEqual(['exit_success'])
      expect(called).toHaveBeenCalledOnce()
      expect(forbidden).not.toHaveBeenCalled()
      expect(messages).toEqual([{ type: 'MESSAGE', text: 'Done.', props: {} }])
      expect(
        textDeltas(deltas).every((delta) => ['Done.', 'Abandoned'].some((text) => text.startsWith(delta.content)))
      ).toBe(true)
      expect(restartDeltas(deltas)).toHaveLength(mode === 'restart' ? 1 : 0)
      expect(result.iterations[0]!.llm?.output).toBe(raw)
      expect(result.iterations[0]!.llm?.diagnostics).toEqual([
        { code: 'unexpected-text', message: 'Discarded content after ■end' },
      ])
    })

    test.each([false, true])(
      'accepts the exact HTML failure response without a failed iteration (streaming=%s)',
      async (streaming) => {
        const raw =
          '■start\n■run\nconst result = await getDocumentation({topic: "HTML forms"});\nreturn result.content;\n■end■start\n■end'
        const lookup = vi.fn(async () => ({ content: 'Form documentation' }))
        const { chat, messages } = makeChat()
        const responses = [raw, '■start\n■send=message\nForm documentation\n■next=listen\n■end']
        const result = await executeContext({
          client: streaming
            ? new ScriptedStreamingCognitive(responses, undefined, 1)
            : new ScriptedNonStreamingCognitive(responses),
          chat,
          tools: [new Tool({ name: 'getDocumentation', input: z.object({ topic: z.string() }), handler: lookup })],
          options: { loop: 2 },
        })
        expect(result.isSuccess()).toBe(true)
        expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
          'thinking_requested',
          'exit_success',
        ])
        expect(lookup).toHaveBeenCalledOnce()
        expect(lookup).toHaveBeenCalledWith({ topic: 'HTML forms' }, expect.any(Object))
        expect(messages.map((message) => message.text)).toEqual(['Form documentation'])
        expect(result.iterations[0]!.llm?.output).toBe(raw)
      }
    )

    test.each(modes)(
      '%s commits sends and code only after the full envelope and successful transport',
      async (mode) => {
        const called = vi.fn(async () => undefined)
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const raw = '■start\n■send=message\nChecking.\n■run\nawait record()\n■next=listen\n■end'
        const probe = () => messages.length + called.mock.calls.length
        const client =
          mode === 'nonstreaming'
            ? new ScriptedNonStreamingCognitive([raw])
            : mode === 'restart'
              ? new ScriptedRestartStreamingCognitive(
                  ['■start\n■send=message\nAbandoned\n■run\nawait record()\n■next=listen\n■end', raw],
                  probe,
                  1
                )
              : new ScriptedStreamingCognitive([raw], probe, mode === 'whole' ? 100_000 : mode === 'characters' ? 1 : 7)
        const result = await executeContext({
          client,
          chat,
          tools: [new Tool({ name: 'record', handler: called })],
          options: { loop: 1, midStreamFallback: mode === 'fallback' || mode === 'restart' },
        })
        expect(result.isSuccess()).toBe(true)
        expect(called).toHaveBeenCalledOnce()
        expect(messages).toEqual([{ type: 'MESSAGE', text: 'Checking.', props: {} }])
        if ('probes' in client) expect(client.probes.every((value) => value === 0)).toBe(true)
        expect(result.iterations[0]!.llm?.output).toBe(wire(raw))
        expect(result.iterations[0]!.llm?.diagnostics).toEqual([])
        expect(
          textDeltas(deltas).every((delta) => ['Checking.', 'Abandoned'].some((text) => text.startsWith(delta.content)))
        ).toBe(true)
        expect(restartDeltas(deltas)).toHaveLength(mode === 'restart' ? 1 : 0)
      }
    )

    test.each(['nonstreaming', 'characters'] as const)(
      '%s rejects a missing envelope end and repairs without running abandoned code',
      async (mode) => {
        const called = vi.fn(async () => undefined)
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const invalid = '■start\n■send=message\nAbandoned\n■run\nawait record()\n■next=listen'
        const corrected = '■start\n■send=message\nDone.\n■next=listen\n■end'
        const client =
          mode === 'nonstreaming'
            ? new ScriptedNonStreamingCognitive([invalid, corrected])
            : new ScriptedStreamingCognitive([invalid, corrected], undefined, 1)
        const result = await executeContext({
          client,
          chat,
          tools: [new Tool({ name: 'record', handler: called })],
          options: { loop: 2 },
        })
        expect(result.isSuccess()).toBe(true)
        expect(result.iterations.map((i) => i.status.type)).toEqual(['invalid_code_error', 'exit_success'])
        expect(called).not.toHaveBeenCalled()
        expect(messages).toEqual([{ type: 'MESSAGE', text: 'Done.', props: {} }])
        expect(result.iterations[0]!.llm?.output).toBe(invalid)
        expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(
          expect.objectContaining({ code: 'invalid-envelope' })
        )
        expect(restartDeltas(deltas)).toHaveLength(mode === 'nonstreaming' ? 0 : 1)
      }
    )

    test.each(['truncated', 'missing-metadata', 'throw'] as const)(
      'retracts previews and runs no code when framed transport fails: %s',
      async (failure) => {
        const raw = '■start\n■send=message\nPreview\n■run\nawait record()\n■next=listen\n■end'
        const called = vi.fn(async () => undefined)
        class FailedTransport extends ScriptedCognitive {
          public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
            yield { output: raw, created: 1 }
            if (failure === 'throw') throw new Error('Connection lost')
            if (failure === 'truncated')
              yield { finished: true, metadata: { ...makeFakeMetadata(), stopReason: 'max_tokens' }, created: 2 }
          }
        }
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const result = await executeContext({
          client: new FailedTransport([]),
          chat,
          tools: [new Tool({ name: 'record', handler: called })],
          options: { loop: 1 },
        })
        expect(result.isError()).toBe(true)
        expect(called).not.toHaveBeenCalled()
        expect(messages).toEqual([])
        expect(
          textDeltas(deltas)
            .map((d) => d.delta)
            .join('')
        ).toBe('Preview')
        expect(deltas.at(-1)).toMatchObject({ restart: true })
        expect(result.iterations[0]!.llm?.output).toBe(raw)
        expect(result.iterations[0]!.llm?.status).toBe('error')
      }
    )
  })

  describe('observed Qwen protocol failures', () => {
    const modes = ['nonstreaming', 'whole', 'characters', 'chunks', 'fallback', 'restart'] as const
    test.each(qwenProtocolFailures.flatMap((fixture) => modes.map((mode) => ({ ...fixture, mode }))))(
      '$name ($mode) never leaks, duplicates, or silently drops the customer reply',
      async ({ output, reply, mode }) => {
        const repair = `■send=message\n${reply}\n■next=listen`
        const responses = [output, repair]
        class RestartThenReplay extends ScriptedStreamingCognitive {
          private _first = true
          public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
            if (this._first) {
              this._first = false
              yield { created: 1, output: 'Abandoned thinking' }
              yield { created: 2, restart: { attempt: 2, fromModel: 'A', toModel: 'B', reason: 'timeout' } }
            }
            yield* super.generateTextStream()
          }
        }
        const client =
          mode === 'nonstreaming'
            ? new ScriptedNonStreamingCognitive(responses)
            : mode === 'restart'
              ? new RestartThenReplay(responses, undefined, 1)
              : new ScriptedStreamingCognitive(
                  responses,
                  undefined,
                  mode === 'whole' ? 100_000 : mode === 'characters' ? 1 : 7
                )
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const onExit = vi.fn()
        const result = await executeContext({
          client,
          chat,
          onExit,
          options: { loop: 2, midStreamFallback: mode === 'fallback' || mode === 'restart' },
        })
        // Assert all observed callbacks, not just the final state after a restart.
        expect(messages).toEqual([{ type: 'MESSAGE', text: reply, props: {} }])
        expect(textDeltas(deltas).every((delta) => reply.startsWith(delta.content))).toBe(true)
        expect(
          textDeltas(deltas)
            .map((delta) => delta.delta)
            .join('')
        ).toBe(mode === 'nonstreaming' ? '' : reply)
        expect(result.isSuccess()).toBe(true)
        expect(result.iterations).toHaveLength(2)
        expect(onExit).toHaveBeenCalledOnce()
        expect(result.iterations[0]!.llm?.output).toBe(wire(output))
        expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(
          expect.objectContaining({ code: 'invalid-envelope' })
        )
      }
    )
  })

  describe('discarded reply followed by an exit', () => {
    const malformed =
      "Let's get started on helping you choose a plan! To give you an accurate recommendation, I need a few details.\n\nFirst, roughly how many **conversations** (not messages or visits) do you expect to have per month? If you're not sure yet, let me know and I'll explain how to estimate it.\n\n■next=listen"
    const answer = 'Roughly how many conversations do you expect per month?'
    const corrected = `■send=message\n${answer}\n■next=listen`
    const modes = ['nonstreaming', 'whole', 'characters', 'chunks', 'fallback'] as const
    const clientFor = (mode: (typeof modes)[number], responses: string[]) =>
      mode === 'nonstreaming'
        ? new ScriptedNonStreamingCognitive(responses)
        : new ScriptedStreamingCognitive(responses, () => 0, mode === 'whole' ? 10000 : mode === 'characters' ? 1 : 7)

    test.each(modes)('%s repairs the captured reply without ever delivering unmarked text', async (mode) => {
      const delivered: string[] = []
      const deltas: string[] = []
      const onExit = vi.fn()
      const result = await executeContext({
        client: clientFor(mode, [malformed, corrected]),
        chat: new Chat({
          components: [DefaultComponents.Text],
          transcript: [{ role: 'user', content: 'Help me choose a plan' }],
          handler: async (message) => {
            delivered.push(message.children.join(''))
          },
          onMessageDelta: (delta) => {
            if (!delta.restart) {
              deltas.push(delta.content)
              expect(answer.startsWith(delta.content)).toBe(true)
            }
          },
        }),
        onExit,
        options: { loop: 2, midStreamFallback: mode === 'fallback' },
      })
      expect(result.isSuccess()).toBe(true)
      expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
        'invalid_code_error',
        'exit_success',
      ])
      expect(onExit).toHaveBeenCalledOnce()
      expect(delivered).toEqual([answer])
      if (mode !== 'nonstreaming') expect(deltas.length).toBeGreaterThan(0)
      expect(result.iterations[0]!.llm?.output).toBe(malformed)
      expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'invalid-envelope' })
      )
      const repair = String(result.iterations[1]!.messages.at(-1)!.content)
      expect(repair).toContain('■start')
      expect(repair).toContain('Keep private reasoning')
      expect(repair).toContain('■send= followed by an available message type')
    })

    test.each(modes)('%s fails within the budget if every reply omits the send marker', async (mode) => {
      const handler = vi.fn()
      const onMessageDelta = vi.fn()
      const onExit = vi.fn()
      const result = await executeContext({
        client: clientFor(mode, [malformed, malformed]),
        chat: new Chat({ components: [DefaultComponents.Text], handler, onMessageDelta }),
        onExit,
        options: { loop: 2, midStreamFallback: mode === 'fallback' },
      })
      expect(result.isError()).toBe(true)
      expect(result.iterations).toHaveLength(2)
      expect(result.iterations.every((iteration) => iteration.status.type === 'invalid_code_error')).toBe(true)
      expect(handler).not.toHaveBeenCalled()
      expect(onMessageDelta).not.toHaveBeenCalled()
      expect(onExit).not.toHaveBeenCalled()
    })

    test.each(modes)('%s permits intentional silence, including after correcting private reasoning', async (mode) => {
      const handler = vi.fn()
      for (const responses of [['■next=listen'], ['I should wait for the user.\n■next=listen', '■next=listen']]) {
        const result = await executeContext({
          client: clientFor(mode, responses),
          chat: new Chat({ components: [DefaultComponents.Text], handler }),
          options: { loop: 2, midStreamFallback: mode === 'fallback' },
        })
        expect(result.isSuccess()).toBe(true)
        expect(result.iterations).toHaveLength(responses.length)
      }
      expect(handler).not.toHaveBeenCalled()
    })

    test.each(modes)('%s keeps completed tool side effects and their results during format repair', async (mode) => {
      const write = vi.fn(async () => ({ receipt: 'receipt-123' }))
      const tool = new Tool({ name: 'saveRecord', output: z.object({ receipt: z.string() }), handler: write })
      const delivered: string[] = []
      const result = await executeContext({
        client: clientFor(mode, [
          '■run\nconst saved = await saveRecord(); return saved',
          'Your record is saved.\n■next=listen',
          '■send=message\nSaved as receipt-123.\n■next=listen',
        ]),
        tools: [tool],
        chat: new Chat({
          components: [DefaultComponents.Text],
          handler: async (m) => {
            delivered.push(m.children.join(''))
          },
        }),
        options: { loop: 3, midStreamFallback: mode === 'fallback' },
      })
      expect(result.isSuccess()).toBe(true)
      expect(write).toHaveBeenCalledOnce()
      expect(delivered).toEqual(['Saved as receipt-123.'])
      expect(result.iterations[0]!.variables.saved).toEqual({ receipt: 'receipt-123' })
      const repair = JSON.stringify(result.iterations[2]!.messages)
      expect(repair).toContain('receipt-123')
      expect(repair).toContain('receipt-123')
      expect(result.iterations[0]!.traces.some((trace) => trace.type === 'code_execution')).toBe(true)
    })

    test('rejects a silent custom chat exit but leaves worker-mode exits valid', async () => {
      const done = new Exit({ name: 'done', description: 'Finish' })
      const malformed = 'Here is your answer.\n■next=done'
      const onExit = vi.fn()
      const chat = await executeContext({
        client: new ScriptedNonStreamingCognitive([malformed]),
        chat: new Chat({ components: [DefaultComponents.Text], handler: vi.fn() }),
        exits: [done],
        onExit,
        options: { loop: 1 },
      })
      expect(chat.isError()).toBe(true)
      expect(onExit).not.toHaveBeenCalled()
      const worker = await executeContext({ client: new ScriptedNonStreamingCognitive(['■next=done']), exits: [done] })
      expect(worker.isSuccess()).toBe(true)
    })

    test('a discarded abandoned attempt does not invalidate a clean replacement exit', async () => {
      const result = await executeContext({
        client: new ScriptedRestartStreamingCognitive([malformed, '■next=listen'], () => 0, 1),
        chat: new Chat({ components: [DefaultComponents.Text], handler: vi.fn() }),
        options: { loop: 1, midStreamFallback: true },
      })
      expect(result.isSuccess()).toBe(true)
      expect(result.iterations[0]!.llm?.diagnostics).toEqual([])
    })

    test('repairs the surviving malformed response after a provider restart', async () => {
      class RestartThenRepair extends ScriptedStreamingCognitive {
        private _first = true
        public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
          if (this._first) {
            this._first = false
            yield { created: 1, output: 'Abandoned private thoughts' }
            yield { created: 2, restart: { attempt: 2, fromModel: 'A', toModel: 'B', reason: 'timeout' } }
          }
          yield* super.generateTextStream()
        }
      }
      const handler = vi.fn()
      const deltas: MessageDelta[] = []
      const result = await executeContext({
        client: new RestartThenRepair([malformed, corrected], () => 0, 1),
        chat: new Chat({
          components: [DefaultComponents.Text],
          handler,
          onMessageDelta: (delta) => {
            deltas.push({ ...delta })
          },
        }),
        options: { loop: 2, midStreamFallback: true },
      })
      expect(result.isSuccess()).toBe(true)
      expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
        'invalid_code_error',
        'exit_success',
      ])
      expect(handler).toHaveBeenCalledOnce()
      expect(deltas[0]).toMatchObject({ restart: true })
      expect(
        deltas.filter((delta) => !delta.restart).every((delta) => !delta.restart && answer.startsWith(delta.content))
      ).toBe(true)
      expect(result.iterations[0]!.llm?.output).toBe(malformed)
    })
  })

  test.each(['nonstreaming', 'whole', 'characters', 'fallback'] as const)(
    '%s never delivers messages or runs tools after a terminal exit',
    async (mode) => {
      const raw =
        '■send=message\nDone.\n■next=listen\n■send=message\nDuplicate\n■run\nawait chargeAgain()\n■next=listen'
      const client =
        mode === 'nonstreaming'
          ? new ScriptedNonStreamingCognitive([raw])
          : new ScriptedStreamingCognitive([raw], undefined, mode === 'whole' ? 100_000 : 1)
      const charge = vi.fn(async () => undefined)
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const result = await executeContext({
        client,
        chat,
        tools: [new Tool({ name: 'chargeAgain', handler: charge })],
        options: { loop: 1, midStreamFallback: mode === 'fallback' },
      })
      expect(messages).toEqual([])
      expect(
        textDeltas(deltas)
          .map((delta) => delta.delta)
          .join('')
      ).toBe(mode === 'nonstreaming' ? '' : 'Done.')
      expect(charge).not.toHaveBeenCalled()
      expect(result.isError()).toBe(true)
      expect(result.iterations[0]!.llm?.output).toBe(wire(raw))
      expect(result.iterations[0]!.llm?.diagnostics).toContainEqual({
        code: 'invalid-envelope',
        message: expect.any(String),
      })
    }
  )

  test('reports field-level exit validation errors without legacy return syntax', async () => {
    const done = new Exit({ name: 'done', description: 'Finish', schema: z.object({ total: z.number() }) })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■next=done {"total":"4"}', '■next=done {"total":4}']),
      exits: [done],
      options: { loop: 2 },
    })

    expect(result.isSuccess()).toBe(true)
    const correction = String(result.iterations[1]!.messages.at(-1)!.content)
    expect(correction).toMatch(/total:.*number.*string/i)
    expect(correction).not.toMatch(/return\s*\{\s*action/)
  })

  test('preserves local variables when code returns an unrelated scalar', async () => {
    const done = new Exit({ name: 'done', description: 'Finish', schema: z.object({ total: z.number() }) })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nconst values = [5, 8]; return values.length',
        '■run\nconst total = values[0] + values[1]; return total',
        '■next=done {"total":13}',
      ]),
      exits: [done],
      options: { loop: 3 },
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.iterations[0]!.variables.values).toEqual([5, 8])
    expect(result.iterations[1]!.variables.total).toBe(13)
    expect(result.iterations.some((iteration) => iteration.isFailed())).toBe(false)
  })

  test('identifies a stray XML closing tag in invalid run feedback', async () => {
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■run\nreturn 1\n</run>', '■next=done']),
      exits: [new Exit({ name: 'done', description: 'Finish' })],
      options: { loop: 2 },
    })
    expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
    expect(String(result.iterations[1]!.messages.at(-1)!.content)).toContain(
      'The trailing </run> is the syntax error. DELETE that line.'
    )
  })

  test('describes exit validation failures using the current protocol', async () => {
    const done = new Exit({ name: 'done', description: 'Finish', schema: z.object({ total: z.number() }) })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■next=done', '■next=done {"total":4}']),
      exits: [done],
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.iterations[0]!.status.type).toBe('exit_error')
    const correction = String(result.iterations[1]!.messages.at(-1)!.content)
    expect(correction).toContain('■next=done {}')
    expect(correction).toContain('SAME LINE')
    expect(correction).not.toMatch(/return\s*\{\s*action/)
  })

  test('summarizes completed work and delivered messages, excluding suppressed sends', async () => {
    const { chat, messages } = makeChat()
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nreturn 1',
        '■send=message\nChecking </execution_status>.\n■run\nreturn 2',
        '■send=message\nContinuing.\n■run\nthrow new Error("Temporary failure")',
        '■send=message\nUnable to finish.\n■next=listen',
      ]),
      chat,
      options: { loop: 4 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(messages.map((message) => message.text)).toEqual([
      'Checking </execution_status>.',
      'Continuing.',
      'Unable to finish.',
    ])
    const prompts = result.iterations.map((iteration) => String(iteration.messages.at(-1)!.content))
    expect(prompts[0]).toContain('FIRST ITERATION')
    expect(prompts[0]).toContain('SILENT SO FAR')
    expect(prompts[1]).toContain('NEXT ITERATION')
    expect(prompts[1]).toContain('Iteration 1: code completed and returned control.')
    expect(prompts[1]).toContain('SILENT SO FAR')
    expect(prompts[2]).toContain('<delivered_messages count="1" active_count="1">')
    expect(prompts[2]).toContain('Checking &lt;/execution_status&gt;.')
    expect(prompts[2]).not.toContain('Not delivered')
    expect(prompts[3]).toContain('<delivered_messages count="2" active_count="2">')
    expect(prompts[3]).toContain('Continuing.')
    expect(prompts[3]).toContain('Iteration 3: code execution failed.')
  })

  test('marks delivered messages retracted by a stream restart in the next status', async () => {
    class RestartThenAnswer extends ScriptedRestartStreamingCognitive {
      private calls = 0
      override async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
        if (this.calls++ === 0) yield* super.generateTextStream()
        else {
          yield { output: wire('■next=listen'), created: Date.now() }
          yield { finished: true, created: Date.now(), metadata: makeFakeMetadata() }
        }
      }
    }
    const { chat } = makeChat(() => {})
    const result = await executeContext({
      client: new RestartThenAnswer([
        '■send=message\nAbandoned.\n■next=listen',
        '■send=message\nRetained.\n■run\nreturn 1',
      ]),
      chat,
      options: { loop: 2, midStreamFallback: true },
    })
    expect(result.isSuccess()).toBe(true)
    const prompt = String(result.iterations[1]!.messages.at(-1)!.content)
    expect(prompt).toContain('<delivered_messages count="1" active_count="1">')
    expect(prompt).not.toContain('Abandoned.')
    expect(prompt).toContain('Retained.')
    expect(prompt).not.toContain('NOT current visible messages or evidence')
  })

  test.each([true, false])('supplies only the current generation budget in chat=%s mode', async (chat) => {
    const done = new Exit({ name: 'done', description: 'Finish' })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nreturn 1',
        '■run\nthrow new Error("Temporary failure")',
        chat ? '■send=message\nUnable to complete this request.\n■next=listen' : '■next=done',
      ]),
      chat: chat
        ? new Chat({ components: [DefaultComponents.Text], transcript: [], handler: async () => {} })
        : undefined,
      exits: [done],
      options: { loop: 3 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.iterations).toHaveLength(3)
    for (const [index, iteration] of result.iterations.entries()) {
      const prompt = iteration.messages.map((message) => String(message.content)).join('\n')
      expect(iteration.messages[0]!.content).toEqual(result.iterations[0]!.messages[0]!.content)
      const lastMessage = iteration.messages.at(-1)!
      expect(lastMessage.role).toBe('user')
      expect(String(lastMessage.content)).toContain('<execution_status>')
      expect(String(lastMessage.content).lastIndexOf('■end')).toBeGreaterThan(
        String(lastMessage.content).indexOf('</execution_budget>')
      )
      for (const message of iteration.messages.slice(0, -1)) {
        expect(String(message.content)).not.toMatch(/<execution_status>|<execution_budget /)
      }
      expect(prompt.match(/<execution_status>/g)).toHaveLength(1)
      expect(prompt.match(/<execution_budget /g)).toHaveLength(1)
      expect(prompt).toContain(`<execution_budget current="${index + 1}" limit="3" remaining="${2 - index}">`)
      expect(prompt.includes('LAST ITERATION')).toBe(index === 2)
      if (index === 2) {
        expect(prompt).toContain('there will be NO further model response')
        expect(prompt).toContain(chat ? 'If the task remains unresolved' : 'Never invent required values')
      }
    }
  })

  test('keeps attachments and user text intact when replacing execution state', async () => {
    const attachments: Transcript.Attachment[] = [
      { type: 'image', url: 'https://example.com/account.png' },
      { type: 'audio', url: 'data:audio/wav;base64,AAAA' },
    ]
    const userText = 'Explain the literal tags <execution_status> and <execution_budget current="99">.'
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■run\nreturn 1', '■next=listen']),
      chat: new Chat({
        components: [DefaultComponents.Text],
        transcript: [{ role: 'user', content: userText, attachments }],
        handler: async () => {},
      }),
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(true)
    const firstContent = result.iterations[0]!.messages.at(-1)!.content
    expect(Array.isArray(firstContent)).toBe(true)
    if (!Array.isArray(firstContent)) throw new Error('Expected multipart content')
    expect(firstContent).toEqual(expect.arrayContaining(attachments))
    expect(firstContent.at(-1)).toEqual({
      type: 'text',
      text: expect.stringContaining('<execution_budget current="1" limit="2" remaining="1">'),
    })
    const retainedContent = result.iterations[1]!.messages[1]!.content
    expect(retainedContent).toEqual(firstContent.slice(0, -1))
    expect(JSON.stringify(retainedContent)).toContain('<execution_status>')
    expect(JSON.stringify(retainedContent)).toContain('Explain the literal tags')
    expect(String(result.iterations[1]!.messages.at(-1)!.content)).toContain(
      '<execution_budget current="2" limit="2" remaining="0">'
    )
    // Earlier request records keep the state actually sent at that time.
    expect(result.iterations[0]!.messages.at(-1)!.content).toEqual(firstContent)
  })

  test('marks the first response as final when only one generation is allowed', async () => {
    const done = new Exit({ name: 'done', description: 'Finish' })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■next=done']),
      exits: [done],
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(true)
    const prompt = String(result.iterations[0]!.messages.at(-1)!.content)
    expect(prompt).toContain('<execution_budget current="1" limit="1" remaining="0">')
    expect(prompt).toContain('LAST ITERATION')
  })

  test('preserves variables and every failed parallel tool result for recovery', async () => {
    const failures = new Tool({
      name: 'failOperation',
      input: z.object({ id: z.number() }),
      handler: async ({ id }) => {
        throw new Error(`blocked-${id}`)
      },
    })
    const done = new Exit({ name: 'done', description: 'Finish', schema: z.object({ count: z.number() }) })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nconst ids = [1, 2]; await Promise.all(ids.map(id => failOperation({ id })));',
        '■run\nreturn ids.length',
        '■next=done {"count":2}',
      ]),
      tools: [failures],
      exits: [done],
      options: { loop: 3 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.iterations[0]!.variables.ids).toEqual([1, 2])
    const recovery = String(result.iterations[1]!.messages.at(-1)!.content)
    expect(recovery).toContain('blocked-1')
    expect(recovery).toContain('blocked-2')
    expect(recovery).toContain('Variables preserved')
    expect(recovery).toContain('Actual tool calls so far (including failed calls): {"failOperation":2}')
    expect(String(result.iterations[1]!.messages.at(-1)!.content)).toContain(
      'failOperation: failed or paused; failOperation: failed or paused'
    )
    expect(result.iterations[1]!.status.type).toBe('thinking_requested')
  })

  test('distinguishes a tool-requested pause from completed code in follow-up prompts', async () => {
    let attempts = 0
    const tool = new Tool({
      name: 'operation',
      handler: async () => {
        if (++attempts === 1) throw new ThinkSignal('Review the request, then retry this operation.')
        return 'completed'
      },
    })
    const done = new Exit({ name: 'done', description: 'Finish' })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nreturn await operation()',
        '■run\nreturn await operation()',
        '■next=done',
      ]),
      tools: [tool],
      exits: [done],
      options: { loop: 3 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(attempts).toBe(2)
    const pause = String(result.iterations[1]!.messages.at(-1)!.content)
    expect(pause).toContain('A tool paused code execution')
    expect(pause).toContain('operation: paused for attention')
    expect(pause).not.toContain('operation: succeeded')
    expect(pause).toContain('Actual tool calls so far (including failed calls): {"operation":1}')
    expect(pause).not.toContain('The code execution completed')
    expect(pause).toContain('call that tool again')
    expect(String(result.iterations[2]!.messages.at(-1)!.content)).toContain('The code execution completed')
  })

  test('aborting from an iteration hook prevents further tool calls', async () => {
    const controller = new AbortController()
    let calls = 0
    const recursive = new Tool({
      name: 'recursive',
      handler: async () => {
        calls++
        throw new ThinkSignal('Call this tool again.')
      },
    })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(Array(4).fill('■run\nreturn await recursive()')),
      tools: [recursive],
      exits: [new Exit({ name: 'done', description: 'Finish' })],
      signal: controller.signal,
      onIterationEnd: async () => {
        if (calls === 3) controller.abort('ABORTED')
      },
      options: { loop: 10 },
    })
    expect(result.isError()).toBe(true)
    expect(calls).toBe(3)
    expect(result.iterations.at(-1)!.status.type).toBe('aborted')
    if (result.isError()) expect(String(result.error)).toContain('ABORTED')
  })

  test.each([false, true])(
    'keeps original chat history without synthetic protocol markers (streaming: %s)',
    async (streaming) => {
      const greeting = "Hi! I'm the Botpress AI assistant. What can I help you with today?"
      const options =
        '{"options":[{"label":"Book a demo","value":"book_demo"},{"label":"Help me choose a plan","value":"choose_plan"},{"label":"Talk about my use case","value":"use_case"},{"label":"Explore Botpress","value":"explore"},{"label":"I’m an existing customer","value":"existing_customer"}]}'
      const transcript: Transcript.Message[] = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: greeting },
        { role: 'assistant', content: options },
        { role: 'user', content: 'Help me choose a plan' },
      ]
      const responses = ['■run\nreturn 1', '■send=message\nWhat do you need from a plan?\n■next=listen']
      const result = await executeContext({
        client: streaming ? new ScriptedStreamingCognitive(responses) : new ScriptedNonStreamingCognitive(responses),
        chat: new Chat({ components: [DefaultComponents.Text], transcript, handler: async () => {} }),
        options: { loop: 2 },
      })
      expect(result.isSuccess()).toBe(true)
      expect(result.iterations).toHaveLength(2)
      for (const iteration of result.iterations) {
        const system = String(iteration.messages.find((message) => message.role === 'system')!.content)
        const history = system.split('SECTION 6: CHAT CONVERSATION HISTORY')[1]!.split('SECTION 7:')[0]!
        expect(history).toContain(`<assistant-002 role="assistant">\n${greeting}\n</assistant-002>`)
        expect(history).toContain(`<assistant-003 role="assistant">\n${options}\n</assistant-003>`)
        expect(history).not.toContain('■send=')
      }
      // Actual model responses in this execution retain their real protocol.
      expect(
        result.iterations[1]!.messages.some(
          (message) => message.role === 'assistant' && message.content === wire(responses[0]!)
        )
      ).toBe(true)
      expect(transcript[1]).toEqual({ role: 'assistant', content: greeting })
      expect(transcript[2]).toEqual({ role: 'assistant', content: options })
    }
  )

  test('keeps worker prompts free of chat components and listening across results and errors', async () => {
    const done = new Exit({ name: 'done', description: 'Finish the task.', schema: z.object({ total: z.number() }) })
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive([
        '■run\nreturn 4',
        '■run\nconst =;',
        '■run\nthrow new Error("Try a different approach")',
        '■next=done {"total":4}',
      ]),
      instructions: 'Calculate the total and return it through the done exit.',
      exits: [done],
      examples: [new Example({ situation: 'The total is 10.', exit: done, props: { total: 10 } })],
      options: { loop: 4 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.iterations).toHaveLength(4)
    expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
      'thinking_requested',
      'invalid_code_error',
      'execution_error',
      'exit_success',
    ])
    for (const iteration of result.iterations) {
      const prompts = iteration.messages
        .filter((message) => message.role !== 'assistant')
        .map((message) => String(message.content))
        .join('\n')
      expect(prompts).toContain('SECTION 3: AVAILABLE EXITS (■next)')
      expect(prompts).not.toMatch(
        /■send|\bchat\b|\bconversation\b|\blisten(?:ing)?\b|\bcomponents?\b|sends messages|user-facing|delivered to the user|final answer|delivered_messages|SILENT SO FAR/i
      )
      expect(prompts).toContain('■run')
      expect(prompts).toContain('■next=done')
      expect(prompts).toContain('<few_shots>')
    }
  })

  test.each([false, true])(
    'delivers carousel cards with nested images and buttons (streaming: %s)',
    async (streaming) => {
      const cards = [
        {
          title: 'Blue mug',
          subtitle: '$12',
          body: 'Dishwasher safe.',
          image: { url: 'https://example.com/blue.jpg', alt: 'Blue mug' },
          buttons: [{ action: 'url', label: 'View Blue', url: 'https://example.com/blue' }],
        },
        {
          title: 'Green mug',
          buttons: [
            { action: 'postback', label: 'Choose Green', value: 'green_mug' },
            { action: 'say', label: 'More details' },
          ],
        },
      ]
      const raw = `■send=carousel ${JSON.stringify({ cards })}\n■next=listen`
      const client = streaming
        ? new ScriptedStreamingCognitive([raw], undefined, 7)
        : new ScriptedNonStreamingCognitive([raw])
      const sent: RenderedComponent[] = []
      const result = await executeContext({
        client,
        chat: new Chat({
          components: [DefaultComponents.Carousel],
          transcript: [],
          handler: (message) => {
            sent.push(message)
          },
        }),
        options: { loop: 1 },
      })
      expect(result.isSuccess()).toBe(true)
      expect(sent).toEqual([
        createJsxComponent({
          type: 'Carousel',
          props: {},
          children: [
            createJsxComponent({
              type: 'Card',
              props: { title: 'Blue mug', subtitle: '$12' },
              children: [
                'Dishwasher safe.',
                createJsxComponent({ type: 'Image', props: cards[0]!.image!, children: [] }),
                createJsxComponent({ type: 'Button', props: cards[0]!.buttons[0]!, children: [] }),
              ],
            }),
            createJsxComponent({
              type: 'Card',
              props: { title: 'Green mug' },
              children: cards[1]!.buttons.map((props) => createJsxComponent({ type: 'Button', props, children: [] })),
            }),
          ],
        }),
      ])
      expect(result.iterations[0]!.llm?.diagnostics).toEqual([])
    }
  )

  test('preserves custom carousel components instead of converting their props', async () => {
    const custom = new Component({
      type: 'leaf',
      name: 'Carousel',
      description: 'Custom carousel',
      leaf: { props: z.object({ items: z.array(z.string()) }) },
    })
    const sent: RenderedComponent[] = []
    const result = await executeContext({
      client: new ScriptedNonStreamingCognitive(['■send=carousel {"items":["first","second"]}\n■next=listen']),
      chat: new Chat({
        components: [custom],
        transcript: [],
        handler: (message) => {
          sent.push(message)
        },
      }),
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(sent).toEqual([custom.render({ items: ['first', 'second'] })])
  })

  describe('nonstreaming generation failures', () => {
    test('Cognitive fallback exposes only the successful response to LLMz', async () => {
      const calls = vi.fn()
      const mark = new Tool({
        name: 'mark',
        description: 'Records a side effect',
        handler: async () => {
          calls()
        },
      })
      const { chat, messages } = makeChat()
      class RecoveredCognitive extends ScriptedNonStreamingCognitive {
        public override async generateText(): Promise<CognitiveResponse> {
          const response = await super.generateText()
          response.metadata.fallbackPath = ['failed-provider:failed-model']
          response.metadata.warnings = [{ type: 'fallback_used', message: 'First model failed; replacement succeeded' }]
          return response
        }
      }
      const client = new RecoveredCognitive(['■send=message\nReplacement reply\n■run\nawait mark()\n■next=listen'])
      const generate = vi.spyOn(client, 'generateText')
      const result = await executeContext({ client, chat, tools: [mark], options: { loop: 1 } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(generate).toHaveBeenCalledTimes(1)
      expect(calls).toHaveBeenCalledTimes(1)
      expect(messages.map((message) => message.text)).toEqual(['Replacement reply'])
    })

    test.each(['transport', 'error response', 'token limit', 'content filter', 'unknown provider'] as const)(
      '%s fails without delivering messages or running code',
      async (failure) => {
        const calls = vi.fn()
        const mark = new Tool({
          name: 'mark',
          description: 'Records a side effect',
          handler: async () => {
            calls()
          },
        })
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push(delta)
        })
        class FailingCognitive extends ScriptedNonStreamingCognitive {
          public override async generateText(): Promise<CognitiveResponse> {
            if (failure === 'transport') throw new Error('model chain exhausted')
            const response = await super.generateText()
            if (failure === 'error response') response.error = 'model chain exhausted'
            if (failure === 'token limit') response.metadata.stopReason = 'max_tokens'
            if (failure === 'content filter') response.metadata.stopReason = 'content_filter'
            if (failure === 'unknown provider') response.metadata.provider = 'unknown'
            return response
          }
        }
        const client = new FailingCognitive(['■send=message\nIncomplete response\n■run\nawait mark()\n■next=listen'])
        const result = await executeContext({ client, chat, tools: [mark], options: { loop: 3 } })
        expect(result).toBeInstanceOf(ErrorExecutionResult)
        expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
        expect(result.iterations).toHaveLength(1)
        expect(calls).not.toHaveBeenCalled()
        expect(messages).toEqual([])
        expect(deltas).toEqual([])
      }
    )
  })

  test.each(['nonstreaming', 'streaming', 'fallback'] as const)(
    '%s suppresses messages after returning code until the model has observed its result',
    async (mode) => {
      const calls = vi.fn()
      const mark = new Tool({
        name: 'mark',
        description: 'Records a side effect',
        handler: async () => {
          calls()
        },
      })
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push(delta)
      })
      const responses = [
        '■run\nawait mark()\nreturn 42\n■send=message\nThis was generated before seeing the result\n■next=listen',
        '■send=message\nThe result is 42\n■next=listen',
      ]
      const client =
        mode === 'nonstreaming'
          ? new ScriptedNonStreamingCognitive(responses)
          : new ScriptedStreamingCognitive(responses)
      const result = await executeContext({
        client,
        chat,
        tools: [mark],
        options: { loop: 2, midStreamFallback: mode === 'fallback' },
      })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(result.iterations).toHaveLength(2)
      expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
      expect(calls).not.toHaveBeenCalled()
      expect(messages.map((message) => message.text)).toEqual(['The result is 42'])
      expect(
        textDeltas(deltas)
          .map((delta) => delta.delta)
          .join('')
      ).not.toContain('before seeing')
      expect(result.iterations[0]!.sends).toEqual([])
      expect(result.iterations[0]!.llm?.diagnostics).toEqual([expect.objectContaining({ code: 'invalid-envelope' })])
      expect(result.iterations[0]!.llm?.output).toContain('This was generated before seeing the result')
      expect(JSON.stringify(result.iterations[1]!.messages)).toContain('never send a message after code')
    }
  )

  test('a stream restart clears the guard for sends after returning code', async () => {
    const deltas: MessageDelta[] = []
    const { chat, messages } = makeChat((delta) => {
      deltas.push(delta)
    })
    const client = new ScriptedRestartStreamingCognitive(
      [
        '■run\nreturn 42\n■send=message\nInvented result.\n■next=listen',
        '■send=message\nReplacement answer.\n■next=listen',
      ],
      undefined,
      1
    )
    const result = await executeContext({ client, chat, options: midStreamOptions(2) })
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(messages.map((message) => message.text)).toEqual(['Replacement answer.'])
    expect(
      textDeltas(deltas)
        .map((delta) => delta.delta)
        .join('')
    ).toBe('Replacement answer.')
    expect(result.iterations[0]!.llm?.diagnostics).toEqual([])
  })

  describe('reasoning preamble regression', () => {
    const preamble =
      'I have already provided the greeting in assistant message 5. The user has now said "ok". I should wait for their actual question or request.'
    const reply = "Sounds good! Whenever you're ready, just let me know how I can help. 😊"
    const output = `${preamble}\n\n■send=message\n${reply}\n■next=listen`
    const modes = ['nonstreaming', 'whole', 'characters', 'chunks', 'restart'] as const

    test.each(['nonstreaming', 'whole', 'characters', 'chunks', 'fallback'] as const)(
      '%s rejects a preamble without executing any following code',
      async (mode) => {
        const called = vi.fn()
        const tool = new Tool({
          name: 'record',
          handler: async () => {
            called()
          },
        })
        const raw = 'We need to produce a ■run block with the query.■run\nawait record()\n■next=listen'
        const client =
          mode === 'nonstreaming'
            ? new ScriptedNonStreamingCognitive([raw, '■next=listen'])
            : new ScriptedStreamingCognitive(
                [raw, '■next=listen'],
                undefined,
                mode === 'whole' ? 100_000 : mode === 'characters' ? 1 : 7
              )
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const result = await executeContext({
          client,
          chat,
          tools: [tool],
          options: { loop: 2, midStreamFallback: mode === 'fallback' },
        })
        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect(result.iterations).toHaveLength(2)
        expect(called).not.toHaveBeenCalled()
        expect(messages).toEqual([])
        expect(textDeltas(deltas)).toEqual([])
        expect(result.iterations[0]!.code).toBeUndefined()
        expect(result.iterations[0]!.llm?.output).toBe(wire(raw))
        expect(result.iterations[0]!.llm?.diagnostics).toContainEqual({
          code: 'invalid-envelope',
          message: expect.any(String),
        })
      }
    )

    const makeClient = (mode: (typeof modes)[number], responses: string[]) => {
      if (mode === 'nonstreaming') {
        return new ScriptedNonStreamingCognitive(responses)
      }
      if (mode === 'restart') {
        // The abandoned attempt completes a send before the replacement starts.
        // Keep all callback history: a later retraction cannot undo a leak.
        return new ScriptedRestartStreamingCognitive([output, ...responses], undefined, 1)
      }
      return new ScriptedStreamingCognitive(
        responses,
        undefined,
        mode === 'whole' ? 100_000 : mode === 'characters' ? 1 : 7
      )
    }

    test.each(modes)('%s rejects the original reasoning leak before every callback', async (mode) => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const result = await executeContext({
        client: makeClient(mode, [output]),
        chat,
        options: { loop: 1, midStreamFallback: mode === 'restart' },
      })

      expect(result).toBeInstanceOf(ErrorExecutionResult)
      const count = 0
      expect(messages).toEqual(Array.from({ length: count }, () => ({ type: 'MESSAGE', text: reply, props: {} })))
      expect(result.iterations[0]!.traces.filter((trace) => trace.type === 'yield')).toHaveLength(count)
      expect(result.iterations[0]!.llm?.output).toBe(wire(output))
      expect(result.iterations[0]!.llm?.diagnostics).toContainEqual({
        code: 'invalid-envelope',
        message: expect.any(String),
      })
      expect(result.iterations[0]!.toJSON().llm?.diagnostics).toEqual(result.iterations[0]!.llm?.diagnostics)
      const previews = textDeltas(deltas)
      expect(previews.map((delta) => delta.delta).join('')).toBe('')
      expect(previews.every((delta) => delta.component === 'message' && reply.startsWith(delta.content))).toBe(true)
      expect(restartDeltas(deltas)).toHaveLength(mode === 'restart' ? 1 : 0)
    })

    test.each(modes)('%s strips copied example delimiters before every customer callback', async (mode) => {
      const raw = `"""\n■start\n■send=message\n"""\n${reply}\n"""\n■send=md\n**Markdown**\n"""\n■next=listen\n■end\n"""`
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const client =
        mode === 'restart'
          ? new ScriptedRestartStreamingCognitive(['■start\n■send=message\nHello!\n""', raw], undefined, 1)
          : makeClient(mode, [raw])
      const result = await executeContext({ client, chat, options: { loop: 1, midStreamFallback: mode === 'restart' } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(result.iterations).toHaveLength(1)
      expect(messages).toEqual([
        { type: 'MESSAGE', text: reply, props: {} },
        { type: 'MD', text: '**Markdown**', props: {} },
      ])
      expect(
        textDeltas(deltas).every((delta) =>
          [reply, '**Markdown**', 'Hello!'].some((text) => text.startsWith(delta.content))
        )
      ).toBe(true)
      expect(textDeltas(deltas).some((delta) => delta.delta.includes('"'))).toBe(false)
      expect(result.iterations[0]!.llm?.output).toBe(wire(raw))
      expect(result.iterations[0]!.llm?.diagnostics?.some((d) => d.code === 'example-delimiter')).toBe(true)
      expect(restartDeltas(deltas)).toHaveLength(mode === 'restart' ? 1 : 0)
    })

    test.each(modes.flatMap((mode) => [false, true].map((returnsResult) => ({ mode, returnsResult }))))(
      '$mode executes quoted actions once (returnsResult=$returnsResult)',
      async ({ mode, returnsResult }) => {
        const called = vi.fn(async () => 'done')
        const tool = new Tool({ name: 'record', handler: called })
        const action = `"""\n■start\n■run\n${returnsResult ? 'return ' : ''}await record()\n${returnsResult ? '' : '■next=listen\n'}■end\n"""`
        const responses = returnsResult
          ? [action, '"""\n■start\n■send=message\nDone.\n■next=listen\n■end\n"""']
          : [action]
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        // Restart before a partial code block has become executable.
        class RestartThenComplete extends ScriptedStreamingCognitive {
          private _first = true
          public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
            if (this._first) {
              this._first = false
              yield { created: 1, output: '"""\n■run\nawait record(' }
              yield { created: 2, restart: { attempt: 2, fromModel: 'A', toModel: 'B', reason: 'timeout' } }
            }
            yield* super.generateTextStream()
          }
        }
        const client =
          mode === 'restart' ? new RestartThenComplete(responses, undefined, 1) : makeClient(mode, responses)
        const result = await executeContext({
          client,
          chat,
          tools: [tool],
          options: { loop: 2, midStreamFallback: mode === 'restart' },
        })
        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect(called).toHaveBeenCalledTimes(1)
        expect(messages).toEqual(returnsResult ? [{ type: 'MESSAGE', text: 'Done.', props: {} }] : [])
        expect(textDeltas(deltas).every((delta) => 'Done.'.startsWith(delta.content))).toBe(true)
        expect(result.iterations[0]!.llm?.output).toBe(wire(action))
        expect(result.iterations[0]!.code).toBe(`${returnsResult ? 'return ' : ''}await record()`)
      }
    )

    test.each(modes)('%s rejects quoted unmarked prose without delivering it', async (mode) => {
      const raw = `"""\n${preamble}\n"""\n■next=listen`
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const client =
        mode === 'restart' ? new ScriptedRestartStreamingCognitive(['""', raw], undefined, 1) : makeClient(mode, [raw])
      const result = await executeContext({ client, chat, options: { loop: 1, midStreamFallback: mode === 'restart' } })
      expect(result).toBeInstanceOf(ErrorExecutionResult)
      expect(messages).toEqual([])
      expect(textDeltas(deltas)).toEqual([])
      expect(result.iterations[0]!.llm?.output).toBe(wire(raw))
    })

    test.each(modes)('%s preserves explicit Markdown, clean sends, run and exit', async (mode) => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const called = vi.fn()
      const tool = new Tool({
        name: 'record',
        description: 'Records a call',
        handler: async () => {
          called()
        },
      })
      const clean = '■send=md\n**Markdown**\n■send=message\nHello!\n■run\nawait record()\n■next=listen'
      const result = await executeContext({
        client: makeClient(mode, [clean]),
        chat,
        tools: [tool],
        options: { loop: 1, midStreamFallback: mode === 'restart' },
      })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(called).toHaveBeenCalledTimes(1)
      expect(result.iterations[0]!.llm?.diagnostics).toEqual([])
      expect(messages).toEqual([
        { type: 'MD', text: '**Markdown**', props: {} },
        { type: 'MESSAGE', text: 'Hello!', props: {} },
      ])
      expect(
        textDeltas(deltas)
          .map((delta) => delta.delta)
          .join('')
      ).toBe(mode === 'nonstreaming' ? '' : '**Markdown**Hello!')
    })

    test.each(modes)('%s malformed-only output fails safely without sending it', async (mode) => {
      const deltas: MessageDelta[] = []
      const { chat, messages } = makeChat((delta) => {
        deltas.push({ ...delta })
      })
      const result = await executeContext({
        client: makeClient(mode, [preamble]),
        chat,
        options: { loop: 1, midStreamFallback: mode === 'restart' },
      })
      expect(result).toBeInstanceOf(ErrorExecutionResult)
      expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
      expect(result.iterations[0]!.llm?.output).toBe(preamble)
      expect(result.iterations[0]!.llm?.diagnostics).toContainEqual({
        code: 'invalid-envelope',
        message: expect.any(String),
      })
      expect(result.iterations[0]!.sends).toEqual([])
      expect(messages).toEqual([])
      expect(
        textDeltas(deltas)
          .map((delta) => delta.delta)
          .join('')
      ).toBe('')
    })

    test.each(['nonstreaming', 'characters'] as const)(
      '%s retries malformed-only output through the existing error path',
      async (mode) => {
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push({ ...delta })
        })
        const result = await executeContext({
          client: makeClient(mode, [preamble, `■send=message\n${reply}\n■next=listen`]),
          chat,
          options: { loop: 2 },
        })
        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect(result.iterations).toHaveLength(2)
        expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
        expect(messages).toEqual([{ type: 'MESSAGE', text: reply, props: {} }])
        expect(
          textDeltas(deltas)
            .map((delta) => delta.delta)
            .join('')
        ).toBe(mode === 'nonstreaming' ? '' : reply)
      }
    )
  })

  test('a message-only response sends the message and listens', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedCognitive(['■send=message\nHello **world**!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages).toEqual([{ type: 'MESSAGE', text: 'Hello **world**!', props: {} }])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)
  })

  test('a message-only response without ■next is rejected', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedCognitive(['■send=message\nJust letting you know!'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages).toEqual([])
    expect(result).toBeInstanceOf(ErrorExecutionResult)
    expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
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
    expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
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

    expect(messages.map((m) => m.text)).toEqual(['The number is **21**.'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect(result.iterations).toHaveLength(2)
    expect(result.iterations[0]!.status.type).toBe('invalid_code_error')
  })

  test('streaming clients commit messages after the stream completes', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedStreamingCognitive(
      ['■send=message\nStreaming hello!\n■send=message\nSecond message\n■next=listen'],
      () => messages.length
    )

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual(['Streaming hello!', 'Second message'])
    expect(result).toBeInstanceOf(SuccessExecutionResult)
    expect((result as SuccessExecutionResult).result.exit.name).toBe(ListenExit.name)

    expect(client.probes.every((count) => count === 0)).toBe(true)
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
    expect(client.probes.slice(0, -1).some((count) => count > 0)).toBe(true)
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

  test(
    'streaming clients wait for the envelope and successful transport before executing code',
    { timeout: 10_000 },
    async () => {
      const done = new Exit({ name: 'done', description: 'Task completed' })

      let didRun = false
      const sideEffect = new Tool({
        name: 'sideEffect',
        description: 'Does something',
        handler: async () => {
          didRun = true
        },
      })

      // Probe the closed run before allowing the response and transport to finish.
      class GatedStreamingCognitive extends ScriptedCognitive {
        public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
          const content = this._nextContent()
          const gateAt = content.indexOf('■next')
          yield { output: content.slice(0, gateAt), created: Date.now() }
          yield { output: content.slice(gateAt, gateAt + 5), created: Date.now() } // '■next' — completes the ■run item
          expect(didRun).toBe(false)
          yield { output: content.slice(gateAt + 5), created: Date.now() }
          yield { created: Date.now(), finished: true, metadata: makeFakeMetadata() }
        }
      }

      const client = new GatedStreamingCognitive(['■run\nawait sideEffect()\n■next=done'])
      const result = await executeContext({ client, tools: [sideEffect], exits: [done], options: { loop: 2 } })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(result.iterations).toHaveLength(1)
      expect((result as SuccessExecutionResult).result.exit.name).toBe('done')
    }
  )

  test('without fallback, a later transport failure prevents closed code from running', async () => {
    let didRun = false
    const calls = vi.fn()
    const mark = new Tool({
      name: 'mark',
      description: 'Records a side effect',
      handler: async () => {
        calls()
        didRun = true
      },
    })
    class FailAfterCode extends ScriptedCognitive {
      public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
        yield { output: this._nextContent(), created: Date.now() }
        expect(didRun).toBe(false)
        throw new Error('transport failed after code ran')
      }
    }
    const { chat, messages } = makeChat()
    const client = new FailAfterCode(['■run\nawait mark()\n■send=message\nUnfinished reply'])
    const result = await executeContext({ client, chat, tools: [mark], options: { loop: 3 } })
    expect(result).toBeInstanceOf(ErrorExecutionResult)
    expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
    expect(result.iterations).toHaveLength(1)
    expect(calls).not.toHaveBeenCalled()
    expect(messages).toEqual([])
  })

  test('streaming clients reject a wrapping code fence', async () => {
    const { chat, messages } = makeChat()
    const client = new ScriptedStreamingCognitive(['```\n■send=message\nFenced hello!\n■next=listen'])

    const result = await executeContext({ client, chat, options: { loop: 3 } })

    expect(messages.map((m) => m.text)).toEqual([])
    expect(result).toBeInstanceOf(ErrorExecutionResult)
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
    const interruptedAttempts = [
      { name: 'thoughts', output: 'I should privately reason about the user\n', preview: '', completed: [] },
      { name: 'partial message', output: '■send=message\nPartial reply', preview: 'Partial reply', completed: [] },
      { name: 'partial code', output: '■run\nawait mark()', preview: '', completed: [] },
      {
        name: 'message then partial code',
        output: '■send=message\nChecking now\n■run\nawait mark()',
        preview: 'Checking now',
        completed: ['Checking now'],
      },
      {
        name: 'completed code then partial message',
        output: '■run\nawait mark()\n■send=message\nPartial reply',
        preview: '',
        completed: [],
      },
    ]

    describe.each([1, 7, 10000])('failure matrix with chunk size %i', (chunkSize) => {
      test.each(interruptedAttempts)(
        '$name is retracted before replacement; only surviving code executes',
        async (scenario) => {
          const events: Array<{ type: 'delta' | 'complete' | 'reset'; id: string; text?: string }> = []
          const displayed = new Map<string, { iterationId: string; text: string }>()
          displayed.set('earlier-message', { iterationId: 'earlier-iteration', text: 'Keep earlier messages' })
          const calls = vi.fn()
          const mark = new Tool({
            name: 'mark',
            description: 'Records a side effect',
            handler: async () => {
              calls()
            },
          })
          const chat = new Chat({
            components: [DefaultComponents.Text],
            transcript: [{ role: 'user', content: 'hello' }],
            handler: async (component, metadata) => {
              const text = component.children.filter((child) => typeof child === 'string').join('')
              events.push({ type: 'complete', id: metadata.id, text })
              displayed.set(metadata.id, { iterationId: metadata.iterationId, text })
            },
            onMessageDelta: async (delta) => {
              if (delta.restart) {
                events.push({ type: 'reset', id: delta.iterationId })
                for (const [id, message] of displayed) {
                  if (message.iterationId === delta.iterationId) displayed.delete(id)
                }
              } else {
                events.push({ type: 'delta', id: delta.id, text: delta.delta })
                displayed.set(delta.id, { iterationId: delta.iterationId, text: delta.content })
              }
            },
          })
          const replacement = '■send=message\nReplacement reply\n■run\nawait mark()\n■next=listen'
          const client = new ScriptedRestartStreamingCognitive(
            [scenario.output, replacement],
            () => calls.mock.calls.length,
            chunkSize
          )

          const result = await executeContext({ client, chat, tools: [mark], options: midStreamOptions(1) })

          expect(result).toBeInstanceOf(SuccessExecutionResult)
          expect(calls).toHaveBeenCalledOnce()
          expect(client.probes.every((count) => count === 0)).toBe(true)
          expect(result.iterations[0]!.llm?.output).toBe(wire(replacement))
          expect(events.filter((event) => event.type === 'reset')).toHaveLength(1)
          const resetAt = events.findIndex((event) => event.type === 'reset')
          const before = events.slice(0, resetAt)
          const after = events.slice(resetAt + 1)
          expect(
            before
              .filter((event) => event.type === 'delta')
              .map((event) => event.text)
              .join('')
          ).toBe(scenario.preview)
          expect(before.filter((event) => event.type === 'complete').map((event) => event.text)).toEqual([])
          expect(
            after
              .filter((event) => event.type === 'delta')
              .map((event) => event.text)
              .join('')
          ).toBe('Replacement reply')
          expect(after.filter((event) => event.type === 'complete').map((event) => event.text)).toEqual([
            'Replacement reply',
          ])
          expect(after.every((event) => before.every((old) => old.id !== event.id))).toBe(true)
          expect([...displayed.values()].map((message) => message.text)).toEqual([
            'Keep earlier messages',
            'Replacement reply',
          ])
        }
      )
    })

    test.each(interruptedAttempts)(
      'terminal failure during $name never executes code and retracts any previews',
      async (scenario) => {
        const calls = vi.fn()
        const mark = new Tool({
          name: 'mark',
          description: 'Records a side effect',
          handler: async () => {
            calls()
          },
        })
        const deltas: MessageDelta[] = []
        const { chat, messages } = makeChat((delta) => {
          deltas.push(delta)
        })
        const client = new ScriptedChainErrorCognitive([scenario.output])
        const result = await executeContext({ client, chat, tools: [mark], options: midStreamOptions(3) })
        expect(result).toBeInstanceOf(ErrorExecutionResult)
        expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
        expect(result.iterations).toHaveLength(1)
        expect(calls).not.toHaveBeenCalled()
        expect(messages).toEqual([])
        expect(
          textDeltas(deltas)
            .map((delta) => delta.delta)
            .join('')
        ).toBe(scenario.preview)
        expect(restartDeltas(deltas)).toHaveLength(scenario.preview ? 1 : 0)
      }
    )

    test.each(
      [true, false].flatMap((midStreamFallback) =>
        ['unknown provider', 'token limit', 'content filter'].map((failure) => ({ failure, midStreamFallback }))
      )
    )(
      '$failure metadata cannot finalize partial code (fallback=$midStreamFallback)',
      async ({ failure, midStreamFallback }) => {
        const calls = vi.fn()
        const mark = new Tool({
          name: 'mark',
          description: 'Records a side effect',
          handler: async () => {
            calls()
          },
        })
        const metadata = makeFakeMetadata()
        if (failure === 'unknown provider') metadata.provider = 'unknown'
        else metadata.stopReason = failure === 'token limit' ? 'max_tokens' : 'content_filter'
        // A syntactically valid prefix is not proof the model finished its code.
        const client = new ScriptedRestartStreamingCognitive(['■run\nawait mark()'], undefined, 1, {
          created: Date.now(),
          finished: true,
          metadata,
        })
        const result = await executeContext({ client, tools: [mark], options: { loop: 1, midStreamFallback } })
        expect(result).toBeInstanceOf(ErrorExecutionResult)
        expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
        expect(calls).not.toHaveBeenCalled()
      }
    )

    test('completed sends wait for successful generation with midStreamFallback enabled', async () => {
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
      expect(client.probes.every((count) => count === 0)).toBe(true)
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
      expect(client.probes.slice(0, -1).some((count) => count > 0)).toBe(true)
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

    test('sends from abandoned attempts are never committed', async () => {
      const { chat, messages } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nAbandoned!\n■send=message\nPartial',
        '■send=message\nKept!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(messages.map((m) => m.text)).toEqual(['Kept!'])
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
      expect(messages.map((m) => m.text)).toEqual(['Buffered'])
      // previews were streamed live alongside the committed send
      expect(
        textDeltas(deltas)
          .map((d) => d.delta)
          .join('')
      ).toBe('Buffered')
      expect(restartDeltas(deltas)).toEqual([])
    })

    test('multiple restarts commit only the survivor and retract earlier previews', async () => {
      const { chat, messages } = makeChat()
      const client = new ScriptedRestartStreamingCognitive([
        '■send=message\nFirst attempt\n■next=listen',
        '■send=message\nSecond attempt\n■next=listen',
        '■send=message\nFinal!\n■next=listen',
      ])

      const result = await executeContext({ client, chat, options: midStreamOptions(3) })

      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(messages.map((m) => m.text)).toEqual(['Final!'])
    })

    test.each(['```', '```\n■send=message\nAbandoned!\n', '■send=button { "label":'])(
      'a restart resets incomplete envelope state: %s',
      async (abandoned) => {
        const { chat, messages } = makeChat()
        // both attempts are wrapped in a code fence; the first fence must not
        // leak into the replacement after the restart
        const client = new ScriptedRestartStreamingCognitive([abandoned, '■send=message\nKept!\n■next=listen'])

        const result = await executeContext({ client, chat, options: midStreamOptions(3) })

        expect(result).toBeInstanceOf(SuccessExecutionResult)
        expect(messages.map((m) => m.text)).toEqual(['Kept!'])
      }
    )

    test('a metadata-less replacement retracts its previews without committing sends', async () => {
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
        expect(messages.map((m) => m.text)).toEqual([])
      }
    })

    test('cancelling mid-stream retracts previews without committing sends', async () => {
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
      expect(messages.map((m) => m.text)).toEqual([])
      expect(result.iterations[0]!.status.type).toBe('aborted')

      expect(textDeltas(deltas).length).toBeGreaterThan(0)
      expect(restartDeltas(deltas)).toHaveLength(1)
    })

    test('a stream error commits neither sends nor code', async () => {
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
      expect(messages.map((m) => m.text)).toEqual([])
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
      expect(messages.map((m) => m.text)).toEqual([])
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
      expect(messages.map((m) => m.text)).toEqual([])

      const restarts = restartDeltas(deltas)
      expect(restarts).toHaveLength(2)
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

      expect(messages.map((m) => m.text)).toEqual(['Delta!'])
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
      expect(messages.map((m) => m.text)).toEqual(['Kept over here!'])

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
      expect(messages.map((m) => m.text)).toEqual(['Kept!'])

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
      expect(messages.map((m) => m.text)).toEqual(['Kept!'])

      // the earlier generation's preview survived the restart untouched
      expect(previews.get('previous-iteration')).toEqual(new Map([['prev-msg', 'Committed earlier message']]))

      // only the current generation still holds provisional previews, with the
      // surviving attempt's message
      expect(previews.size).toBe(2)
      const current = [...previews.entries()].find(([key]) => key !== 'previous-iteration')![1]
      expect([...current.values()]).toEqual(['Kept!'])
    })

    test.each(['sync', 'async'] as const)(
      'a %s restart handler failure stops replacement delivery and execution',
      async (mode) => {
        const events: string[] = []
        const { chat, messages } = makeChat((delta) => {
          if (delta.restart) {
            events.push('reset')
            if (mode === 'async') {
              return Promise.resolve().then(() => {
                throw new Error('retraction failed')
              })
            }
            throw new Error('retraction failed')
          }
          events.push('text')
          // Text-preview errors still allow the first completed send through.
          throw new Error('preview failed')
        })
        let ran = false
        const mark = new Tool({
          name: 'mark',
          description: 'Side effect',
          handler: async () => {
            ran = true
          },
        })
        const client = new ScriptedRestartStreamingCognitive([
          '■send=message\nAbandoned!\n■run\nawait mark()\n■next=listen',
          '■send=message\nReplacement!\n■run\nawait mark()\n■next=listen',
        ])
        const result = await executeContext({ client, chat, tools: [mark], options: midStreamOptions(3) })

        expect(result).toBeInstanceOf(ErrorExecutionResult)
        expect((result as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
        expect(((result as ErrorExecutionResult).error as Error).message).toContain(
          'restart handler failed: retraction failed'
        )
        expect(result.iterations).toHaveLength(1)
        expect(messages.map((m) => m.text)).toEqual([])
        expect(events).toContain('text')
        expect(events.filter((event) => event === 'reset')).toHaveLength(1)
        expect(events.at(-1)).toBe('reset')
        expect(ran).toBe(false)
      }
    )

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
      expect(messages.map((m) => m.text)).toEqual([])
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
      expect(messages.map((m) => m.text)).toEqual(['Final!'])

      const iteration = result.iterations[0]!
      const restartTraces = iteration.traces.filter((t) => t.type === 'llm_call_restarted')
      expect(restartTraces).toHaveLength(1)
      expect(restartTraces[0]).toMatchObject({ attempt: 2, fromModel: 'fake', toModel: 'fake', reason: 'timeout' })

      // raw output and usage come from the surviving attempt only
      expect(iteration.llm!.output).toBe(wire('■send=message\nFinal!\n■next=listen'))
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

    expect(sent).toHaveLength(1)
    expect(sent[0]!.metadata.id.includes(':2:')).toBe(true)
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

  test('handler delivery is awaited only for the surviving attempt', async () => {
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
    expect(handlerEvents).toHaveLength(1)

    expect(events.indexOf('reset')).toBeLessThan(events.indexOf(`handler:${handlerEvents[0]}`))
  })
})

describe('consumer few-shot examples', () => {
  test.each([ScriptedNonStreamingCognitive, ScriptedStreamingCognitive])(
    'keeps examples out of execution and refreshes them each iteration (%s)',
    async (ClientType) => {
      const { Example } = await import('../example.js')
      const { chat, messages } = makeChat()
      const queries: string[] = []
      const searchKnowledge = new Tool({
        name: 'searchKnowledge',
        description: 'Search the knowledge base',
        input: z.object({ query: z.string() }),
        output: z.array(z.string()),
        handler: async ({ query }) => {
          queries.push(query)
          return queries.length === 1 ? [] : ['Use the reset link.']
        },
      })
      const example = new Example({
        situation: 'HYPOTHETICAL_INPUT',
        code: 'return await searchKnowledge({ query: "EXAMPLE_QUERY" })',
      })
      const examples = vi.fn(async () => [example])
      const client = new ClientType([
        '■run\nreturn await searchKnowledge({ query: "password recovery" })',
        '■run\nreturn await searchKnowledge({ query: "reset forgotten password" })',
        '■send=message\nUse the reset link.\n■next=listen',
      ])
      const result = await executeContext({ client, chat, tools: [searchKnowledge], examples, options: { loop: 4 } })
      expect(result).toBeInstanceOf(SuccessExecutionResult)
      expect(queries).toEqual(['password recovery', 'reset forgotten password'])
      expect(messages.map((message) => message.text)).toEqual(['Use the reset link.'])
      expect(examples).toHaveBeenCalledTimes(3)
      for (const iteration of result.iterations) {
        const system = iteration.messages.find((message) => message.role === 'system')!
        expect(String(system.content)).toContain('EXAMPLE_QUERY')
        expect(
          iteration.messages
            .filter((message) => message.role !== 'system')
            .map((message) => JSON.stringify(message))
            .join('')
        ).not.toContain('EXAMPLE_QUERY')
        expect(iteration.tokens!.context.examples).toBeGreaterThan(0)
        const { total, ...parts } = iteration.tokens!.context
        expect(total).toBe(Object.values(parts).reduce((sum, count) => sum + count, 0))
        expect(iteration.toJSON().transcript).not.toContainEqual(
          expect.objectContaining({ content: 'HYPOTHETICAL_INPUT' })
        )
      }
    }
  )
})
