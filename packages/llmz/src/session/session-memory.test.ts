import { describe, expect, it } from 'vitest'

import { MemoryCapacityError } from './memory.js'
import { Session, type IterationCapture } from './session.js'

function capture(
  session: Session,
  input: Omit<IterationCapture, 'id'> & { id?: string; outcome?: string; error?: string } = {}
) {
  const iteration = session.nextIteration(input.id)
  const report = session.commitIteration({ ...iteration, ...input, id: iteration.id })
  session.settleIteration(iteration.id, { outcome: input.outcome ?? 'completed', error: input.error })

  return { report, id: iteration.id }
}

function nextTurn(session: Session) {
  session.completeTurn()
  session.beginTurn()
}

describe('Session result history', () => {
  it('retains exact results and gives JavaScript isolated, read-only history', () => {
    const session = new Session()
    capture(session, {
      hasResult: true,
      result: { account: { id: 1 }, text: 'x'.repeat(1000) },
      variables: { account: { id: 1 } },
    })
    const bindings = session.getBindings()

    expect(() => ((bindings.$return as any).account.id = 2)).toThrow()
    expect(() => (bindings.$iterations as any).push({})).toThrow()
    const account = bindings.account as { id: number }
    account.id = 4

    expect((session.getBindings().$return as any).account.id).toBe(1)
    expect((session.getBindings().$return as any).text).toHaveLength(1000)
    expect(session.memory.variables.account).toEqual({ id: 1 })
  })

  it('distinguishes missing results from undefined, and preserves the last result across errors', () => {
    const session = new Session()
    capture(session, { hasResult: true, result: 42 })
    capture(session, { outcome: 'execution_error', error: 'Failed' })

    expect(session.getBindings().$return).toBe(42)
    expect(session.iterations[0]).toMatchObject({ hasResult: false, outcome: 'execution_error', error: 'Failed' })

    capture(session, { hasResult: true, result: undefined })

    expect(session.getBindings().$return).toBeUndefined()
    expect(session.iterations[0]).toMatchObject({ hasResult: true, result: undefined })
    expect(session.renderMemory()).toContain('`$return` = `$iterations[0].result` (undefined)')
  })

  it('shows result references once and prunes automatic history without dropping named state', () => {
    const session = new Session()
    const first = capture(session, {
      timestamp: 1000,
      hasResult: true,
      result: { detail: 'earlier-result-only-payload' },
      variables: { account: { id: 7 } },
    })
    nextTurn(session)
    nextTurn(session)
    const second = capture(session, {
      timestamp: 61000,
      hasResult: true,
      result: ['latest-result-only-payload'],
    })
    capture(session, { timestamp: 62000, outcome: 'execution_error' })

    const overview = session.renderMemory({ now: 62000 })
    expect(overview).toContain('`$return` = `$iterations[1].result` (array)')
    expect(overview).toContain('`$iterations[2].result` (object) — returned 1 minute ago (2 turns ago).')
    expect(overview).not.toContain('earlier-result-only-payload')
    expect(overview).not.toContain('latest-result-only-payload')

    session.prune([first.id, second.id])
    expect(session.renderMemory()).toContain('`$return` = `$iterations[0].result` (array)')
    session.prune([first.id])

    expect(session.getBindings().$return).toBeUndefined()
    expect(session.iterations.map((entry) => entry.id)).toEqual([first.id])
    expect(session.memory.variables.account).toEqual({ id: 7 })
  })

  it('persists each execution record once with exact values and provenance', () => {
    const session = new Session()
    capture(session, {
      timestamp: 1000,
      hasResult: true,
      result: { optional: undefined, zero: -0 },
      variables: { account: { id: 1 }, unset: undefined },
    })
    nextTurn(session)
    nextTurn(session)
    const state = session.toJSON()
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(state)))

    expect(state.memory).not.toHaveProperty('iterations')
    expect(state.groups.filter((group) => group.iteration)).toHaveLength(1)
    expect(restored.memory.variables).toEqual({ account: { id: 1 }, unset: undefined })
    expect(restored.getBindings().$return).toHaveProperty('optional', undefined)
    expect(Object.is((restored.getBindings().$return as any).zero, -0)).toBe(true)
    expect(restored.renderMemory({ now: 61000 })).toContain('1 minute ago (2 turns ago)')
  })

  it('rejects missing encoded result payloads rather than restoring a false value', () => {
    const session = new Session()
    capture(session, { hasResult: true, result: undefined })
    const state = session.toJSON()
    delete state.groups.find((group) => group.iteration)!.iteration!.result

    expect(() => Session.fromJSON(state)).toThrow('Missing result payload')
  })

  it('captures partial writes and clears the latest result when its value cannot be retained', () => {
    const session = new Session({ maxBytes: 4000 })
    capture(session, { hasResult: true, result: 'before', variables: { account: 'old' } })
    const { report } = capture(session, {
      hasResult: true,
      result: new Date(),
      variables: { prefix: 1, tooBig: 'x'.repeat(5000) },
      captureErrors: [{ name: 'account', reason: 'initialization failed' }],
    })

    expect(session.memory.variables).toEqual({ prefix: 1 })
    expect(session.getBindings().$return).toBeUndefined()
    expect(session.iterations[0]?.hasResult).toBe(false)
    expect(report.unavailable.map((item) => item.name)).toEqual(['account', 'tooBig', '$return'])
  })

  it('counts retained results toward the same capacity as named memory', () => {
    const session = new Session({ maxBytes: 4000 })
    capture(session, { hasResult: true, result: 'x'.repeat(2000) })
    const { report } = capture(session, { variables: { tooBig: 'x'.repeat(2000), fits: 1 } })

    expect(report.unavailable.map((item) => item.name)).toEqual(['tooBig'])
    expect(session.memory.variables).toEqual({ fits: 1 })
    expect(session.getBindings().$return).toHaveLength(2000)
  })

  it('reserves failure metadata before execution and can discard an untouched attempt', () => {
    const session = new Session({ maxBytes: 1000 })
    const iteration = session.nextIteration()

    expect(() => session.assertCapacityForIteration(iteration)).toThrow(MemoryCapacityError)
    expect(session.iterations).toEqual([])
    session.cancelIteration(iteration.id)
    expect(session.toJSON().groups).toEqual([])
  })

  it('bounds metadata-only histories without evicting retained state', () => {
    const session = new Session({ maxBytes: 1000 })
    let completed = 0

    for (let number = 1; number <= 100; number++) {
      const iteration = session.nextIteration()
      try {
        session.commitIteration(iteration)
        session.settleIteration(iteration.id)
        completed++
      } catch (error) {
        expect(error).toBeInstanceOf(MemoryCapacityError)
        session.cancelIteration(iteration.id)
        break
      }
    }

    expect(completed).toBeGreaterThan(0)
    expect(completed).toBeLessThan(100)
    expect(session.iterations).toHaveLength(completed)
    expect(() => session.memory.assertCapacity()).not.toThrow()
  })
})
