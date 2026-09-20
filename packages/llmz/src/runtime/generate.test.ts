import type { CognitiveMetadata, CognitiveRequest, CognitiveResponse, CognitiveStreamChunk } from '@botpress/cognitive'
import { describe, expect, it, vi } from 'vitest'
import { type MessageDelta } from '../chat/chat.js'
import { DefaultExit, type Context, type ContextTokens, type Iteration } from '../context.js'
import { createInspector } from '../inspection.js'
import type { CompactionOptions } from '../session/compactor.js'
import { Session } from '../session/session.js'
import type { Trace } from '../types.js'
import { createRecordingChat } from './fixtures/chat.js'
import { countNativeRequestTokens, generateCode, type NativeResponse } from './generate.js'
import type { RuntimeCognitive } from './types.js'

const metadata = (stopReason: CognitiveMetadata['stopReason'] = 'stop'): CognitiveMetadata => ({
  provider: 'test',
  model: 'test:model',
  usage: { inputTokens: 20, outputTokens: 10, inputCost: 0, outputCost: 0 },
  cost: 0,
  stopReason,
})
const call = (id: string) => ({ id, name: 'run_javascript', input: { code: `return ${JSON.stringify(id)}` } })

function fixture(options: { session?: Session; maxTokens?: number; midStreamFallback?: boolean } = {}) {
  const session = options.session ?? new Session()

  if (!session.turn) {
    session.append({ role: 'user', content: 'Find my account' })
    session.beginTurn()
  }

  const info = session.nextIteration()
  const iteration = {
    id: info.id,
    model: 'test:model',
    temperature: 0,
    systemMessage: { role: 'system', content: 'Use native tools.' },
    traces: [],
    recordTrace: (trace: Trace) => {
      iteration.traces.push(trace)
    },
    exits: [DefaultExit],
    tokens: {
      input: 0,
      output: 0,
      total: 0,
      limit: 32_768,
      context: {
        total: 4,
        framework: 0,
        instructions: 0,
        tools: 0,
        protocol: 4,
        iterations: 0,
      },
    },
  } as unknown as Iteration
  const ctx = {
    session,
    inspector: createInspector(),
    iterations: [iteration],
    loop: 5,
    maxTokens: options.maxTokens,
    midStreamFallback: options.midStreamFallback,
  } as unknown as Context
  const controller = new AbortController()
  const generateText = vi.fn(
    async (_input: CognitiveRequest): Promise<CognitiveResponse> => ({ output: 'Done', metadata: metadata() })
  )
  const getModelDetails = vi.fn(async () => ({
    id: 'test:model',
    input: { maxTokens: 32_768 },
    output: { maxTokens: 8_192 },
  }))
  const cognitive = { generateText, getModelDetails } as unknown as RuntimeCognitive

  return { iteration, ctx, controller, cognitive, generateText, session }
}

function withStream(
  base: ReturnType<typeof fixture>,
  stream: () => AsyncGenerator<CognitiveStreamChunk>
): RuntimeCognitive {
  return { ...base.cognitive, generateTextStream: stream } as RuntimeCognitive
}

function expectCurrentContextTokens(context: ContextTokens, input: CognitiveRequest): void {
  const { total, ...parts } = context
  const values = Object.values(parts)

  expect(total).toBe(countNativeRequestTokens(input.messages, input.tools))
  expect(values.every((value) => Number.isInteger(value) && value >= 0)).toBe(true)
  expect(values.reduce((sum, value) => sum + value, 0)).toBe(total)
}

