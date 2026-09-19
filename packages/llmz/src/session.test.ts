import { describe, expect, it } from 'vitest'
import { Session } from './session.js'

function complete(session: Session, id: string, result?: unknown) {
  const iteration = session.nextIteration(id)
  session.appendAssistant(id, {
    output: '',
    toolCalls: [{ id: `${id}-call`, name: 'run_javascript', input: { code: 'return 42' } }],
  })
  session.memory.commit({ ...iteration, outcome: 'completed', hasResult: true, result })
  session.appendToolResult(id, `${id}-call`, 'Execution completed.')
  session.settleIteration(id)

  return iteration
}

describe('native Session', () => {
  it('retains matched native batches and renders only one ephemeral memory footer', () => {
    const session = new Session()
    session.beginTurn({ messages: [{ role: 'user', content: 'Find my account' }] })
    complete(session, 'first', { plan: 'Pro' })
    const request = session.requestMessages()

    expect(request.map((message) => message.type)).toEqual([undefined, 'tool_calls', 'tool_result'])
    expect(request.at(-1)?.content).toContain('## Memory')
    expect(request.at(-1)?.toolResultCallId).toBe('first-call')
    expect(session.messages.at(-1)?.content).toBe('Execution completed.')
    expect(session.requestMessages()).toEqual(request)
    request[0]!.content = 'changed request copy'

    expect(session.messages[0]!.content).toBe('Find my account')
  })

  it('preserves multipart attachments while appending runtime context', () => {
    const session = new Session()
    session.beginTurn({
      transcript: [
        {
          role: 'user',
          content: 'What is this?',
          attachments: [{ type: 'image', url: 'https://example.com/picture.png', id: 'picture-1' }],
        },
      ],
    })
    const canonical = session.messages
    const request = session.requestMessages()

    expect(request[0]?.content).toEqual([
      { type: 'text', text: 'What is this?' },
      { type: 'text', text: 'Attachment "picture-1"' },
      { type: 'image', url: 'https://example.com/picture.png' },
      { type: 'text', text: expect.stringContaining('## Memory') },
    ])
    expect(session.messages).toEqual(canonical)
  })

  it('supports multiple calls and refuses missing, duplicate, or unknown results', () => {
    const session = new Session()
    session.beginTurn()
    const iteration = session.nextIteration()
    session.appendAssistant(iteration.id, {
      output: 'Pick a plan.',
      toolCalls: [
        { id: 'buttons', name: 'show_buttons', input: {} },
        { id: 'finish', name: 'listen', input: {} },
      ],
    })

    expect(() => session.requestMessages()).toThrow('all native calls')
    expect(() => session.beginTurn()).toThrow('pending')
    session.appendToolResult(iteration.id, 'buttons', 'delivered')

    expect(() => session.settleIteration(iteration.id)).toThrow('finish')
    expect(() => session.appendToolResult(iteration.id, 'buttons', 'duplicate')).toThrow('already')
    expect(() => session.appendToolResult(iteration.id, 'unknown', 'unknown')).toThrow('unknown')
    session.appendToolResult(iteration.id, 'finish', 'accepted')
    session.settleIteration(iteration.id)

    expect(session.pendingCalls).toEqual([])
  })

  it('preserves provider continuation fields exactly and never edits signed assistant content', () => {
    const session = new Session()
    const iteration = session.nextIteration()
    const assistant = {
      role: 'assistant' as const,
      content: null,
      type: 'tool_calls' as const,
      toolCalls: [
        {
          id: 'call',
          type: 'function' as const,
          function: { name: 'run_javascript', arguments: { code: 'return 1' } },
        },
      ],
      provider: { thinking: [{ text: 'private reasoning', signature: 'opaque-signature' }] },
    }
    session.appendAssistant(iteration.id, {
      output: '',
      assistantMessage: assistant,
      toolCalls: [{ id: 'call', name: 'run_javascript', input: { code: 'return 1' } }],
    })
    session.appendToolResult(iteration.id, 'call', '1')
    session.settleIteration(iteration.id)
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session.toJSON())))

    expect(restored.requestMessages()[0]).toEqual(assistant)
  })

  it('rejects continuation state that JSON persistence would silently discard', () => {
    const session = new Session()
    const iteration = session.nextIteration()

    expect(() =>
      session.appendAssistant(iteration.id, {
        output: '',
        toolCalls: [{ id: 'pending', name: 'run_javascript', input: { code: 'return 1' } }],
        continuation: new Map([['signature', 'would disappear in JSON']]),
      })
    ).toThrow('JSON data')
    expect(session.messages).toEqual([])
    expect(session.pendingCalls).toEqual([])
  })

  it('acknowledges host-recorded assistant output without duplicating it', () => {
    const session = new Session()
    const user = { role: 'user' as const, content: 'Hello' }
    session.beginTurn({ transcript: [user] })
    const iteration = session.nextIteration()
    session.appendAssistant(iteration.id, { output: 'Hi!' })
    session.settleIteration(iteration.id)
    const transcript = [
      user,
      { role: 'assistant' as const, content: 'Hi!' },
      { role: 'user' as const, content: 'Hello again' },
    ]
    session.beginTurn({ transcript })
    session.reconcileTranscript(transcript)

    expect(session.messages.map((message) => message.content)).toEqual(['Hello', 'Hi!', 'Hello again'])
    session.reconcileTranscript(transcript.slice(1))

    expect(session.messages).toHaveLength(3)
  })

  it('retains repeated user input when it is an explicit new message', () => {
    const session = new Session()
    session.beginTurn({ messages: [{ role: 'user', content: 'Again' }] })
    session.beginTurn({ messages: [{ role: 'user', content: 'Again' }] })

    expect(session.messages).toHaveLength(2)
    expect(session.turn).toBe(2)
  })

  it('compacts complete groups and automatic memory while preserving named state and counters', () => {
    const session = new Session({ variables: { account: { id: 7 } } })
    session.beginTurn({ messages: [{ role: 'user', content: 'First request' }] })
    complete(session, 'first', 'first result')
    session.beginTurn({ messages: [{ role: 'user', content: 'Second request' }] })
    complete(session, 'second', 'second result')
    session.compact(['second'])

    expect(session.retainedIterationIds).toEqual(['second'])
    expect(session.messages.map((message) => message.content)).not.toContain('First request')
    expect(session.memory.getBindings()).toMatchObject({ account: { id: 7 }, $return: 'second result' })
    expect(session.memory.iterations.map((iteration) => iteration.id)).toEqual(['second'])
    const next = session.nextIteration('third')

    expect(next).toMatchObject({ number: 3, turn: 2 })
  })

  it('refuses to compact a pending group without changing memory or history', () => {
    const session = new Session()
    const iteration = session.nextIteration()
    session.appendAssistant(iteration.id, {
      output: '',
      toolCalls: [{ id: 'wait', name: 'run_javascript', input: { code: 'await wait()' } }],
    })
    const before = session.toJSON()

    expect(() => session.compact([])).toThrow('pending')
    expect(session.toJSON()).toEqual(before)
  })

  it('roundtrips exact undefined data and persistent counters through JSON', () => {
    const session = new Session({ variables: { account: { optional: undefined } } })
    complete(session, 'completed', undefined)
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))

    expect(restored.memory.variables.account).toHaveProperty('optional', undefined)
    expect(restored.memory.iterations[0]).toMatchObject({ hasResult: true, result: undefined })
    expect(restored.nextIteration().number).toBe(2)
    expect(restored.turn).toBe(1)
  })

  it('locks sessions for one execution and restores an unlocked session', () => {
    const session = new Session()
    const release = session.acquire()

    expect(() => session.acquire()).toThrow('already executing')
    const restored = Session.fromJSON(session.toJSON())
    restored.acquire()()
    release()
    const releaseAgain = session.acquire()
    release()

    expect(() => session.acquire()).toThrow('already executing')
    releaseAgain()
  })

  it('rejects malformed persisted history before allowing use', () => {
    const session = new Session()
    complete(session, 'first')
    const state = session.toJSON()
    state.groups.find((group) => group.iteration)?.messages.pop()

    expect(() => Session.fromJSON(state)).toThrow('pending native calls')
  })

  it('rejects persisted memory whose source iteration is missing', () => {
    const session = new Session()
    complete(session, 'first', { secret: 'retained only with its history' })
    const state = session.toJSON()
    state.groups = state.groups.filter((group) => !group.iteration)

    expect(() => Session.fromJSON(state)).toThrow('absent from retained history')
  })

  it('rejects persisted counters that would reuse an earlier iteration number', () => {
    const session = new Session()
    complete(session, 'first')
    const state = session.toJSON()
    state.iteration = 0

    expect(() => Session.fromJSON(state)).toThrow('session counters')
  })

  it('rejects transcript replacement atomically rather than replaying old messages', () => {
    const session = new Session()
    session.beginTurn({ transcript: [{ role: 'user', content: 'First' }] })
    const before = session.toJSON()

    expect(() => session.beginTurn({ transcript: [{ role: 'user', content: 'Unrelated replacement' }] })).toThrow(
      'overlapping'
    )
    expect(session.toJSON()).toEqual(before)
  })
})
