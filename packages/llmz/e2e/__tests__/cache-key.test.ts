import type { CognitiveRequest } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { cacheKeyOf } from './cache-key.js'

const inventory = (rows: string[]) =>
  `run_javascript: succeeded\n\n<runtime-memory>\n## Memory\nAvailable in JavaScript. Previews are abbreviated; historical results are read-only.\n\n### Variables\n${rows.join('\n')}\n\n### Results\n- result\n</runtime-memory>\n\nExecution budget: response 2 of 3.`
const rows = ['- `a`: 1 — set just now (this turn).', '- `b`: 2 — set just now (this turn).']
const request = (content: string): CognitiveRequest => ({
  model: 'test:model',
  messages: [
    {
      role: 'assistant',
      content: '',
      toolCalls: [
        {
          id: 'call-1',
          type: 'function',
          function: { name: 'run_javascript', arguments: { code: 'return inspect(1)' } },
        },
      ],
    },
    { role: 'user', type: 'tool_result', toolResultCallId: 'call-1', content },
  ],
})

describe('runtime memory cache identity', () => {
  it('ignores inventory ordering without changing the provider request', () => {
    const first = request(inventory(rows))
    const second = request(inventory([...rows].reverse()))
    const before = structuredClone(second)
    expect(cacheKeyOf('stream', first)).toBe(cacheKeyOf('stream', second))
    expect(second).toEqual(before)
  })

  it.each(['name', 'value', 'age', 'missing'])('preserves variable %s differences', (change) => {
    const changed = [...rows]
    if (change === 'name') changed[0] = changed[0]!.replace('`a`', '`c`')
    if (change === 'value') changed[0] = changed[0]!.replace(': 1', ': 9')
    if (change === 'age') changed[0] = changed[0]!.replace('just now', '1 minute ago')
    if (change === 'missing') changed.pop()
    expect(cacheKeyOf('text', request(inventory(rows)))).not.toBe(cacheKeyOf('text', request(inventory(changed))))
  })

  it.each(['user', 'other tool', 'payload'])('keeps ordering significant in %s content', (kind) => {
    const first = request(inventory(rows))
    const second = request(inventory([...rows].reverse()))
    for (const input of [first, second]) {
      if (kind === 'user') {
        input.messages = [{ role: 'user', content: input.messages[1]!.content }]
      } else if (kind === 'other tool') {
        input.messages[0]!.toolCalls![0]!.function.name = 'search'
      } else {
        input.messages[1]!.content = String(input.messages[1]!.content).replace('<runtime-memory>', '<search-result>')
      }
    }
    expect(cacheKeyOf('text', first)).not.toBe(cacheKeyOf('text', second))
  })
})