describe('native generation', () => {
  it.each([false, true])('requires JavaScript for workers while allowing assistant text for chat=%s', async (chat) => {
    const base = fixture()

    if (chat) {
      base.ctx.chat = createRecordingChat({ handler: () => {} })
    }

    await generateCode(base)

    expect(base.generateText.mock.calls[0]?.[0].toolControl).toEqual({
      mode: chat ? 'auto' : 'required',
      parallel: false,
    })
  })

  it('does not dispatch code when a worker stream says Done and then fails', async () => {
    const base = fixture()
    const onToolCalls = vi.fn()
    const cognitive = withStream(base, async function* () {
      yield { created: 1, output: 'Done.' }
      throw new Error('Generation failed. Discard the partial response and retry the request.')
    })

    await expect(generateCode({ ...base, cognitive, onToolCalls })).rejects.toThrow('Generation failed')
    expect(onToolCalls).not.toHaveBeenCalled()
  })

  it.each([false, true])('gives valid final-response guidance for chat=%s', async (chat) => {
    const base = fixture()
    base.ctx.loop = 1

    if (chat) {
      base.ctx.chat = createRecordingChat({ handler: () => {} })
    }

    await generateCode(base)

    const guidance = String(base.generateText.mock.calls[0]?.[0].messages.at(-1)?.content)

    expect(guidance).toContain('This is the last response.')

    if (chat) {
      expect(guidance).toContain('Answer from inspected evidence with normal assistant text')
      expect(guidance).toContain('return exit("listen")')
    } else {
      expect(guidance).toContain('return exit("NAME", payload) from run_javascript')
      expect(guidance).toContain('incomplete or error payload only when the exit schema permits it')
      expect(guidance).toContain('Assistant prose and inspection returns do not complete a worker')
      expect(guidance).not.toContain('or an honest final answer')
    }
  })

  it('sends native tool schemas and counts arguments, results, and schemas', async () => {
    const base = fixture()
    const response = await generateCode(base)

    expect(response.output).toBe('Done')
    const input = base.generateText.mock.calls[0]![0]

    expect(input.toolControl).toEqual({ mode: 'required', parallel: false })
    expect(input.stopSequences).toBeUndefined()
    expect(input.tools?.[0]?.name).toBe('run_javascript')
    expect(input.messages.at(-1)?.content).toContain('## Memory')
    expect(
      countNativeRequestTokens(
        [
          {
            role: 'assistant',
            content: null,
            toolCalls: [
              {
                id: 'a',
                type: 'function',
                function: { name: 'run_javascript', arguments: { code: 'account '.repeat(2000) } },
              },
            ],
          },
        ],
        []
      )
    ).toBeGreaterThan(1000)
    expect(countNativeRequestTokens([], [{ description: 'schema '.repeat(2000) }])).toBeGreaterThan(1000)
    const context = base.iteration.tokens!.context

    expectCurrentContextTokens(context, input)
    expect(context.tools).toBeGreaterThan(0)
    expect(context.iterations).toBeGreaterThan(0)
  })

  it.each(['image', 'audio'] as const)(
    'forwards large inline %s without charging encoded bytes as model text',
    async (type) => {
      const url = `data:${type}/${type === 'image' ? 'png' : 'wav'};base64,${'AQID'.repeat(128_000)}`
      const session = new Session()
      session.append({
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this attachment.' },
          { type, url },
        ],
      })
      session.beginTurn()
      const base = fixture({ session, maxTokens: 1000 })

      await generateCode(base)

      expect(base.generateText).toHaveBeenCalledOnce()
      const input = base.generateText.mock.calls[0]![0]
      const content = input.messages.find((message) => message.role === 'user')?.content

      expect(content).toContainEqual({ type, url })
      expect(session.messages[0]?.content).toContainEqual({ type, url })
      expect(base.iteration.tokens!.context.total).toBeLessThan(1000)
      expectCurrentContextTokens(base.iteration.tokens!.context, input)
    }
  )

  it.each(['string', 'text part'] as const)('still rejects oversized text in %s content', async (kind) => {
    const text = `data:image/png;base64,${'AQID'.repeat(4000)}`
    const session = new Session()
    session.append({ role: 'user', content: kind === 'string' ? text : [{ type: 'text', text }] })
    session.beginTurn()
    const base = fixture({ session, maxTokens: 1000 })

    await expect(generateCode(base)).rejects.toThrow('does not fit in the context window')

    expect(base.generateText).not.toHaveBeenCalled()
  })

  it('counts media-shaped business arguments and tool results as text', () => {
    const value = { type: 'image', url: `data:image/png;base64,${'AQID'.repeat(4000)}` }
    const argumentsTokens = countNativeRequestTokens(
      [
        {
          role: 'assistant',
          content: null,
          toolCalls: [{ id: 'call', type: 'function', function: { name: 'processData', arguments: value } }],
        },
      ],
      []
    )
    const resultTokens = countNativeRequestTokens(
      [{ role: 'user', type: 'tool_result', toolResultCallId: 'call', content: JSON.stringify(value) }],
      []
    )

    expect(argumentsTokens).toBeGreaterThan(1000)
    expect(resultTokens).toBeGreaterThan(1000)
  })

  it('bounds static token estimates after hooks replace the system prompt', async () => {
    const base = fixture()
    base.iteration.tokens!.context = {
      total: 20_000,
      framework: 0,
      instructions: 5_000,
      tools: 5_000,
      protocol: 5_000,
      iterations: 0,
    }
    const onBeforeRequest = ({ messages }: { messages: CognitiveRequest['messages'] }) => ({
      messages: messages.map((message) =>
        message.role === 'system' ? { ...message, content: 'Updated system rules.' } : message
      ),
    })

    await generateCode({ ...base, onBeforeRequest })

    const input = base.generateText.mock.calls[0]![0]
    const context = base.iteration.tokens!.context
    const system = input.messages.filter((message) => message.role === 'system')
    const schemaTokens = countNativeRequestTokens([], input.tools) - countNativeRequestTokens([], [])
    const staticTokens = context.instructions + context.tools - schemaTokens + context.protocol

    expectCurrentContextTokens(context, input)
    expect(staticTokens).toBeLessThanOrEqual(countNativeRequestTokens(system, []))
    expect(context.tools).toBeGreaterThanOrEqual(schemaTokens)

    await generateCode({ ...base, onBeforeRequest })

    expect(base.iteration.tokens!.context).toEqual(context)
  })

  it('removes static token categories when a hook removes the system prompt', async () => {
    const base = fixture()
    await generateCode({
      ...base,
      onBeforeRequest: ({ messages }) => ({ messages: messages.filter((message) => message.role !== 'system') }),
    })

    const input = base.generateText.mock.calls[0]![0]
    const context = base.iteration.tokens!.context

    expectCurrentContextTokens(context, input)
    expect(context.instructions).toBe(0)
    expect(context.protocol).toBe(0)
    expect(context.tools).toBeGreaterThan(0)
    expect(context.iterations).toBeGreaterThan(0)
  })

  it('does not publish calls until the stream transport has fully completed', async () => {
    const base = fixture()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let waiting = false
    const cognitive = withStream(base, async function* () {
      yield { created: 1, finished: true, metadata: metadata('tool_calls'), toolCalls: [call('ready')] }
      waiting = true
      await gate
    })
    let completed = false
    const result = generateCode({ ...base, cognitive }).then((response) => {
      completed = true

      return response
    })
    await vi.waitFor(() => expect(waiting).toBe(true))

    expect(completed).toBe(false)
    expect(base.session.messages.some((message) => message.toolCalls?.length)).toBe(false)
    release()

    expect((await result).toolCalls).toEqual([call('ready')])
  })

  it.each([false, true])('dispatches a complete tool call before the stream tail (finished=%s)', async (finished) => {
    const base = fixture()
    const events: string[] = []
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let waiting = false
    const cognitive = withStream(base, async function* () {
      yield { created: 1, output: 'Before.' }
      yield { created: 2, toolCalls: [call('ready')], finished, metadata: metadata('tool_calls') }
      waiting = true
      await gate

      if (!finished) {
        yield { created: 3, output: 'After.', finished: true, metadata: metadata('tool_calls') }
      }
    })
    let completed = false
    const generation = generateCode({
      ...base,
      cognitive,
      onToolCalls: () => {
        events.push('tool started')
        return true
      },
      onSendDelta: (delta) => {
        if (!delta.restart) {
          events.push(delta.delta)
        }
      },
    }).then((response) => {
      completed = true
      return response
    })
    await vi.waitFor(() => expect(waiting).toBe(true))

    expect(events).toEqual(['Before.', 'tool started'])
    expect(completed).toBe(false)
    release()

    const response = await generation
    expect(response.toolCalls).toEqual([call('ready')])
    expect(events).toEqual(finished ? ['Before.', 'tool started'] : ['Before.', 'tool started', 'After.'])
  })

  it('freezes accepted arguments and dispatches identical tool snapshots once', async () => {
    const base = fixture()
    const original = call('ready')
    const onToolCalls = vi.fn((calls) => {
      expect(Object.isFrozen(calls)).toBe(true)
      expect(Object.isFrozen(calls[0].input)).toBe(true)
      return true
    })
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [original] }
      original.input.code = 'mutated provider object'
      yield { created: 2, toolCalls: [call('ready')], finished: true, metadata: metadata('tool_calls') }
      yield { created: 3, toolCalls: [call('ready')] }
    })

    const response = await generateCode({ ...base, cognitive, onToolCalls })

    expect(onToolCalls).toHaveBeenCalledOnce()
    expect(response.toolCalls).toEqual([call('ready')])
    expect(onToolCalls.mock.calls[0]?.[0]).toEqual(response.toolCalls)
  })

  it.each([
    { description: 'changed identity', calls: [call('changed')] },
    { description: 'changed arguments', calls: [{ ...call('ready'), input: { code: 'return 999' } }] },
    { description: 'removed call', calls: [] },
  ])('rejects $description after dispatch without starting another call', async ({ calls }) => {
    const base = fixture()
    const onToolCalls = vi.fn(() => true)
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [call('ready')] }
      yield { created: 2, toolCalls: calls, finished: true, metadata: metadata('tool_calls') }
    })

    await expect(generateCode({ ...base, cognitive, onToolCalls })).rejects.toThrow(
      /changed tool calls after execution/
    )
    expect(onToolCalls).toHaveBeenCalledOnce()
  })

  it('rejects provider restart after dispatch instead of replaying completed work', async () => {
    const base = fixture({ midStreamFallback: true })
    const onToolCalls = vi.fn(() => true)
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [call('ready')] }
      yield { created: 2, restart: { attempt: 2, fromModel: 'test:old', toModel: 'test:new', reason: 'timeout' } }
      yield { created: 3, toolCalls: [call('replacement')], finished: true, metadata: metadata('tool_calls') }
    })

    await expect(generateCode({ ...base, cognitive, onToolCalls })).rejects.toThrow(/restarted after tool execution/)
    expect(onToolCalls).toHaveBeenCalledOnce()
  })

  it('retains restart behavior when the executor declined an early batch', async () => {
    const base = fixture({ midStreamFallback: true })
    const onToolCalls = vi.fn(() => false)
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [call('declined')] }
      yield { created: 2, toolCalls: [call('declined')] }
      yield { created: 3, restart: { attempt: 2, fromModel: 'test:old', toModel: 'test:new', reason: 'timeout' } }
      yield { created: 4, output: 'Replacement.', finished: true, metadata: metadata() }
    })

    const response = await generateCode({ ...base, cognitive, onToolCalls })

    expect(onToolCalls).toHaveBeenCalledOnce()
    expect(response).toMatchObject({ output: 'Replacement.', toolCalls: [] })
  })

  it('validates call identity before offering it for execution', async () => {
    const base = fixture()
    const onToolCalls = vi.fn(() => true)
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [call(''), call('')], finished: true, metadata: metadata('tool_calls') }
    })

    await expect(generateCode({ ...base, cognitive, onToolCalls })).rejects.toThrow(/missing or duplicate/)
    expect(onToolCalls).not.toHaveBeenCalled()
  })

  it('rejects a disagreeing assistant message before offering its tool call', async () => {
    const base = fixture()
    const onToolCalls = vi.fn(() => true)
    const cognitive = withStream(base, async function* () {
      yield {
        created: 1,
        toolCalls: [call('ready')],
        assistantMessage: {
          role: 'assistant',
          content: null,
          toolCalls: [
            { id: 'different', type: 'function', function: { name: 'run_javascript', arguments: call('ready').input } },
          ],
        },
        finished: true,
        metadata: metadata('tool_calls'),
      } as CognitiveStreamChunk
    })

    await expect(generateCode({ ...base, cognitive, onToolCalls })).rejects.toThrow(/disagree/)
    expect(onToolCalls).not.toHaveBeenCalled()
  })

  it('checks same-chunk assistant text against the full streamed prefix before dispatch', async () => {
    const base = fixture()
    const onToolCalls = vi.fn(() => true)
    const cognitive = withStream(base, async function* () {
      yield { created: 1, output: 'Before ' }
      yield {
        created: 2,
        output: 'execution.',
        toolCalls: [call('ready')],
        assistantMessage: {
          role: 'assistant',
          content: 'Before execution.',
          toolCalls: [
            { id: 'ready', type: 'function', function: { name: 'run_javascript', arguments: call('ready').input } },
          ],
        },
        finished: true,
        metadata: metadata('tool_calls'),
      } as CognitiveStreamChunk
    })

    const response = await generateCode({ ...base, cognitive, onToolCalls })

    expect(response.output).toBe('Before execution.')
    expect(onToolCalls).toHaveBeenCalledOnce()
  })

  it('discards a finished-looking batch when transport fails afterward', async () => {
    const base = fixture()
    const cognitive = withStream(base, async function* () {
      yield { created: 1, finished: true, metadata: metadata('tool_calls'), toolCalls: [call('never-run')] }
      throw new Error('Transport reset after terminal chunk')
    })

    await expect(generateCode({ ...base, cognitive })).rejects.toThrow('Transport reset')
    expect(base.iteration.llm?.status).toBe('error')
    expect(base.session.pendingCalls).toHaveLength(0)
  })

  it('clears output, native calls, metadata and provider continuation across stream restarts', async () => {
    const base = fixture({ midStreamFallback: true })
    const deltas: MessageDelta[] = []
    const cognitive = withStream(base, async function* () {
      yield {
        created: 1,
        output: 'Old text',
        toolCalls: [call('abandoned')],
        metadata: metadata('tool_calls'),
        continuation: { signature: 'old' },
      } as CognitiveStreamChunk
      yield { created: 2, restart: { attempt: 2, fromModel: 'test:old', toModel: 'test:new', reason: 'timeout' } }
      yield { created: 3, output: 'Replacement', finished: true, metadata: metadata() }
    })
    const response = await generateCode({
      ...base,
      cognitive,
      onSendDelta: (delta) => {
        deltas.push(delta)
      },
    })

    expect(response).toMatchObject({ output: 'Replacement', toolCalls: [], continuation: undefined })
    expect(deltas.map((delta) => delta.restart)).toEqual([false, true, false])
    expect(response.messageMetadata.id).toContain(':2:text')
  })

  it.each(['max_tokens', 'content_filter', 'other'] as const)(
    'rejects incomplete native calls on %s and retracts text previews',
    async (stopReason) => {
      const base = fixture()
      const deltas: MessageDelta[] = []
      const onToolCalls = vi.fn(() => true)
      const cognitive = withStream(base, async function* () {
        yield { created: 1, output: 'Provisional' }
        yield { created: 2, finished: true, metadata: metadata(stopReason), toolCalls: [call('never-run')] }
      })

      await expect(
        generateCode({
          ...base,
          cognitive,
          onToolCalls,
          onSendDelta: (delta) => {
            deltas.push(delta)
          },
        })
      ).rejects.toThrow('did not complete')
      expect(deltas.at(-1)?.restart).toBe(true)
      expect(base.iteration.llm?.status).toBe('error')
      expect(onToolCalls).not.toHaveBeenCalled()
    }
  )

  it('rejects stream exhaustion without an explicit completion signal', async () => {
    const base = fixture()
    const cognitive = withStream(base, async function* () {
      yield { created: 1, toolCalls: [call('unfinished')], metadata: metadata('tool_calls') }
    })

    await expect(generateCode({ ...base, cognitive })).rejects.toThrow('completion signal')
  })

  it('cancels an uncooperative stalled stream promptly', async () => {
    const base = fixture()
    let waiting = false
    const cognitive = withStream(base, async function* () {
      waiting = true
      await new Promise<void>(() => {})
      yield { created: 1 }
    })
    const generation = generateCode({ ...base, cognitive })
    const assertion = expect(generation).rejects.toThrow('Cancelled by host')
    await vi.waitFor(() => expect(waiting).toBe(true))
    base.controller.abort(new Error('Cancelled by host'))
    await assertion
  })

  it('cancels an uncooperative non-streaming provider promptly', async () => {
    const base = fixture()
    base.generateText.mockImplementation(() => new Promise<CognitiveResponse>(() => {}))
    const generation = generateCode(base)
    const assertion = expect(generation).rejects.toThrow('Cancelled by host')
    await vi.waitFor(() => expect(base.generateText).toHaveBeenCalled())
    base.controller.abort(new Error('Cancelled by host'))
    await assertion
  })

  it('observes provider rejection when the provider aborts while creating its promise', async () => {
    const base = fixture()
    base.generateText.mockImplementation(async () => {
      base.controller.abort(new Error('Synchronous provider cancellation'))
      throw new Error('Provider promise rejected after abort')
    })

    await expect(generateCode(base)).rejects.toThrow('Synchronous provider cancellation')
  })

  it('preserves a full custom adapter message and rejects normalized call divergence', async () => {
    const base = fixture()
    const assistantMessage = {
      role: 'assistant' as const,
      content: null,
      toolCalls: [
        { id: 'call', type: 'function' as const, function: { name: 'run_javascript', arguments: call('call').input } },
      ],
      providerState: { signature: 'signed-tool-use', reasoningItems: ['opaque'] },
    }
    base.generateText.mockResolvedValue({
      output: '',
      toolCalls: [call('call')],
      assistantMessage,
      continuation: { signature: 'additional' },
      metadata: metadata('tool_calls'),
    } as NativeResponse)
    const result = await generateCode(base)

    expect(result.assistantMessage).toEqual(assistantMessage)
    expect(result.continuation).toEqual({ signature: 'additional' })
    base.generateText.mockResolvedValue({
      output: '',
      toolCalls: [call('different')],
      assistantMessage,
      metadata: metadata('tool_calls'),
    } as NativeResponse)

    await expect(generateCode(base)).rejects.toThrow('disagree')
  })

  it('rejects duplicate native call IDs before committing a response', async () => {
    const base = fixture()
    base.generateText.mockResolvedValue({
      output: '',
      toolCalls: [call('same'), call('same')],
      metadata: metadata('tool_calls'),
    })

    await expect(generateCode(base)).rejects.toThrow('duplicate')
  })

  it('compacts entire settled call/result groups and updates the materialized memory view', async () => {
    const session = new Session({ variables: { keep: 'named value' } })

    for (const id of ['old-a', 'old-b']) {
      session.append({ role: 'user', content: `Request ${id}` })
      session.beginTurn()
      const info = session.nextIteration(id)
      session.appendAssistant(id, { output: '', toolCalls: [call(id)] })
      session.appendToolResult(id, id, 'record '.repeat(5000))
      session.commitIteration({ ...info, hasResult: true, result: id })
      session.settleIteration(id, { outcome: 'completed' })
      session.completeTurn()
    }

    session.append({ role: 'user', content: 'New request' })
    session.beginTurn()
    const base = fixture({ session, maxTokens: 2000 })
    const originalHistoryTokens = countNativeRequestTokens(session.requestMessages(), [])
    base.iteration.tokens!.context.iterations = originalHistoryTokens

    await generateCode(base)

    expect(session.retainedIterationIds).toEqual([base.iteration.id])
    expect(session.iterations).toHaveLength(0)
    expect(session.getBindings()).toMatchObject({ keep: 'named value', $return: undefined, $iterations: [] })
    const input = base.generateText.mock.calls.at(-1)![0]

    expect(input.messages.some((message) => message.toolCalls?.length)).toBe(false)
    expect(input.messages.at(-1)?.content).toContain('keep')
    const context = base.iteration.tokens!.context

    expectCurrentContextTokens(context, input)
    expect(context.iterations).toBeLessThan(originalHistoryTokens / 2)
    expect(context.tools).toBeGreaterThan(0)
  })

  it('preserves explicit request overrides and rejects ones that exceed the budget', async () => {
    const base = fixture()
    await generateCode({
      ...base,
      onBeforeRequest: ({ messages }) => ({
        messages: [...messages, { role: 'user', content: 'Custom hook request' }],
      }),
    })

    const input = base.generateText.mock.calls[0]![0]

    expect(input.messages.at(-1)?.content).toBe('Custom hook request')
    expectCurrentContextTokens(base.iteration.tokens!.context, input)
    const small = fixture({ maxTokens: 1000 })

    await expect(
      generateCode({
        ...small,
        onBeforeRequest: ({ messages }) => ({
          messages: [...messages, { role: 'user', content: 'Custom hook request '.repeat(3000) }],
        }),
      })
    ).rejects.toThrow('onBeforeRequest messages exceed')
    expect(small.generateText).not.toHaveBeenCalled()
  })

  it('keeps request overrides ephemeral and renders one current memory inventory', async () => {
    const base = fixture()
    const onBeforeRequest = ({ messages }: { messages: CognitiveRequest['messages'] }) => ({
      messages: [...messages, { role: 'user' as const, content: 'Additional hook context' }],
    })

    await generateCode({ ...base, onBeforeRequest })
    await generateCode({ ...base, onBeforeRequest })

    for (const [input] of base.generateText.mock.calls) {
      expect(input.messages.at(-1)?.content).toBe('Additional hook context')
      expect(JSON.stringify(input.messages).split('## Memory')).toHaveLength(2)
      expect(input.messages.filter((message) => message.content === 'Additional hook context')).toHaveLength(1)
    }

    expect(JSON.stringify(base.session.messages)).not.toContain('Additional hook context')
  })
})

