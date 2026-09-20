import { describe, expect, it } from 'vitest'
import { createInspector } from './inspection.js'
import { renderMemory } from './memory-render.js'

describe('memory inventory', () => {
  it('shows references for automatic results without repeating their payloads', () => {
    const output = renderMemory({
      bindings: [],
      properties: [],
      turn: 1,
      now: 1000,
      latestResultId: 'result',
      iterations: [
        {
          id: 'result',
          number: 1,
          turn: 1,
          turnId: 'turn',
          timestamp: 1000,
          outcome: 'completed',
          hasResult: true,
          result: 'SENSITIVE FULL PAYLOAD',
        },
      ],
    })
    expect(output).toContain('`$return` = `$iterations[0].result`')
    expect(output).not.toContain('SENSITIVE FULL PAYLOAD')
  })

  it('bounds the entire inventory even when a custom preview is large', () => {
    const bindings = Array.from({ length: 20 }, (_, i) => ({
      name: `item${i}`,
      value: 'x'.repeat(1000),
      created: {},
      assigned: {},
    }))
    for (const maxChars of [100, 256, 1000]) {
      const output = renderMemory({
        bindings,
        properties: [],
        turn: 1,
        maxChars,
        inspector: createInspector(() => 'Oversized preview. '.repeat(1000)),
      })
      expect(output.length).toBeLessThanOrEqual(maxChars)
      expect(output).toContain('Memory')
    }

    expect(bindings[0]!.value).toHaveLength(1000)
  })

  it('distinguishes read-only and writable properties and shows schema guidance', () => {
    const output = renderMemory({
      bindings: [],
      turn: 2,
      now: 61000,
      properties: [
        {
          object: 'account',
          property: 'status',
          value: 'open',
          type: 'string',
          writable: false,
          schema: { type: 'string', enum: ['open', 'closed'] },
          provenance: { turn: 1, timestamp: 1000 },
        },
        {
          object: 'account',
          property: 'count',
          value: 1,
          type: 'number',
          writable: true,
          schema: { type: 'number', minimum: 0 },
          provenance: {},
        },
      ],
    })
    expect(output).toContain('read-only')
    expect(output).toContain('writable')
    expect(output).toContain('"open" | "closed"')
    expect(output).toContain('min 0')
    expect(output).toContain('1 minute ago (1 turn ago)')
  })
})
