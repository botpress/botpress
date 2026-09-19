import type { CognitiveMetadata, CognitiveRequest, CognitiveResponse, CognitiveStreamChunk } from '@botpress/cognitive'
import { describe, expect, it, vi } from 'vitest'
import { Chat, type MessageDelta } from '../chat.js'
import type { Context, ContextTokens, Iteration } from '../context.js'
import { Session } from '../session.js'
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
    session.beginTurn({ messages: [{ role: 'user', content: 'Find my account' }] })
  }

  const info = session.nextIteration()
  const iteration = {
    id: info.id,
    model: 'test:model',
    temperature: 0,
    variables: session.memory.getBindings(),
    messages: [{ role: 'system', content: 'Use native tools.' }, ...session.requestMessages()],
    traces: [],
    nativeTools: {
      tools: [{ name: 'run_javascript', parameters: { type: 'object', properties: { code: { type: 'string' } } } }],
    },
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
        transcript: 0,
        protocol: 4,
        examples: 0,
        iterations: 0,
      },
    },
  } as unknown as Iteration
  iteration.initialMessages = structuredClone(iteration.messages)
  const ctx = {
    session,
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
  expect(context.transcript).toBe(0)
}

describe('native generation', () => {
  it.each([false, true])('gives valid final-response guidance for chat=%s', async (chat) => {
    const base = fixture()
    base.ctx.loop = 1

    if (chat) {
      base.ctx.chat = new Chat({ handler: () => {} })
    }

    await generateCode(base)

    const guidance = String(base.generateText.mock.calls[0]?.[0].messages.at(-1)?.content)

    expect(guidance).toContain('This is the last response.')

    if (chat) {
      expect(guidance).toContain('or an honest final answer')
    } else {
      expect(guidance).toContain('returning exit(name, payload) from run_javascript')
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

    expect(input.toolControl).toEqual({ mode: 'auto', parallel: false })
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

  it('bounds static token estimates after hooks replace the system prompt', async () => {
    const base = fixture()
    base.iteration.tokens!.context = {
      total: 20_000,
      framework: 0,
      instructions: 5_000,
      tools: 5_000,
      transcript: 0,
      protocol: 5_000,
      examples: 5_000,
      iterations: 0,
    }
    base.iteration.messages[0]!.content = 'Updated system rules.'
    const hookMessages = structuredClone(base.iteration.messages)

    await generateCode(base)

    const input = base.generateText.mock.calls[0]![0]
    const context = base.iteration.tokens!.context
    const system = input.messages.filter((message) => message.role === 'system')
    const schemaTokens = countNativeRequestTokens([], input.tools) - countNativeRequestTokens([], [])
    const staticTokens = context.instructions + context.tools - schemaTokens + context.protocol + context.examples

    expectCurrentContextTokens(context, input)
    expect(staticTokens).toBeLessThanOrEqual(countNativeRequestTokens(system, []))
    expect(context.tools).toBeGreaterThanOrEqual(schemaTokens)

    base.iteration.messages = hookMessages
    await generateCode(base)

    expect(base.iteration.tokens!.context).toEqual(context)
  })

  it('removes static token categories when a hook removes the system prompt', async () => {
    const base = fixture()
    base.iteration.messages.shift()

    await generateCode(base)

    const input = base.generateText.mock.calls[0]![0]
    const context = base.iteration.tokens!.context

    expectCurrentContextTokens(context, input)
    expect(context.instructions).toBe(0)
    expect(context.protocol).toBe(0)
    expect(context.examples).toBe(0)
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
      session.beginTurn({ messages: [{ role: 'user', content: `Request ${id}` }] })
      const info = session.nextIteration(id)
      session.appendAssistant(id, { output: '', toolCalls: [call(id)] })
      session.appendToolResult(id, id, 'record '.repeat(5000))
      session.memory.commit({ ...info, outcome: 'completed', hasResult: true, result: id })
      session.settleIteration(id)
    }

    session.beginTurn({ messages: [{ role: 'user', content: 'New request' }] })
    const base = fixture({ session, maxTokens: 2000 })
    const originalHistoryTokens = countNativeRequestTokens(base.iteration.messages, [])
    base.iteration.tokens!.context.iterations = originalHistoryTokens

    await generateCode(base)

    expect(session.retainedIterationIds).toEqual([base.iteration.id])
    expect(session.memory.iterations).toHaveLength(0)
    expect(base.iteration.variables).toMatchObject({ keep: 'named value', $return: undefined, $iterations: [] })
    const input = base.generateText.mock.calls[0]![0]

    expect(input.messages.some((message) => message.toolCalls?.length)).toBe(false)
    expect(input.messages.at(-1)?.content).toContain('keep')
    const context = base.iteration.tokens!.context

    expectCurrentContextTokens(context, input)
    expect(context.iterations).toBeLessThan(originalHistoryTokens / 2)
    expect(context.tools).toBeGreaterThan(0)
  })

  it('preserves custom iteration message content and refuses to silently compact it away', async () => {
    const base = fixture()
    base.iteration.messages[1]!.content = 'Custom hook request'
    await generateCode(base)

    const input = base.generateText.mock.calls[0]![0]

    expect(input.messages[1]?.content).toContain('Custom hook request')
    expectCurrentContextTokens(base.iteration.tokens!.context, input)
    const small = fixture({ maxTokens: 1000 })
    small.iteration.messages[1]!.content = 'Custom hook request '.repeat(3000)

    await expect(generateCode(small)).rejects.toThrow('hook-modified')
    expect(small.generateText).not.toHaveBeenCalled()
  })

  it('moves the ephemeral memory footer after hook-appended input without accumulating stale inventories', async () => {
    const base = fixture()
    base.iteration.messages.push({ role: 'user', content: 'Additional hook context' })
    await generateCode(base)
    const messages = base.generateText.mock.calls[0]![0].messages

    expect(messages[1]?.content).toBe('Find my account')
    expect(messages.at(-1)?.content).toContain('Additional hook context')
    expect(messages.at(-1)?.content).toContain('## Memory')
    expect(JSON.stringify(messages).split('## Memory')).toHaveLength(2)
  })
})
