import { describe, expect, it } from 'vitest'
import { Session } from '../session.js'
import { resultBytes, restoreGroup, serializeGroup, validateRestoredHistory } from './serialization.js'

function state() {
  const session = new Session({ variables: { account: { id: 42 } } })
  session.append({ role: 'user', content: 'Read account' })
  const iteration = session.nextIteration('first')
  session.appendAssistant(iteration.id, {
    output: '',
    toolCalls: [
      {
        id: 'call',
        name: 'run_javascript',
        input: { code: 'return inspect(account)' },
      },
    ],
    continuation: { signature: 'opaque', tokens: [1, 2] },
  })
  session.commitIteration({
    ...iteration,
    hasResult: true,
    result: { unset: undefined, zero: -0, text: '🧠漢字' },
  })
  session.appendToolResult(iteration.id, 'call', 'Exact receipt')
  session.settleIteration(iteration.id)
  session.append({ role: 'user', content: 'Queued input' })
  return session.toJSON()
}

describe('session persistence', () => {
  it.each([null, false, 0, '', []])('rejects a malformed iteration record: %j', (iteration) => {
    const saved = state()
    Object.assign(saved.groups[0]!, { iteration })
    expect(() => Session.fromJSON(saved)).toThrow('Invalid persisted iteration record')
  })

  it('round-trips exact results, native messages, and queued input through JSON', () => {
    const original = state()
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(original)))
    const result = restored.iterations[0]!.result as {
      unset: undefined
      zero: number
      text: string
    }
    expect(result).toHaveProperty('unset', undefined)
    expect(Object.is(result.zero, -0)).toBe(true)
    expect(restored.pendingMessages[0]!.content).toBe('Queued input')
    expect(restored.messages[1]!.continuation).toEqual({
      signature: 'opaque',
      tokens: [1, 2],
    })
    expect(restored.toJSON()).toEqual(original)
  })

  it('isolates both directions of serialization from mutations', () => {
    const original = state()
    const group = original.groups[1]!
    const restored = restoreGroup(group)
    restored.messages[0]!.content = 'Changed'
    expect(group.messages[0]!.content).toBeNull()
    const encoded = serializeGroup(restored)
    encoded.messages[0]!.content = 'Changed again'
    expect(restored.messages[0]!.content).toBe('Changed')
  })

  it.each([
    [
      'session ID',
      (s: Session.JSON) => {
        s.id = ''
      },
    ],
    [
      'version',
      (s: Session.JSON) => {
        Object.assign(s, { version: 2 })
      },
    ],
    [
      'negative counter',
      (s: Session.JSON) => {
        s.turn = -1
      },
    ],
    [
      'fractional counter',
      (s: Session.JSON) => {
        s.iteration = 1.5
      },
    ],
    [
      'duplicate group',
      (s: Session.JSON) => {
        s.groups.push(s.groups[0]!)
      },
    ],
    [
      'duplicate queued identity',
      (s: Session.JSON) => {
        s.pendingInputs[0]!.id = s.groups[0]!.id
      },
    ],
    [
      'missing result',
      (s: Session.JSON) => {
        delete s.groups[1]!.iteration!.result
      },
    ],
    [
      'contradictory result',
      (s: Session.JSON) => {
        s.groups[1]!.iteration!.hasResult = false
      },
    ],
    [
      'pending outcome',
      (s: Session.JSON) => {
        s.groups[1]!.iteration!.outcome = 'pending'
      },
    ],
    [
      'invalid timestamp',
      (s: Session.JSON) => {
        s.groups[1]!.iteration!.timestamp = -1
      },
    ],
    [
      'wrong turn identity',
      (s: Session.JSON) => {
        s.groups[1]!.iteration!.turnId = 'different'
      },
    ],
    [
      'missing call receipt',
      (s: Session.JSON) => {
        s.groups[1]!.messages.pop()
      },
    ],
    [
      'wrong receipt role',
      (s: Session.JSON) => {
        s.groups[1]!.messages[1]!.role = 'assistant'
      },
    ],
    [
      'missing latest result',
      (s: Session.JSON) => {
        s.latestResultId = 'absent'
      },
    ],
  ] as const)('rejects %s before exposing a restored session', (_, mutate) => {
    const saved = state()
    mutate(saved)
    expect(() => validateRestoredHistory(saved)).toThrow()
    expect(() => Session.fromJSON(saved)).toThrow()
  })

  it('measures UTF-8 storage rather than character count', () => {
    const record = Session.fromJSON(state()).iterations[0]!
    const ascii = {
      ...record,
      hasResult: true,
      result: 'a',
      unavailable: undefined,
    } as const
    const unicode = {
      ...record,
      hasResult: true,
      result: '🧠',
      unavailable: undefined,
    } as const
    expect(resultBytes([unicode]) - resultBytes([ascii])).toBe(3)
  })
})
