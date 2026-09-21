import { describe, expect, it } from 'vitest'
import { getTokenizer } from '../utils.js'
import { Session, type SessionInput } from './session.js'
import type { Transcript } from './transcript.js'

function complete(session: Session, id: string, result?: unknown) {
  const iteration = session.nextIteration(id)
  session.appendAssistant(id, {
    output: '',
    toolCalls: [{ id: `${id}-call`, name: 'run_javascript', input: { code: 'return 42' } }],
  })
  session.commitIteration({ ...iteration, hasResult: true, result })
  session.appendToolResult(id, `${id}-call`, 'Execution completed.')
  session.settleIteration(id, { outcome: 'completed' })

  return iteration
}

describe('native Session', () => {
  it('claims queued messages once when starting a turn', () => {
    const session = new Session()

    expect(session.status).toBe('idle')
    session.append({ role: 'user', content: 'First' })
    session.append([
      { role: 'assistant', content: 'Imported answer' },
      { role: 'user', content: 'Second' },
    ])

    expect(session.status).toBe('pending')
    expect(session.hasActiveTurn).toBe(false)
    expect(session.messages).toEqual([])
    expect(session.pendingMessages.map((message) => message.content)).toEqual(['First', 'Imported answer', 'Second'])
    const queuedIds = session.toJSON().pendingInputs.map((input) => input.id)

    session.beginTurn()
    const turnId = session.turnId
    session.beginTurn()

    expect(session.status).toBe('active')
    expect(session.hasActiveTurn).toBe(true)
    expect(session.turn).toBe(1)
    expect(session.turnId).toBe(turnId)
    expect(session.pendingMessages).toEqual([])
    expect(session.messages.map((message) => message.content)).toEqual(['First', 'Imported answer', 'Second'])
    expect(session.toJSON().groups.map((group) => group.id)).toEqual(queuedIds)
  })

  it('keeps messages appended during execution pending until the active turn completes', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Current request' })
    const release = session.acquire()
    session.beginTurn()
    session.append({ role: 'user', content: 'Next request' })
    complete(session, 'first')
    session.beginTurn()

    expect(session.turn).toBe(1)
    expect(session.requestMessages({ memory: false }).some((message) => message.content === 'Next request')).toBe(false)
    expect(session.pendingMessages).toEqual([{ role: 'user', content: 'Next request' }])

    session.completeTurn()
    release()

    expect(session.status).toBe('pending')
    expect(session.hasActiveTurn).toBe(false)
    session.nextIteration('second')

    expect(session.turn).toBe(2)
    expect(session.pendingMessages).toEqual([])
    expect(session.messages.at(-1)?.content).toBe('Next request')
  })

  it('retains identical messages as separate inputs within and across turns', () => {
    const session = new Session()
    const message = { role: 'user' as const, content: 'Again' }
    session.append([message, message])
    session.beginTurn()
    session.completeTurn()
    session.append(message)
    session.beginTurn()

    expect(session.messages).toEqual([message, message, message])
    expect(session.turn).toBe(2)
    expect(new Set(session.toJSON().groups.map((group) => group.id)).size).toBe(3)
  })

  it('isolates queued messages from caller mutations and getter mutations', () => {
    const session = new Session()
    const message = {
      role: 'user' as const,
      type: 'multipart' as const,
      content: [{ type: 'image' as const, url: 'https://example.com/original.png' }],
      provider: { cache: { enabled: true } },
    }
    const original = structuredClone(message)
    session.append(message)
    message.content[0]!.url = 'https://example.com/changed.png'
    message.provider.cache.enabled = false
    const pending = session.pendingMessages
    pending[0]!.content = 'Changed getter copy'
    const saved = session.toJSON()
    saved.pendingInputs[0]!.message.content = 'Changed serialized copy'

    expect(session.pendingMessages).toEqual([original])
    session.beginTurn()

    expect(session.messages).toEqual([original])
  })

  it('validates the entire appended batch before changing the queue', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Already queued' })
    const before = session.toJSON()

    expect(() =>
      session.append([
        { role: 'user', content: 'Valid first item' },
        { role: 'system', content: 'Invalid second item' },
      ])
    ).toThrow('system messages')
    expect(session.toJSON()).toEqual(before)
  })

  it('rejects sparse batches and accessor properties before reading their values', () => {
    const session = new Session()
    const sparse = new Array<SessionInput>(2)
    sparse[1] = { role: 'user', content: 'Valid message' }
    let accessorRead = false
    const accessor = {
      role: 'user' as const,
      get content() {
        accessorRead = true

        return 'Should not read'
      },
    }

    expect(() => session.append(sparse)).toThrow('dense JSON arrays')
    expect(() => session.append(accessor)).toThrow('plain JSON data properties')
    expect(accessorRead).toBe(false)
    expect(session.pendingMessages).toEqual([])
  })

  it.each([
    null,
    { role: 'invalid', content: 'Hello' },
    { role: 'user' },
    { role: 'user', content: 42 },
    { role: 'user', content: [{ type: 'image' }] },
    { role: 'event', payload: {} },
    { role: 'summary' },
    { role: 'user', content: 'Hello', modality: 'video' },
    { role: 'user', content: 'Hello', attachments: [{ type: 'image' }] },
    { role: 'user', content: 'Hello', metadata: new Map() },
    { role: 'assistant', type: 'tool_calls', content: null, toolCalls: [] },
    { role: 'user', type: 'tool_result', content: 'Result', toolResultCallId: 'call' },
    { role: 'user', content: 'Hello', attachments: [], toolResultCallId: 'call' },
  ])('rejects invalid input without changing processing state: %j', (message) => {
    const session = new Session()
    const before = session.toJSON()

    expect(() => session.append(message as SessionInput)).toThrow()
    expect(session.toJSON()).toEqual(before)
  })

  it('preserves voice transcripts, attachments, and summaries', () => {
    const session = new Session()
    session.append([
      { role: 'user', content: 'Spoken words', modality: 'voice' },
      {
        role: 'user',
        content: 'Recorded words',
        attachments: [{ type: 'audio', url: 'data:audio/wav;base64,AA==' }],
      },
      { role: 'summary', content: 'Previously discussed billing.' },
    ])
    session.beginTurn()

    expect(session.messages).toEqual([
      { role: 'user', content: 'Voice message (transcript):\nSpoken words' },
      {
        role: 'user',
        type: 'multipart',
        content: [
          { type: 'text', text: 'Voice message (transcript):\nRecorded words' },
          { type: 'audio', url: 'data:audio/wav;base64,AA==' },
        ],
      },
      { role: 'user', content: 'Conversation summary:\nPreviously discussed billing.' },
    ])
  })

  it('persists an active turn and queued input without replaying either batch', () => {
    const session = new Session({ variables: { account: 'customer-42' } })
    session.append({ role: 'user', content: 'Active request' })
    complete(session, 'first', 'Observed result')
    session.append({ role: 'user', content: 'Queued request' })
    const state = session.toJSON()
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(state)))
    restored.beginTurn()

    expect(restored.toJSON()).toEqual(state)
    expect(restored.hasActiveTurn).toBe(true)
    expect(restored.memory.variables.account).toBe('customer-42')
    expect(restored.pendingMessages).toEqual([{ role: 'user', content: 'Queued request' }])

    restored.completeTurn()
    restored.beginTurn()

    expect(restored.turn).toBe(2)
    expect(restored.messages.filter((message) => message.content === 'Active request')).toHaveLength(1)
    expect(restored.messages.filter((message) => message.content === 'Queued request')).toHaveLength(1)
    expect(restored.toJSON().groups.at(-1)?.id).toBe(state.pendingInputs[0]?.id)
  })

  it('persists input queued before the first execution', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Not yet processed' })
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))

    expect(restored.status).toBe('pending')
    expect(restored.turn).toBe(0)
    expect(restored.messages).toEqual([])
    restored.beginTurn()

    expect(restored.turn).toBe(1)
    expect(restored.messages).toEqual([{ role: 'user', content: 'Not yet processed' }])
  })

  it('restores a completed turn without treating it as active input', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Finished request' })
    complete(session, 'first')
    session.completeTurn()
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))

    expect(restored.status).toBe('idle')
    expect(restored.hasActiveTurn).toBe(false)
    expect(restored.turn).toBe(1)
    restored.nextIteration('second')

    expect(restored.turn).toBe(2)
    expect(restored.messages.filter((message) => message.content === 'Finished request')).toHaveLength(1)
  })

  it('keeps newly appended input separate from an in-flight tool call', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Active request' })
    const iteration = session.nextIteration('running')
    session.appendAssistant(iteration.id, {
      output: '',
      toolCalls: [{ id: 'pending', name: 'run_javascript', input: { code: 'return inspect(await work())' } }],
    })
    session.append({ role: 'user', content: 'Queued request' })

    expect(() => session.beginTurn()).toThrow('native calls are pending')
    expect(() => session.completeTurn()).toThrow('pending iterations')
    expect(() => session.nextIteration()).toThrow('iteration is pending')
    expect(() => session.requestMessages()).toThrow('all native calls')
    expect(() => session.toJSON()).toThrow('in-flight execution')

    session.appendToolResult('running', 'pending', 'Completed')
    session.settleIteration('running')
    session.beginTurn()

    expect(session.turn).toBe(1)
    expect(session.pendingMessages).toHaveLength(1)
    expect(session.messages).toHaveLength(3)
  })

  it('keeps runtime feedback after the response it describes before and after settlement', () => {
    const session = new Session()
    const iteration = session.nextIteration()
    session.appendAssistant(iteration.id, { output: 'An incomplete answer' })
    session.appendContext('Continue using the retained state.')
    const messages = session.messages

    expect(messages.map((message) => message.role)).toEqual(['assistant', 'user'])
    expect(messages[1]?.content).toContain('Continue using the retained state.')
    session.settleIteration(iteration.id, { outcome: 'thinking_requested' })

    expect(session.messages).toEqual(messages)
    expect(Session.fromJSON(session.toJSON()).messages).toEqual(messages)
  })

  it('rejects serialization while an iteration has not received its assistant response', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Active request' })
    session.nextIteration('generating')

    expect(() => session.toJSON()).toThrow('in-flight execution')
    expect(() => JSON.stringify(session)).toThrow('in-flight execution')
  })

  it('persists a settled failure and continues the same input batch on the next execution', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Request to retry' })
    session.nextIteration('failed')
    session.settleIteration('failed')
    session.append({ role: 'user', content: 'Next request' })
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    const next = restored.nextIteration('retry')

    expect(next.turn).toBe(1)
    expect(restored.hasActiveTurn).toBe(true)
    expect(restored.messages).toEqual([{ role: 'user', content: 'Request to retry' }])
    expect(restored.pendingMessages).toEqual([{ role: 'user', content: 'Next request' }])

    restored.appendAssistant('retry', { output: 'Completed' })
    restored.settleIteration('retry')
    restored.completeTurn()
    restored.beginTurn()

    expect(restored.turn).toBe(2)
    expect(restored.pendingMessages).toEqual([])
    expect(restored.messages.at(-1)?.content).toBe('Next request')
  })

  it('compacts processed history without removing queued inputs', () => {
    const session = new Session({ variables: { account: 'retained' } })
    session.append({ role: 'user', content: 'Old request' })
    complete(session, 'old', 'Old result')
    session.completeTurn()
    session.append({ role: 'user', content: 'Current request' })
    complete(session, 'current', 'Current result')
    session.append({ role: 'user', content: 'Queued request' })
    const pending = session.toJSON().pendingInputs
    session.prune(['current'])

    expect(session.messages.some((message) => message.content === 'Old request')).toBe(false)
    expect(session.memory.variables.account).toBe('retained')
    expect(session.iterations.map((entry) => entry.id)).toEqual(['current'])
    expect(session.toJSON().pendingInputs).toEqual(pending)
    expect(Session.fromJSON(session.toJSON()).toJSON()).toEqual(session.toJSON())
  })

  it('previews compaction without changing messages, exact results, or queued input', () => {
    const session = new Session({ variables: { account: 'retained' } })
    session.append({ role: 'user', content: 'Old request' })
    complete(session, 'old', 'Old result')
    session.completeTurn()
    session.append({ role: 'user', content: 'Current request' })
    complete(session, 'current', 'Current result')
    session.append({ role: 'user', content: 'Queued request' })
    const before = session.toJSON()
    const preview = session.requestMessages({ retainedIterationIds: ['current'], now: 1000 })
    expect(JSON.stringify(preview)).not.toContain('old-call')
    expect(JSON.stringify(preview)).not.toContain('$iterations[1]')
    expect(session.toJSON()).toEqual(before)
    session.prune(['current'])
    expect(session.requestMessages({ now: 1000 })).toEqual(preview)
    expect(session.getBindings().$return).toBe('Current result')
    expect(session.memory.variables.account).toBe('retained')
    expect(session.pendingMessages[0]!.content).toBe('Queued request')
  })

  it('retains matched native batches and renders only one ephemeral memory footer', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Find my account' })
    session.beginTurn()
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
    session.append({
      role: 'user',
      content: 'What is this?',
      attachments: [{ type: 'image', url: 'https://example.com/picture.png', id: 'picture-1' }],
    })
    session.beginTurn()
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

  it('bounds event payload previews without truncating user content or mutating input', () => {
    const session = new Session()
    const userContent = 'User-provided details. '.repeat(6000)
    const transcript: Transcript.Message[] = [
      {
        role: 'event',
        name: 'records.received',
        payload: {
          records: Array.from({ length: 500 }, (_, index) => ({
            id: index,
            details: { description: `Record ${index}: ${'extensive details '.repeat(100)}` },
          })),
        },
        attachments: [{ type: 'image', url: 'https://example.com/records.png', id: 'records-image' }],
      },
      { role: 'user', content: userContent },
    ]
    const original = structuredClone(transcript)

    session.append(transcript)
    session.beginTurn()

    const [event, user] = session.messages
    const parts = event?.content
    const eventText = Array.isArray(parts) ? parts[0] : undefined

    expect(event?.role).toBe('user')
    expect(event?.type).toBe('multipart')
    expect(Array.isArray(parts)).toBe(true)

    if (!Array.isArray(parts) || eventText?.type !== 'text' || typeof eventText.text !== 'string') {
      throw new Error('Expected event text followed by its image attachment')
    }

    const prefix = 'External event "records.received":\n'
    const preview = eventText.text.slice(prefix.length)

    expect(eventText.text).toMatch(/^External event "records\.received":\n/)
    expect(getTokenizer().count(preview)).toBeLessThanOrEqual(5000)
    expect(preview).toContain('[truncated]')
    expect(parts.slice(1)).toEqual([
      { type: 'text', text: 'Attachment "records-image"' },
      { type: 'image', url: 'https://example.com/records.png' },
    ])
    expect(user?.content).toBe(userContent)
    expect(transcript).toEqual(original)
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

  it('compacts complete groups and automatic memory while preserving named state and counters', () => {
    const session = new Session({ variables: { account: { id: 7 } } })
    session.append({ role: 'user', content: 'First request' })
    session.beginTurn()
    complete(session, 'first', 'first result')
    session.completeTurn()
    session.append({ role: 'user', content: 'Second request' })
    session.beginTurn()
    complete(session, 'second', 'second result')
    session.prune(['second'])

    expect(session.retainedIterationIds).toEqual(['second'])
    expect(session.messages.map((message) => message.content)).not.toContain('First request')
    expect(session.getBindings()).toMatchObject({ account: { id: 7 }, $return: 'second result' })
    expect(session.iterations.map((iteration) => iteration.id)).toEqual(['second'])
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
    const messages = session.messages
    const memory = session.memory.serialize()
    const pendingCalls = session.pendingCalls

    expect(() => session.prune([])).toThrow('pending')
    expect(session.messages).toEqual(messages)
    expect(session.memory.serialize()).toEqual(memory)
    expect(session.pendingCalls).toEqual(pendingCalls)
  })

  it('roundtrips exact undefined data and persistent counters through JSON', () => {
    const session = new Session({ variables: { account: { optional: undefined } } })
    complete(session, 'completed', undefined)
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))

    expect(restored.memory.variables.account).toHaveProperty('optional', undefined)
    expect(restored.iterations[0]).toMatchObject({ hasResult: true, result: undefined })
    expect(restored.nextIteration().number).toBe(2)
    expect(restored.turn).toBe(1)
  })

  it('locks sessions for one execution and restores an unlocked session', () => {
    const session = new Session()
    const release = session.acquire()

    expect(() => session.acquire()).toThrow('already executing')
    expect(() => session.toJSON()).toThrow('in-flight execution')
    release()
    const restored = Session.fromJSON(session.toJSON())
    restored.acquire()()
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

  it('rejects a persisted execution record whose identity disagrees with its group', () => {
    const session = new Session()
    complete(session, 'first', { secret: 'retained only with its history' })
    const state = session.toJSON()
    state.groups.find((group) => group.iteration)!.iteration!.id = 'missing'

    expect(() => Session.fromJSON(state)).toThrow('session counters')
  })

  it('rejects persisted counters that would reuse an earlier iteration number', () => {
    const session = new Session()
    complete(session, 'first')
    const state = session.toJSON()
    state.iteration = 0

    expect(() => Session.fromJSON(state)).toThrow('session counters')
  })

  it('rejects queued inputs whose identities overlap retained input', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Active request' })
    session.beginTurn()
    session.append({ role: 'user', content: 'Queued request' })
    const state = session.toJSON()
    state.pendingInputs[0]!.id = state.groups[0]!.id

    expect(() => Session.fromJSON(state)).toThrow('duplicate queued input identity')
  })

  it.each([true, false])('rejects restored records without an outcome even with activeTurn=%s', (activeTurn) => {
    const session = new Session()
    const iteration = session.nextIteration()
    session.settleIteration(iteration.id)
    const state = session.toJSON()
    state.activeTurn = activeTurn
    state.groups[0]!.iteration!.outcome = undefined as any

    expect(() => Session.fromJSON(state)).toThrow('Invalid persisted iteration outcome')
  })

  it('rejects old session persistence formats', () => {
    const state = new Session().toJSON()

    expect(() => Session.fromJSON({ ...state, version: 1 } as unknown as Session.JSON)).toThrow(
      'Unsupported LLMz session version: 1'
    )
  })
})
