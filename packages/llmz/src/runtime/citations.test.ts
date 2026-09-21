import type { CognitiveMetadata, CognitiveStreamChunk, CognitiveToolCall } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { type MessageDelta } from '../chat/chat.js'
import { CitationsManager } from '../chat/citations.js'
import { DefaultComponents } from '../chat/component.default.js'
import { _CustomModelClient, type RuntimeGenerateContentInput } from '../custom-client.js'
import { ThinkSignal } from '../errors.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { buildSearchChallenge, longSearchChallenges } from './fixtures/long-search.js'

const meta: CognitiveMetadata = {
  provider: 'fake',
  model: 'fake',
  cached: false,
  cost: 0,
  latency: 1,
  usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
}
type ReplayResponse = { output: string; toolCalls?: CognitiveToolCall[]; reasoning?: string }

const javascript = (code: string): ReplayResponse => ({
  output: '',
  toolCalls: [{ id: 'js-search', name: 'run_javascript', input: { code } }],
})
class Replay extends _CustomModelClient {
  public requests: RuntimeGenerateContentInput[] = []
  public constructor(private _responses: Array<string | ReplayResponse>) {
    super()
  }
  public async getModelDetails(id: string) {
    return {
      id,
      name: id,
      description: '',
      input: { maxTokens: 128_000, costPer1MTokens: 0 },
      output: { maxTokens: 8000, costPer1MTokens: 0 },
      tags: [],
      lifecycle: 'production' as const,
    }
  }
  public async generateText(input: RuntimeGenerateContentInput) {
    this.requests.push(input)
    const response = this._responses.shift()!
    const value = typeof response === 'string' ? { output: response } : response

    return {
      ...value,
      metadata: { ...meta, stopReason: value.toolCalls?.length ? ('tool_calls' as const) : ('stop' as const) },
    }
  }
}

class Streaming extends Replay {
  public constructor(
    responses: Array<string | ReplayResponse>,
    private _size: number
  ) {
    super(responses)
  }
  public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
    const response = await this.generateText(input)

    for (let i = 0; i < response.output.length; i += this._size) {
      yield { output: response.output.slice(i, i + this._size), created: 1 }
    }

    yield { metadata: response.metadata, toolCalls: response.toolCalls, finished: true, created: 2 }
  }
}

const manager = () => {
  const citations = new CitationsManager()

  for (let i = 0; i < 15; i++) {
    citations.registerSource({ file: `source-${i}.md`, title: `Source ${i}`, url: `https://cedar.example/${i}` })
  }

  return citations
}

