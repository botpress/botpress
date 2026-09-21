import { describe, expect, it } from 'vitest'
import { compactHistory, pendingCallIds, validateGroup, type HistoryGroup } from './history.js'

function iteration(id: string, turn: number): HistoryGroup {
  return {
    id,
    turn,
    iteration: { id, number: turn, turn, turnId: `turn-${turn}`, timestamp: 1, outcome: 'completed', hasResult: false },
    messages: [
      {
        role: 'assistant',
        content: null,
        type: 'tool_calls',
        toolCalls: [
          { id: `${id}-call`, type: 'function', function: { name: 'run_javascript', arguments: { code: 'return 1' } } },
        ],
      },
      { role: 'user', type: 'tool_result', toolResultCallId: `${id}-call`, content: '1' },
    ],
  }
}

const input = (turn: number): HistoryGroup => ({
  id: `input-${turn}`,
  turn,
  messages: [{ role: 'user', content: `Input ${turn}` }],
})

describe('history compaction', () => {
  it('keeps whole call/result batches and the inputs for retained turns', () => {
    const history = [input(1), iteration('a', 1), input(2), iteration('b', 2), input(3)]
    const original = structuredClone(history)
    const compacted = compactHistory(history, new Set(['b', 'pending']), 3, 'pending')
    expect(compacted.map((group) => group.id)).toEqual(['input-2', 'b', 'input-3'])
    expect(history).toEqual(original)
    expect(compacted[1]!.messages).toEqual(history[3]!.messages)
    expect(compactHistory(compacted, new Set(['b', 'pending']), 3, 'pending')).toEqual(compacted)
  })

  it('rejects attempts to drop the active iteration without mutating anything', () => {
    const history = [input(1), iteration('active', 1)]
    const original = structuredClone(history)
    expect(() => compactHistory(history, new Set(), 1, 'active')).toThrow(/pending iteration/)
    expect(history).toEqual(original)
  })

  it('keeps current input when no historical iterations remain', () => {
    expect(compactHistory([input(1), iteration('old', 1), input(2)], new Set(), 2)).toEqual([input(2)])
  })

  it('preserves pairing, ordering, and idempotence for every subset of retained turns', () => {
    const history = Array.from({ length: 5 }, (_, i) => [input(i + 1), iteration(`i${i}`, i + 1)]).flat()
    for (let mask = 0; mask < 32; mask++) {
      const retained = new Set(Array.from({ length: 5 }, (_, i) => `i${i}`).filter((_, i) => mask & (1 << i)))
      const result = compactHistory(history, retained, 6)
      expect(result.filter((group) => group.iteration).map((group) => group.id)).toEqual([...retained])
      expect(result.filter((group) => !group.iteration).map((group) => group.turn)).toEqual(
        result.filter((group) => group.iteration).map((group) => group.turn)
      )
      for (const group of result) {
        expect(() => validateGroup(group)).not.toThrow()
        expect(pendingCallIds(group)).toEqual([])
      }

      expect(compactHistory(result, retained, 6)).toEqual(result)
    }
  })
})

describe('native history integrity', () => {
  it('rejects incomplete and duplicate call/result batches', () => {
    const group = iteration('one', 1)
    const receipt = group.messages.pop()!
    expect(pendingCallIds(group)).toEqual(['one-call'])
    expect(() => validateGroup(group)).toThrow(/pending native calls/)
    group.messages.push(receipt, receipt)
    expect(() => validateGroup(group)).toThrow(/duplicate native tool result/)
  })

  it.each(['assistant', 'system'] as const)('rejects a tool result with role %s', (role) => {
    const group = iteration('one', 1)
    group.messages[1]!.role = role
    expect(() => validateGroup(group)).toThrow(/native tool result/)
  })

  it('rejects malformed native function calls', () => {
    const group = iteration('one', 1)
    group.messages[0]!.toolCalls![0]!.function.name = ''
    expect(() => validateGroup(group)).toThrow(/function name/)
  })
})
