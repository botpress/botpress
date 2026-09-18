import { describe, expect, test, vi } from 'vitest'
import { z } from '@bpinternal/zui'
import type { CognitiveMetadata, CognitiveStreamChunk } from '@botpress/cognitive'
import { Chat, type MessageDelta } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { _CustomModelClient } from '../custom-client.js'
import { Tool } from '../tool.js'
import { Exit } from '../exit.js'
import { executeContext } from './execute.js'
import { protocolLanguages } from './fixtures/protocol-languages.js'

const metadata: CognitiveMetadata = {
  provider: 'fake',
  model: 'fake',
  cached: false,
  latency: 1,
  cost: 0,
  usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
}
const frame = (body: string) => `■start\n${body}\n■end`
const mutations = [
  { name: 'missing start', make: (reply: string) => `■send=message\n${reply}\n■next=listen`, noPreview: true },
  {
    name: 'missing both message and start headers',
    make: (reply: string) => `${reply}\n■next=listen`,
    noPreview: true,
  },
  {
    name: 'preamble without start',
    make: (reply: string) => `Private reasoning\n■send=message\n${reply}\n■next=listen\n■end`,
    noPreview: true,
  },
  {
    name: 'wrong start marker',
    make: (reply: string) => `●start\n■send=message\n${reply}\n■next=listen\n■end`,
    noPreview: true,
  },
  {
    name: 'missing end after tool',
    make: (reply: string) => `■start\n■send=message\n${reply}\n■run\nawait record()\n■next=listen`,
    noPreview: false,
  },
  {
    name: 'missing message header inside frame',
    make: (reply: string) => frame(`${reply}\n■next=listen`),
    noPreview: true,
  },
  {
    name: 'duplicate code blocks',
    make: (reply: string) => frame(`■send=message\n${reply}\n■run\nawait record()\n■run\nawait record()\n■next=listen`),
    noPreview: false,
  },
  {
    name: 'code then premature answer',
    make: (reply: string) => frame(`■run\nreturn await record()\n■send=message\n${reply}\n■next=listen`),
    noPreview: true,
  },
  {
    name: 'message without control transfer',
    make: (reply: string) => frame(`■send=message\n${reply}`),
    noPreview: false,
  },
  {
    name: 'content after end',
    make: (reply: string) => `${frame(`■send=message\n${reply}\n■next=listen`)}\nPrivate reasoning`,
    noPreview: false,
  },
] as const

// Raw wire responses: these fixtures must NEVER be automatically wrapped or repaired by the test client.
class Replay extends _CustomModelClient {
  public constructor(private responses: string[]) {
    super()
  }
  public async getModelDetails(model: string) {
    return {
      id: model,
      name: model,
      description: '',
      input: { maxTokens: 128000, costPer1MTokens: 0 },
      output: { maxTokens: 8000, costPer1MTokens: 0 },
      tags: [],
      lifecycle: 'production' as const,
    }
  }
  public async generateText() {
    return { output: this.responses.shift()!, metadata }
  }
}
class StreamReplay extends Replay {
  public constructor(
    responses: string[],
    private size: number
  ) {
    super(responses)
  }
  public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
    const { output } = await this.generateText()
    for (let i = 0; i < output.length; i += this.size) yield { output: output.slice(i, i + this.size), created: 1 }
    yield { metadata, finished: true, created: 2 }
  }
}