describe('request budgeting and atomic compaction', () => {
  function history(compaction?: false | CompactionOptions) {
    const session = new Session({ variables: { retained: 'named memory' }, compaction })
    session.append({ role: 'user', content: 'Old request' })
    const info = session.nextIteration('old')
    session.appendAssistant(info.id, { output: '', toolCalls: [call('old-call')] })
    session.commitIteration({ ...info, hasResult: true, result: 'Exact result' })
    session.appendToolResult(info.id, 'old-call', 'Long historical evidence. '.repeat(2000))
    session.settleIteration(info.id)
    session.completeTurn()
    return session
  }

  it('can disable automatic compaction without silently deleting overflowing history', async () => {
    const session = history(false)
    session.append({ role: 'user', content: 'Next request' })
    const base = fixture({ session, maxTokens: 1200 })
    const before = session.messages
    await expect(generateCode(base)).rejects.toThrow('does not fit')
    expect(base.generateText).not.toHaveBeenCalled()
    expect(session.messages).toEqual(before)
    expect(session.getBindings().$return).toBe('Exact result')
  })

  it('honors configured thresholds and a custom summarizer before the hard window is full', async () => {
    const summarize = vi.fn(async () => 'The earlier task completed. Its receipt is confirmed.')
    const session = history({ triggerRatio: 0.1, targetRatio: 0.05, keepRecentIterations: 0, summarize })
    session.append({ role: 'user', content: 'Next request' })
    const base = fixture({ session })
    expect(countNativeRequestTokens(session.requestMessages(), [])).toBeLessThan(32_768 - 3276)
    await generateCode(base)
    expect(summarize).toHaveBeenCalledOnce()
    expect(base.generateText).toHaveBeenCalledOnce()
    expect(session.transcript[0]).toEqual({
      role: 'summary',
      content: 'The earlier task completed. Its receipt is confirmed.',
    })
    expect(
      base.generateText.mock.calls[0]?.[0].messages.some((message) =>
        String(message.content).includes('Conversation summary:')
      )
    ).toBe(true)
  })

  it('preserves history when the summary provider fails before request hooks or execution', async () => {
    const session = history()
    session.append({ role: 'user', content: 'Next request' })
    const base = fixture({ session, maxTokens: 1200 })
    const before = session.messages
    base.generateText.mockRejectedValueOnce(new Error('Summary provider unavailable'))
    const hook = vi.fn()
    await expect(generateCode({ ...base, onBeforeRequest: hook })).rejects.toThrow('Summary provider unavailable')
    expect(hook).not.toHaveBeenCalled()
    expect(base.generateText).toHaveBeenCalledOnce()
    expect(base.generateText.mock.calls[0]?.[0].toolControl?.mode).toBe('none')
    expect(session.messages).toEqual(before)
    expect(session.getBindings().$return).toBe('Exact result')
  })

  it('uses the smallest fallback limits for the shared request', async () => {
    const base = fixture()
    base.iteration.model = ['test:large', 'test:small']
    const details = await base.cognitive.getModelDetails('test:model')
    base.cognitive.getModelDetails = vi.fn(async (id) => ({
      ...details,
      id,
      input: { ...details.input, maxTokens: id === 'test:small' ? 2000 : 32000 },
      output: { ...details.output, maxTokens: id === 'test:small' ? 64 : 8000 },
    }))
    await generateCode(base)
    const request = base.generateText.mock.calls[0]![0]
    expect(request.model).toEqual(['test:large', 'test:small'])
    expect(request.maxTokens).toBe(64)
    expect(base.iteration.tokens!.limit).toBe(2000)
    expect(countNativeRequestTokens(request.messages, request.tools) + request.maxTokens!).toBeLessThanOrEqual(2000)
    expect(base.cognitive.getModelDetails).toHaveBeenCalledTimes(2)
  })

  it('accepts an exact fit and rejects a request one token over budget', async () => {
    const measured = fixture()
    await generateCode(measured)
    const required = countNativeRequestTokens(
      measured.generateText.mock.calls[0]![0].messages,
      measured.generateText.mock.calls[0]![0].tools
    )

    for (const extra of [1, 0]) {
      const base = fixture({ maxTokens: required + extra })
      const details = await base.cognitive.getModelDetails('test:model')
      base.cognitive.getModelDetails = vi.fn(async () => ({
        ...details,
        output: { ...details.output, maxTokens: 1 },
      }))
      if (extra) {
        await generateCode(base)
        expect(base.generateText).toHaveBeenCalledOnce()
        expect(base.generateText.mock.calls[0]![0].maxTokens).toBe(1)
        expectCurrentContextTokens(base.iteration.tokens!.context, base.generateText.mock.calls[0]![0])
      } else {
        await expect(generateCode(base)).rejects.toThrow(/does not fit/)
        expect(base.generateText).not.toHaveBeenCalled()
      }
    }
  })

  it('does not discard history when the current input cannot fit even after compaction', async () => {
    const session = history()
    session.append({ role: 'user', content: 'Oversized current input. '.repeat(2000) })
    session.beginTurn()
    const base = fixture({ session, maxTokens: 1000 })
    const messages = session.messages
    const records = session.iterations
    await expect(generateCode(base)).rejects.toThrow(/does not fit/)
    expect(base.generateText).not.toHaveBeenCalled()
    expect(session.messages).toEqual(messages)
    expect(session.iterations).toEqual(records)
    expect(session.getBindings().$return).toBe('Exact result')
  })

  it.each(['overflow', 'exception', 'abort'] as const)(
    'does not commit tentative compaction after hook %s',
    async (failure) => {
      const session = history()
      session.append({ role: 'user', content: 'Next request' })
      session.beginTurn()
      const base = fixture({ session, maxTokens: 1200 })
      const original = session.messages
      const hook = vi.fn(({ messages }: { messages: CognitiveRequest['messages'] }) => {
        expect(messages.some((message) => message.toolResultCallId === 'old-call')).toBe(false)
        if (failure === 'exception') {
          throw new Error('Hook failed')
        }

        if (failure === 'abort') {
          base.controller.abort(new Error('Cancelled before dispatch'))
          return undefined
        }

        return { messages: [...messages, { role: 'user' as const, content: 'Hook overflow. '.repeat(2000) }] }
      })
      await expect(generateCode({ ...base, onBeforeRequest: hook })).rejects.toThrow()
      expect(hook).toHaveBeenCalledOnce()
      expect(base.generateText.mock.calls.every(([request]) => request.toolControl?.mode === 'none')).toBe(true)
      expect(session.messages).toEqual(original)
      expect(session.getBindings().$return).toBe('Exact result')
    }
  )

  it('commits successful compaction before dispatch and keeps named and queued state', async () => {
    const session = history()
    session.append({ role: 'user', content: 'Next request' })
    session.beginTurn()
    session.append({ role: 'user', content: 'Queued later' })
    const base = fixture({ session, maxTokens: 1200 })
    base.generateText.mockImplementation(async (input) => {
      if (input.toolControl?.mode === 'none') {
        expect(session.retainedIterationIds).toContain('old')
        return { output: 'The earlier request completed successfully.', metadata: metadata() }
      }

      expect(session.iterations).toEqual([])
      expect(session.getBindings().$return).toBeUndefined()
      expect(session.memory.variables.retained).toBe('named memory')
      expect(session.pendingMessages[0]!.content).toBe('Queued later')
      expect(JSON.stringify(input.messages)).not.toContain('old-call')
      expect(countNativeRequestTokens(input.messages, input.tools) + input.maxTokens!).toBeLessThanOrEqual(1200)
      return { output: 'Done', metadata: metadata() }
    })
    await generateCode(base)
    expect(base.generateText.mock.calls.filter(([request]) => request.toolControl?.mode !== 'none')).toHaveLength(1)
    expect(session.transcript.some((message) => message.role === 'summary')).toBe(true)
  })
})
