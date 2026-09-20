import { describe, expect, it, vi } from 'vitest'
import { NativeClient, response } from '../runtime/fixtures/native-client.js'
import { countNativeRequestTokens } from '../runtime/token-budget.js'
import { resolveCompaction, summarizeMessages } from './compactor.js'
import { Session } from './session.js'

function client() {
  const client = new NativeClient([])
  const generate = vi
    .spyOn(client, 'generateText')
    .mockResolvedValue(response('The user chose plan A. Payment succeeded; do not charge again.'))
  return { client, generate }
}

function turn(session: Session, id: string, content = `Request ${id}`) {
  session.append({ role: 'user', content })
  const info = session.nextIteration(id)
  session.appendAssistant(id, {
    output: '',
    toolCalls: [{ id: `call-${id}`, name: 'run_javascript', input: { code: 'return 42;' } }],
  })
  session.appendToolResult(id, `call-${id}`, `Receipt for ${id}: payment succeeded.`)
  session.commitIteration({ ...info, hasResult: true, result: { receipt: id, missing: undefined } })
  session.settleIteration(id)
  session.completeTurn()
}

describe('session compactor', () => {
  it('summarizes without mutation and keeps queued input out of the summary', async () => {
    const session = new Session()
    turn(session, 'first')
    session.append({ role: 'event', name: 'button.clicked', payload: { id: 'next' } })
    const before = session.toJSON()
    const { client: cognitive, generate } = client()

    const summary = await session.summarize({ client: cognitive })

    expect(summary).toMatchObject({ role: 'summary', content: expect.stringContaining('Payment succeeded') })
    expect(session.toJSON()).toEqual(before)
    expect(JSON.stringify(generate.mock.calls)).toContain('Receipt for first')
    expect(JSON.stringify(generate.mock.calls)).not.toContain('button.clicked')
    expect(generate.mock.calls[0]?.[0]).toMatchObject({ model: 'fast', toolControl: { mode: 'none' } })
    expect(generate.mock.calls[0]?.[0].tools).toBeUndefined()
  })

  it('replaces whole call/result groups with a persistent summary and preserves exact named memory', async () => {
    const session = new Session({ variables: { account: { id: 42, optional: undefined } } })
    turn(session, 'first')
    turn(session, 'second')
    session.append({ role: 'event', name: 'button.clicked', payload: { id: 'confirm' } })
    const { client: cognitive } = client()

    const summary = await session.compact({ client: cognitive, keepRecentIterations: 1 })

    expect(session.transcript[0]).toEqual(summary)
    expect(session.transcript.at(-1)).toEqual({ role: 'event', name: 'button.clicked', payload: { id: 'confirm' } })
    expect(session.retainedIterationIds).toEqual(['second'])
    expect(session.messages.some((message) => message.toolResultCallId === 'call-first')).toBe(false)
    expect(session.messages.some((message) => message.toolResultCallId === 'call-second')).toBe(true)
    expect(session.getBindings()).toMatchObject({
      account: { id: 42, optional: undefined },
      $return: { receipt: 'second', missing: undefined },
    })
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    expect(restored.transcript).toEqual(session.transcript)
    expect(restored.requestMessages({ retainedIterationIds: ['second'] })[0]?.content).toContain(
      'Conversation summary:'
    )
  })

  it('merges the previous summary on repeated compaction instead of losing or duplicating it', async () => {
    const session = new Session()
    turn(session, 'first')
    const { client: cognitive, generate } = client()
    await session.compact({ client: cognitive, keepRecentIterations: 0 })
    turn(session, 'second')
    generate.mockResolvedValueOnce(response('Plan A was chosen and payment succeeded. A follow-up was completed.'))

    await session.compact({ client: cognitive, keepRecentIterations: 0 })

    expect(generate.mock.calls[1]?.[0].messages[1]?.content).toContain('do not charge again')
    expect(generate.mock.calls[1]?.[0].messages[1]?.content).toContain('Receipt for second')
    expect(session.transcript.filter((message) => message.role === 'summary')).toHaveLength(1)
    expect(session.getBindings().$return).toBeUndefined()
    expect(() => Session.fromJSON(JSON.parse(JSON.stringify(session)))).not.toThrow()
  })

  it('bounds every summarizer request, splits oversized evidence without dropping text, and carries the previous summary', async () => {
    const { client: cognitive, generate } = client()
    const details = await cognitive.getModelDetails('small')
    vi.spyOn(cognitive, 'getModelDetails').mockImplementation(async (id) => ({
      ...details,
      input: { ...details.input, maxTokens: id === 'small' ? 700 : 500 },
      output: { ...details.output, maxTokens: 80 },
    }))
    const text = Array.from({ length: 900 }, (_, index) => `evidence-${index} 🍁`).join(' ')
    await summarizeMessages([{ role: 'user', content: text }], {
      client: cognitive,
      model: ['small', 'fallback'],
      maxTokens: 64,
      contextWindow: 600,
    })

    expect(generate.mock.calls.length).toBeGreaterThan(2)
    const segments = generate.mock.calls.map(([request]) => {
      expect(countNativeRequestTokens(request.messages, []) + request.maxTokens!).toBeLessThanOrEqual(500)
      expect(request.toolControl).toEqual({ mode: 'none' })
      return String(request.messages[1]?.content).split('Conversation segment:\n')[1]
    })
    expect(segments.join('')).toBe(JSON.stringify({ role: 'user', content: text }))
    expect(generate.mock.calls[1]?.[0].messages[1]?.content).toContain('Earlier summary:\nThe user chose plan A')
  })

  it('omits media bytes and opaque continuation while preserving the visible evidence', async () => {
    const { client: cognitive, generate } = client()
    await summarizeMessages(
      [
        {
          role: 'user',
          type: 'multipart',
          content: [
            { type: 'text', text: 'Checkout screenshot' },
            { type: 'image', url: 'data:image/png;base64,SECRET_BYTES' },
          ],
          continuation: 'OPAQUE_STATE',
        },
      ],
      { client: cognitive }
    )
    const serialized = JSON.stringify(generate.mock.calls)
    expect(serialized).toContain('Checkout screenshot')
    expect(serialized).toContain('omitted')
    expect(serialized).not.toContain('SECRET_BYTES')
    expect(serialized).not.toContain('OPAQUE_STATE')
  })

  it.each(['empty', 'overflow', 'truncated', 'tool-call', 'provider-error', 'exception'])(
    'leaves all history and exact results intact after a %s summary',
    async (failure) => {
      const session = new Session()
      turn(session, 'first')
      const before = session.toJSON()
      const { client: cognitive, generate } = client()
      const answer = structuredClone(response('Safe summary'))
      if (failure === 'empty') {
        answer.output = ' '
      }

      if (failure === 'overflow') {
        answer.output = 'unbounded '.repeat(1000)
      }

      if (failure === 'truncated') {
        answer.metadata.stopReason = 'max_tokens'
      }

      if (failure === 'tool-call') {
        answer.toolCalls = [{ id: 'wrong', name: 'charge', input: {} }]
      }

      if (failure === 'provider-error') {
        answer.metadata.provider = 'unknown'
      }

      if (failure === 'exception') {
        generate.mockRejectedValueOnce(new Error('Provider unavailable'))
      } else {
        generate.mockResolvedValueOnce(answer)
      }

      await expect(session.compact({ client: cognitive, keepRecentIterations: 0, maxTokens: 50 })).rejects.toThrow()
      expect(session.toJSON()).toEqual(before)
    }
  )

  it('cancels a non-cooperative summarizer promptly and releases the session without committing late output', async () => {
    const session = new Session()
    turn(session, 'first')
    const before = session.toJSON()
    const { client: cognitive, generate } = client()
    let finish!: (value: ReturnType<typeof response>) => void
    generate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const controller = new AbortController()
    const compacting = session.compact({ client: cognitive, keepRecentIterations: 0, signal: controller.signal })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledOnce())
    expect(() => session.acquire()).toThrow('already executing')
    controller.abort(new Error('Cancelled'))
    await expect(compacting).rejects.toThrow('Cancelled')
    finish(response('Late summary'))
    expect(session.toJSON()).toEqual(before)
  })

  it('queues incoming events during summarization without including or losing them', async () => {
    const session = new Session()
    turn(session, 'first')
    const { client: cognitive, generate } = client()
    generate.mockImplementationOnce(async () => {
      session.append({ role: 'event', name: 'button.clicked', payload: { button: 'continue' } })
      return response('Payment completed.')
    })
    await session.compact({ client: cognitive, keepRecentIterations: 0 })
    expect(session.transcript).toEqual([
      { role: 'summary', content: 'Payment completed.' },
      { role: 'event', name: 'button.clicked', payload: { button: 'continue' } },
    ])
    expect(session.pendingMessages).toHaveLength(1)
  })

  it('rejects stale plans and non-prefix selection without pruning history', async () => {
    const session = new Session()
    turn(session, 'first')
    turn(session, 'second')
    const { client: cognitive } = client()
    await expect(session.prepareCompaction(['first'], { client: cognitive })).rejects.toThrow('prefix')
    const plan = await session.prepareCompaction(['second'], { client: cognitive })
    turn(session, 'third')
    expect(() => plan?.commit()).toThrow('history changed')
    expect(session.retainedIterationIds).toEqual(['first', 'second', 'third'])
  })

  it('does not let preview consumers mutate the summary that will be committed', async () => {
    const session = new Session()
    turn(session, 'first')
    const { client: cognitive } = client()
    const plan = (await session.prepareCompaction([], { client: cognitive }))!
    expect(() => {
      plan.summary.content = 'Changed'
    }).toThrow()
    expect(session.retainedIterationIds).toEqual(['first'])
    plan.commit()
    expect(() => plan.commit()).toThrow('history changed')
    expect(session.transcript[0]).toEqual(plan.summary)
  })

  it('refuses unresolved native calls and does not call the summarizer', async () => {
    const session = new Session()
    const info = session.nextIteration('pending')
    session.appendAssistant(info.id, { output: '', toolCalls: [{ id: 'call', name: 'run_javascript', input: {} }] })
    const { client: cognitive, generate } = client()
    await expect(session.compact({ client: cognitive, keepRecentIterations: 0 })).rejects.toThrow('pending')
    await expect(session.summarize({ client: cognitive })).rejects.toThrow('pending')
    expect(generate).not.toHaveBeenCalled()
    expect(session.pendingCalls).toHaveLength(1)
  })

  it('supports a custom summarizer and persists serializable configuration', async () => {
    const summarize = vi.fn(async () => 'Custom summary')
    const session = new Session({
      compaction: {
        triggerRatio: 0.7,
        targetRatio: 0.4,
        keepRecentIterations: 0,
        maxSummaryTokens: 80,
        model: 'fast',
        summarize,
      },
    })
    turn(session, 'first')
    const { client: cognitive, generate } = client()
    await session.compact({ client: cognitive })
    expect(summarize).toHaveBeenCalledOnce()
    expect(generate).not.toHaveBeenCalled()
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    expect(restored.compaction).toMatchObject({
      triggerRatio: 0.7,
      targetRatio: 0.4,
      keepRecentIterations: 0,
      maxSummaryTokens: 80,
      model: 'fast',
    })
    expect(restored.compaction && restored.compaction.summarize).toBeUndefined()
    expect(Session.fromJSON(session.toJSON(), { compaction: false }).compaction).toBe(false)
  })

  it('validates custom output with the same limits and protects canonical input from custom mutation', async () => {
    const session = new Session({
      compaction: {
        summarize: async ({ messages }) => {
          messages[0]!.content = 'Changed'
          return 'too big '.repeat(200)
        },
      },
    })
    turn(session, 'first')
    const before = session.toJSON()
    await expect(session.compact({ client: client().client, keepRecentIterations: 0, maxTokens: 10 })).rejects.toThrow(
      'token budget'
    )
    expect(session.toJSON()).toEqual(before)
  })

  it.each([
    { triggerRatio: 0 },
    { triggerRatio: 1.1 },
    { targetRatio: 0.9 },
    { targetRatio: NaN },
    { keepRecentIterations: -1 },
    { keepRecentIterations: 0.5 },
    { maxSummaryTokens: 0 },
    { maxSummaryTokens: Infinity },
    { model: [] },
  ])('rejects invalid controls %j', (options) => {
    expect(() => resolveCompaction(options)).toThrow()
  })

  it('does no model work for an empty session', async () => {
    const session = new Session()
    const { client: cognitive, generate } = client()
    expect(await session.summarize({ client: cognitive })).toBeUndefined()
    expect(await session.compact({ client: cognitive })).toBeUndefined()
    expect(generate).not.toHaveBeenCalled()
  })

  it('preserves the original conversation when a later summary segment fails', async () => {
    const session = new Session()
    turn(session, 'large', 'Long evidence. '.repeat(1000))
    const before = session.toJSON()
    const { client: cognitive, generate } = client()
    generate
      .mockResolvedValueOnce(response('First segment summary'))
      .mockRejectedValueOnce(new Error('Second segment failed'))
    await expect(
      session.compact({ client: cognitive, keepRecentIterations: 0, maxTokens: 64, contextWindow: 600 })
    ).rejects.toThrow('Second segment failed')
    expect(generate).toHaveBeenCalledTimes(2)
    expect(session.toJSON()).toEqual(before)
  })

  it('can compact again after only a summary remains, and rejects tampered summary persistence', async () => {
    const session = new Session()
    turn(session, 'first')
    const { client: cognitive, generate } = client()
    await session.compact({ client: cognitive, keepRecentIterations: 0 })
    generate.mockResolvedValueOnce(response('Payment succeeded.'))
    await session.compact({ client: cognitive, keepRecentIterations: 0, maxTokens: 20 })
    expect(session.transcript).toEqual([{ role: 'summary', content: 'Payment succeeded.' }])
    const state = session.toJSON()
    state.groups[0]!.source = { role: 'summary', content: 'Payment failed.' }
    expect(() => Session.fromJSON(state)).toThrow('Transcript source')
  })

  it('summarizes failed iterations even when no assistant message was generated', async () => {
    const session = new Session()
    const info = session.nextIteration('failed')
    session.settleIteration(info.id, { outcome: 'generation_error', error: 'Provider unavailable' })
    session.completeTurn()
    const { client: cognitive, generate } = client()
    await session.compact({ client: cognitive, keepRecentIterations: 0 })
    expect(JSON.stringify(generate.mock.calls)).toContain('Provider unavailable')
    expect(session.transcript[0]?.role).toBe('summary')
  })
})