describe('mandatory protocol adherence', () => {
  test.each(protocolLanguages.flatMap((language) => mutations.map((mutation) => ({ ...language, ...mutation }))))(
    '$language: rejects $name in all delivery modes before executing or committing anything',
    async ({ reply, make, noPreview }) => {
      for (const size of [0, 1, 7, 100000]) {
        const raw = make(reply)
        const corrected = frame(`■send=message\n${reply}\n■next=listen`)
        const delivered: string[] = [],
          deltas: MessageDelta[] = []
        const record = vi.fn(async () => undefined)
        const chat = new Chat({
          components: [DefaultComponents.Text],
          transcript: [{ role: 'user', content: 'hello' }],
          handler: async (component) => {
            delivered.push(component.children.join(''))
          },
          onMessageDelta: (delta) => {
            deltas.push({ ...delta })
          },
        })
        const client = size ? new StreamReplay([raw, corrected], size) : new Replay([raw, corrected])
        const result = await executeContext({
          client,
          chat,
          tools: [new Tool({ name: 'record', handler: record })],
          options: { loop: 2 },
        })
        expect(result.iterations.map((i) => i.status.type)).toEqual(['invalid_code_error', 'exit_success'])
        expect(record).not.toHaveBeenCalled()
        expect(delivered).toEqual([reply])
        expect(result.iterations[0]!.llm?.output).toBe(raw)
        expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(
          expect.objectContaining({ code: 'invalid-envelope' })
        )
        const firstAttempt = deltas.filter((d) => d.iterationId === result.iterations[0]!.id)
        if (noPreview) expect(firstAttempt.filter((d) => !d.restart)).toEqual([])
        else if (size && firstAttempt.some((d) => !d.restart)) expect(firstAttempt.at(-1)?.restart).toBe(true)
        expect(deltas.filter((d) => !d.restart).every((d) => !d.content.includes('Private reasoning'))).toBe(true)
      }
    }
  )
})

// A provider's STOP removes the delimiter. The start marker remains mandatory,
// and successful stop metadata cannot rescue an incomplete or malformed block.
describe('Cognitive response boundaries', () => {
  test.each(protocolLanguages)(
    '$language: accepts a hidden preamble before start and a provider-consumed end',
    async ({ reply }) => {
      for (const size of [0, 1, 7, 100000]) {
        const raw = `Private reasoning.\n■send=message\nDo not leak this either.\n■start\n■send=message\n${reply}\n■next=listen\n`
        const requests: unknown[] = [],
          delivered: string[] = [],
          deltas: MessageDelta[] = []
        class Stopped extends Replay {
          override async generateText(input?: unknown) {
            requests.push(input)
            return { output: raw, metadata: { ...metadata, stopReason: 'stop' as const } }
          }
        }
        class StoppedStream extends Stopped {
          async *generateTextStream(input: unknown): AsyncGenerator<CognitiveStreamChunk> {
            const response = await this.generateText(input)
            for (let i = 0; i < raw.length; i += size) yield { output: raw.slice(i, i + size), created: 1 }
            yield { metadata: response.metadata, finished: true, created: 2 }
          }
        }
        const chat = new Chat({
          components: [DefaultComponents.Text],
          handler: async (component) => {
            delivered.push(component.children.join(''))
          },
          onMessageDelta: (delta) => {
            deltas.push({ ...delta })
          },
        })
        const result = await executeContext({
          client: size ? new StoppedStream([]) : new Stopped([]),
          chat,
          options: { loop: 1 },
        })
        expect(requests).toEqual([expect.objectContaining({ stopSequences: ['\n■end'] })])
        expect(result.isSuccess()).toBe(true)
        expect(delivered).toEqual([reply])
        expect(deltas.filter((d) => !d.restart).every((d) => reply.startsWith(d.content))).toBe(true)
        expect(result.iterations[0]!.llm?.output).toBe(raw)
        expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(
          expect.objectContaining({ code: 'unexpected-text' })
        )
      }
    }
  )

  test.each([
    'Private thoughts only',
    '■send=message\nMissing start\n■next=listen',
    '■start\n■send=message\nMissing exit',
    '■start\n■run\nawait record(\n',
    '■start\n■send=message\nHello\n■next=listen\n■en',
  ])('STOP cannot make malformed content valid: %s', async (raw) => {
    class Stopped extends Replay {
      override async generateText() {
        return { output: raw, metadata: { ...metadata, stopReason: 'stop' as const } }
      }
    }
    const handler = vi.fn(),
      record = vi.fn(async () => undefined)
    const result = await executeContext({
      client: new Stopped([]),
      chat: new Chat({ components: [DefaultComponents.Text], handler }),
      tools: [new Tool({ name: 'record', handler: record })],
      options: { loop: 1 },
    })
    expect(result.isError()).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    expect(record).not.toHaveBeenCalled()
  })
})

