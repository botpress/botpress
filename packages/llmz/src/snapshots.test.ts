import { describe, expect, it } from 'vitest'
import { SnapshotSignal } from './errors.js'
import { Session } from './session.js'
import { Snapshot } from './snapshots.js'

function interrupted() {
  const session = new Session({ variables: { large: 'x'.repeat(6000), prior: { optional: undefined } } })
  session.beginTurn({ messages: [{ role: 'user', content: 'Run background work' }] })
  const iteration = session.nextIteration('interrupted')
  session.appendAssistant(iteration.id, {
    output: '',
    toolCalls: [
      { id: 'outer', name: 'run_javascript', input: { code: 'const account = await slow(); return account.id' } },
    ],
  })
  session.memory.commit({ ...iteration, outcome: 'interrupted' })
  const signal = new SnapshotSignal('Waiting')
  signal.toolCall = {
    name: 'slow',
    assignment: { type: 'single', left: 'account', evalFn: 'let account = arguments[0]; return { account };' },
  }
  const snapshot = Snapshot.fromSignal(signal)
  snapshot.attachSession(session, {
    iterationId: iteration.id,
    callId: 'outer',
    code: 'const account = await slow(); return account.id',
  })

  return { snapshot, session }
}

describe('native snapshots', () => {
  it('retains exact memory and pending native call across a real JSON roundtrip', () => {
    const { snapshot } = interrupted()
    const restored = Snapshot.fromJSON(JSON.parse(JSON.stringify(snapshot)))
    const session = Session.fromJSON(restored.session!)

    expect(session.memory.variables.large).toHaveLength(6000)
    expect(session.memory.variables.prior).toHaveProperty('optional', undefined)
    expect(restored.pendingCall).toMatchObject({ iterationId: 'interrupted', callId: 'outer' })
    expect(session.pendingCalls).toEqual([{ iterationId: 'interrupted', callId: 'outer' }])
    expect(restored.status.type).toBe('pending')
  })

  it('resolves the interrupted assignment without inventing a program return or next iteration', () => {
    const { snapshot } = interrupted()
    snapshot.resolve({ id: 'acct_1', extra: undefined })
    const restored = Snapshot.fromJSON(JSON.parse(JSON.stringify(snapshot)))
    const session = Session.fromJSON(restored.session!)

    expect(session.memory.getBindings()).toMatchObject({
      account: { id: 'acct_1', extra: undefined },
      $return: undefined,
    })
    expect(session.memory.iterations).toHaveLength(1)
    expect(session.memory.iterations[0]).toMatchObject({ outcome: 'interrupted', hasResult: false })
    expect(restored.status).toEqual({ type: 'resolved', value: { id: 'acct_1', extra: undefined } })
    session.appendToolResult(
      restored.pendingCall!.iterationId,
      restored.pendingCall!.callId,
      'The inner operation resolved. Remaining JavaScript did not execute.'
    )
    session.settleIteration('interrupted')

    expect(session.requestMessages().at(-1)?.content).toContain('account')
    expect(session.nextIteration().number).toBe(2)
    expect(session.turn).toBe(1)
  })

  it('rejects without assigning the failed result and retains a readable Error through persistence', () => {
    const { snapshot } = interrupted()
    snapshot.reject(new Error('Service unavailable'))
    const restored = Snapshot.fromJSON(JSON.parse(JSON.stringify(snapshot)))

    expect(restored.status).toMatchObject({
      type: 'rejected',
      error: { name: 'Error', message: 'Service unavailable' },
    })
    expect(Session.fromJSON(restored.session!).memory.variables).not.toHaveProperty('account')
  })

  it('isolates cloned snapshots and refuses resetting committed native assignments', () => {
    const { snapshot } = interrupted()
    const other = snapshot.clone()
    other.resolve({ id: 'different' })

    expect(snapshot.status.type).toBe('pending')
    expect(Session.fromJSON(snapshot.session!).memory.variables).not.toHaveProperty('account')
    expect(() => other.reset()).toThrow('cannot be reset')
  })

  it('claims a snapshot instance once and rejects pending or repeated resumption', () => {
    const { snapshot } = interrupted()

    expect(() => snapshot.consumeResume()).toThrow('settled native snapshot')

    snapshot.resolve({ id: 'acct_1' })
    snapshot.consumeResume()

    expect(() => snapshot.consumeResume()).toThrow('already been resumed')
  })

  it('makes assignment failure explicit without marking the whole program successful', () => {
    const { snapshot } = interrupted()
    snapshot.toolCall!.assignment = {
      type: 'object',
      left: '{ account = requireFollowup() }',
      evalFn: 'let { account = requireFollowup() } = arguments[0]; return { account };',
    }
    snapshot.resolve({})

    expect(snapshot.status.type).toBe('resolved')
    expect(snapshot.assignmentError).toContain('JavaScript VM')
    expect(Session.fromJSON(snapshot.session!).memory.getBindings().$return).toBeUndefined()
  })

  it('restores nested, renamed, rest, and literal-default bindings without host evaluation', () => {
    const { snapshot } = interrupted()
    snapshot.toolCall!.assignment = {
      type: 'object',
      left: '{ id: accountId, values: [first, , ...remaining], missing = { active: true }, ...other }',
      evalFn: 'This field is never evaluated for native snapshots',
    }
    snapshot.resolve({ id: 'acct_1', values: [1, 2, 3, 4], email: 'person@example.com' })

    expect(snapshot.assignmentError).toBeUndefined()
    expect(Session.fromJSON(snapshot.session!).memory.variables).toMatchObject({
      accountId: 'acct_1',
      first: 1,
      remaining: [3, 4],
      missing: { active: true },
      other: { email: 'person@example.com' },
    })
  })

  it('never executes generated default expressions on the host during native resolution', () => {
    const { snapshot } = interrupted()
    const host = globalThis as typeof globalThis & { __llmzSnapshotExecuted?: boolean }
    snapshot.toolCall!.assignment = {
      type: 'object',
      left: '{ account = (globalThis.__llmzSnapshotExecuted = true) }',
      evalFn: 'let { account = (globalThis.__llmzSnapshotExecuted = true) } = arguments[0]; return { account };',
    }

    try {
      snapshot.resolve({})

      expect(host.__llmzSnapshotExecuted).toBeUndefined()
      expect(snapshot.assignmentError).toContain('JavaScript VM')
    } finally {
      delete host.__llmzSnapshotExecuted
    }
  })

  it('rejects unsupported settlement data before mutating lifecycle state', () => {
    const { snapshot } = interrupted()

    expect(() => snapshot.resolve(() => 42)).toThrow('Unsupported memory value')
    expect(snapshot.status.type).toBe('pending')
  })
})