describe('VDK citation delivery through LLMz', () => {
  it.each(
    [
      'Approval MICA-629【1】; daily limit 734【12】.',
      '価格😊: 734【1,12】。確認済み【12】。',
      '**Verified:** MICA-629【12】\n\n- Limit: 734【1】',
      'Repeated claim【12】 and supporting detail【12】.',
    ].flatMap((body) => [0, 1, 7, 100000].map((size) => ({ body, size })))
  )('preserves citation IDs, metadata and offsets across chunk size $size: $body', async ({ body, size }) => {
    const citations = manager(),
      delivered: string[] = [],
      deltas: MessageDelta[] = []
    const raw = { output: body, reasoning: 'Private reasoning with an irrelevant source【14】.' }
    const result = await executeContext({
      client: size ? new Streaming([raw], size) : new Replay([raw]),
      chat: createRecordingChat({
        components: [],
        handler: async (message) => {
          delivered.push(message.type === 'text' ? message.text : '')
        },
        onMessageDelta: (delta) => {
          deltas.push({ ...delta })
        },
      }),
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(delivered).toEqual([body])
    expect(deltas.filter((d) => !d.restart).every((d) => body.startsWith(d.content))).toBe(true)
    const [payload, entries] = citations.removeCitationsFromObject({ text: delivered[0]! })
    expect(payload.text).toBe(body.replace(/【[\d,]+】/g, ''))
    const expected = [...body.matchAll(/【([\d,]+)】/g)].flatMap((match) =>
      match[1]!.split(',').map((id) => ({ id: Number(id), offset: match.index }))
    )
    expect(
      entries.map(({ path, citation }) => ({
        path,
        id: citation.id,
        offset: citation.offset,
        file: citation.source.file,
      }))
    ).toEqual(expected.map(({ id, offset }) => ({ path: 'root.text', id, offset, file: `source-${id}.md` })))
    expect(entries.some((e) => e.citation.id === 14)).toBe(false)
  })

  it.each([0, 1, 7, 100000])(
    'uses the actual VDK search -> ThinkSignal -> citation extraction path (chunk=%s)',
    async (size) => {
      const citations = new CitationsManager()
      const fixture = buildSearchChallenge(longSearchChallenges[0]!, true, citations)
      const body = `${fixture.facts.join('; ')}${fixture.evidenceTags.join('')}`
      const responses = [javascript('return await search_knowledge("Meridian EU export limits")'), body]
      const client = size ? new Streaming(responses, size) : new Replay(responses)
      const search = vi.fn(async () => {
        throw new ThinkSignal(fixture.reason, fixture.content)
      })
      const deliveries: ReturnType<CitationsManager['removeCitationsFromObject']>[] = []
      const result = await executeContext({
        client,
        tools: [new Tool({ name: 'search_knowledge', input: z.string(), output: z.string(), handler: search })],
        chat: createRecordingChat({
          components: [],
          handler: async (m) => {
            deliveries.push(citations.removeCitationsFromObject({ text: m.type === 'text' ? m.text : '' }))
          },
        }),
        options: { loop: 2 },
      })
      expect(result.isSuccess()).toBe(true)
      expect(search).toHaveBeenCalledOnce()
      const feedback = String(client.requests[1]!.messages.at(-1)!.content)

      for (const evidence of [...fixture.facts, ...fixture.evidenceTags]) {
        expect(feedback).toContain(evidence)
      }

      expect(deliveries).toHaveLength(1)
      expect(deliveries[0]![1].map((e) => e.citation.source.file)).toEqual(fixture.expectedSources)
    }
  )

  it.each(['partial-tag', 'completed-message', 'completed-tools'])(
    'commits only replacement citations after a restart: %s',
    async (state) => {
      const citations = manager(),
        committed: number[] = [],
        deltas: MessageDelta[] = []
      class Restart extends Replay {
        public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
          const abandoned = state === 'partial-tag' ? 'Abandoned【1' : 'Abandoned【1】'

          for (const char of abandoned) {
            yield { output: char, created: 1 }
          }

          if (state === 'completed-tools') {
            yield { toolCalls: [{ id: 'abandoned-listen', name: 'listen', input: {} }], created: 1 }
          }

          expect(committed).toEqual([])
          yield { restart: { attempt: 2, fromModel: 'fake', toModel: 'fake', reason: 'fallback' }, created: 2 }
          expect(deltas.at(-1)?.restart).toBe(true)

          for (const char of 'Kept【12】') {
            yield { output: char, created: 3 }
          }

          yield { metadata: { ...meta, stopReason: 'stop' }, finished: true, created: 4 }
        }
      }

      const result = await executeContext({
        client: new Restart([]),
        chat: createRecordingChat({
          components: [],
          handler: async (m) => {
            committed.push(...citations.extractCitations(m.type === 'text' ? m.text : '').citations.map((c) => c.id))
          },
          onMessageDelta: (d) => {
            deltas.push({ ...d })
          },
        }),
        options: { loop: 1, midStreamFallback: true },
      })
      expect(result.isSuccess()).toBe(true)
      expect(committed).toEqual([12])
    }
  )

  it('does not commit citations from a stream that fails after a complete message', async () => {
    const handler = vi.fn(),
      deltas: MessageDelta[] = []
    class Failure extends Replay {
      public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
        yield { output: 'Uncommitted【12】', created: 1 }
        throw new Error('Transport failed')
      }
    }

    const result = await executeContext({
      client: new Failure([]),
      chat: createRecordingChat({
        components: [],
        handler,
        onMessageDelta: (d) => {
          deltas.push({ ...d })
        },
      }),
      options: { loop: 1 },
    })
    expect(result.isError()).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    expect(deltas.at(-1)?.restart).toBe(true)
  })

  it('marks invented citation IDs as missing instead of fabricating source metadata', () => {
    const [payload, entries] = manager().removeCitationsFromObject({ text: 'Unsupported【99999】. Supported【12】.' })
    expect(payload.text).toBe('Unsupported. Supported.')
    expect(entries[0]!.citation).toMatchObject({ id: -1, source: 'Not Found' })
    expect(entries[1]!.citation.source.file).toBe('source-12.md')
  })
})

it.each([0, 1, 7])('preserves citations in component props (chunk=%s)', async (size) => {
  const citations = manager()
  const raw = javascript(`
    chat.card({ title: 'Policy【1】', subtitle: 'Current【12】', text: 'Limit 734【1,12】' });
    return exit();
  `)
  const delivered: ReturnType<CitationsManager['removeCitationsFromObject']>[] = []
  const result = await executeContext({
    client: size ? new Streaming([raw], size) : new Replay([raw]),
    chat: createRecordingChat({
      components: [DefaultComponents.Card],
      handler: async (component) => {
        if (component.type !== 'component') {
          throw new Error('Expected a rich component.')
        }

        delivered.push(
          citations.removeCitationsFromObject({
            title: (component.props as Record<string, unknown>).title,
            subtitle: (component.props as Record<string, unknown>).subtitle,
            text: (component.props as Record<string, unknown>).text,
          })
        )
      },
    }),
    options: { loop: 1 },
  })
  expect(result.isSuccess()).toBe(true)
  expect(delivered[0]![0]).toEqual({ title: 'Policy', subtitle: 'Current', text: 'Limit 734' })
  expect(delivered[0]![1].map((entry) => ({ path: entry.path, id: entry.citation.id }))).toEqual([
    { path: 'root.title', id: 1 },
    { path: 'root.subtitle', id: 12 },
    { path: 'root.text', id: 1 },
    { path: 'root.text', id: 12 },
  ])
})