describe('STOP with code and restarts', () => {
  test.each([false, true])(
    'executes stopped code once after successful generation (streaming=%s)',
    async (streaming) => {
      const called = vi.fn(async () => undefined),
        delivered: string[] = []
      const raw = 'Reasoning before start.\n■start\n■send=message\nChecking.\n■run\nawait record()\n■next=listen\n'
      class Stopped extends Replay {
        override async generateText() {
          return { output: raw, metadata: { ...metadata, stopReason: 'stop' as const } }
        }
      }
      class Streaming extends Stopped {
        async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
          for (const char of raw) {
            yield { output: char, created: 1 }
            expect(called).not.toHaveBeenCalled()
            expect(delivered).toEqual([])
          }
          yield { metadata: { ...metadata, stopReason: 'stop' }, finished: true, created: 2 }
          expect(called).not.toHaveBeenCalled()
        }
      }
      const result = await executeContext({
        client: streaming ? new Streaming([]) : new Stopped([]),
        chat: new Chat({
          components: [DefaultComponents.Text],
          handler: async (c) => {
            delivered.push(c.children.join(''))
          },
        }),
        tools: [new Tool({ name: 'record', handler: called })],
        options: { loop: 1 },
      })
      expect(result.isSuccess()).toBe(true)
      expect(called).toHaveBeenCalledOnce()
      expect(delivered).toEqual(['Checking.'])
    }
  )

  test.each([true, false])(
    'forgets stopped metadata and provisional code on a restart (replacement metadata=%s)',
    async (replacementMetadata) => {
      const called = vi.fn(async () => undefined),
        delivered: string[] = [],
        deltas: MessageDelta[] = []
      class Restart extends Replay {
        async *generateTextStream(input: { stopSequences?: string[] }): AsyncGenerator<CognitiveStreamChunk> {
          expect(input.stopSequences).toEqual(['\n■end'])
          yield { output: '■start\n■send=message\nAbandoned\n■run\nawait record()\n■next=listen\n', created: 1 }
          yield { metadata: { ...metadata, stopReason: 'stop' }, finished: true, created: 2 }
          expect(called).not.toHaveBeenCalled()
          expect(delivered).toEqual([])
          yield { restart: { attempt: 2, fromModel: 'fake', toModel: 'fake', reason: 'fallback' }, created: 3 }
          const replacement =
            'Private replacement reasoning.\n■start\n■send=message\nKept\n■run\nawait record()\n■next=listen\n'
          for (const char of replacement) yield { output: char, created: 4 }
          if (replacementMetadata) yield { metadata: { ...metadata, stopReason: 'stop' }, finished: true, created: 5 }
        }
      }
      const result = await executeContext({
        client: new Restart([]),
        chat: new Chat({
          components: [DefaultComponents.Text],
          handler: async (c) => {
            delivered.push(c.children.join(''))
          },
          onMessageDelta: (d) => {
            deltas.push({ ...d })
          },
        }),
        tools: [new Tool({ name: 'record', handler: called })],
        options: { loop: 1, midStreamFallback: true },
      })
      expect(result.isSuccess()).toBe(replacementMetadata)
      expect(called).toHaveBeenCalledTimes(replacementMetadata ? 1 : 0)
      expect(delivered).toEqual(replacementMetadata ? ['Kept'] : [])
      expect(
        deltas.filter((d) => !d.restart).every((d) => ['Abandoned', 'Kept'].some((s) => s.startsWith(d.content)))
      ).toBe(true)
      expect(deltas.filter((d) => d.restart)).toHaveLength(replacementMetadata ? 1 : 2)
    }
  )
})

test('STOP matches the end boundary line, not a mention of it in private reasoning', async () => {
  const delivered: string[] = []
  class ProviderStop extends Replay {
    override async generateText(input?: { stopSequences?: string | string[] }) {
      const full =
        'I must finish with ■end after the response.\n■start\n■send=message\nHello!\n■next=listen\n■end\nNever generate this.'
      const stop = Array.isArray(input?.stopSequences) ? input.stopSequences[0] : input?.stopSequences
      expect(stop).toBeDefined()
      return { output: full.slice(0, full.indexOf(stop!)), metadata: { ...metadata, stopReason: 'stop' as const } }
    }
  }
  const result = await executeContext({
    client: new ProviderStop([]),
    chat: new Chat({
      components: [DefaultComponents.Text],
      handler: async (c) => {
        delivered.push(c.children.join(''))
      },
    }),
    options: { loop: 1 },
  })
  expect(result.isSuccess()).toBe(true)
  expect(delivered).toEqual(['Hello!'])
})

test.each([false, true])('pre-start reasoning permits an intentional silent exit (streaming=%s)', async (streaming) => {
  const raw = 'The user asked me to wait silently.\n■start\n■next=listen\n■end'
  const handler = vi.fn(),
    delta = vi.fn()
  const result = await executeContext({
    client: streaming ? new StreamReplay([raw], 1) : new Replay([raw]),
    chat: new Chat({ components: [DefaultComponents.Text], handler, onMessageDelta: delta }),
    options: { loop: 1 },
  })
  expect(result.isSuccess()).toBe(true)
  expect(handler).not.toHaveBeenCalled()
  expect(delta).not.toHaveBeenCalled()
  expect(result.iterations[0]!.llm?.output).toBe(raw)
})

test('retracts provisional previews when a completed message handler fails', async () => {
  const raw = frame('■send=message\nHello!\n■run\nawait record()\n■next=listen')
  const deltas: MessageDelta[] = [],
    record = vi.fn(async () => undefined)
  const result = await executeContext({
    client: new StreamReplay([raw], 1),
    chat: new Chat({
      components: [DefaultComponents.Text],
      handler: async () => {
        throw new Error('Delivery failed')
      },
      onMessageDelta: (delta) => {
        deltas.push({ ...delta })
      },
    }),
    tools: [new Tool({ name: 'record', handler: record })],
    options: { loop: 1 },
  })
  expect(result.isError()).toBe(true)
  expect(deltas.some((d) => !d.restart && d.content === 'Hello!')).toBe(true)
  expect(deltas.at(-1)?.restart).toBe(true)
  expect(record).not.toHaveBeenCalled()
  expect(result.iterations[0]!.llm?.output).toBe(raw)
})

// Verbatim worker failures from uncached synthetic Qwen runs: never treat the exit as success.
test.each(
  [
    '■start\nEl total verificado es 42.\n■next=done {"total":42}',
    '■start\nO total verificado é 42.\n■next=done {"total":42}',
  ].flatMap((raw) => [false, true].map((streaming) => ({ raw, streaming })))
)(
  'rejects translated worker prose before accepting a corrected exit (streaming=$streaming): $raw',
  async ({ raw, streaming }) => {
    class Stopped extends Replay {
      override async generateText() {
        const response = await super.generateText()
        return { ...response, metadata: { ...metadata, stopReason: 'stop' as const } }
      }
    }
    class Streaming extends Stopped {
      async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
        const response = await this.generateText()
        for (const char of response.output) yield { output: char, created: 1 }
        yield { metadata: response.metadata, finished: true, created: 2 }
      }
    }
    const onExit = vi.fn(),
      responses = [raw, frame('■next=done {"total":42}')]
    const result = await executeContext({
      client: streaming ? new Streaming(responses) : new Stopped(responses),
      exits: [
        new Exit({ name: 'done', description: 'Report the verified total', schema: z.object({ total: z.number() }) }),
      ],
      onExit,
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.iterations.map((i) => i.status.type)).toEqual(['invalid_code_error', 'exit_success'])
    expect(onExit).toHaveBeenCalledOnce()
    expect(result.iterations[0]!.llm?.output).toBe(raw)
    expect(result.iterations[0]!.llm?.diagnostics).toContainEqual(expect.objectContaining({ code: 'unexpected-text' }))
  }
)
