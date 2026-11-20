// Offline regression tests for filter / sort / rate / group: a fake cognitive client returns crafted model outputs,
// so these never call the network and never touch the e2e cache.
import { describe, it, expect } from 'vitest'
import { Zai } from '../src'
import { parseRatingValue } from '../src/operations/rate'

type FakeRequest = {
  systemPrompt?: string
  messages: Array<{ role: string; content: string }>
}

const makeZai = (handler: (req: FakeRequest, n: number) => string | Promise<string>, maxTokens = 100_000) => {
  const calls: FakeRequest[] = []
  const mock: any = {
    $$IS_COGNITIVE_BETA: 'v2',
    clone() {
      return mock
    },
    on: () => () => {},
    generateText: async (req: FakeRequest, opts?: { signal?: AbortSignal }) => {
      opts?.signal?.throwIfAborted()
      // Snapshot the request: the context keeps appending to the same messages array across retries
      const snapshot = { ...req, messages: req.messages.map((m) => ({ ...m })) }
      calls.push(snapshot)
      const output = await handler(snapshot, calls.length - 1)
      return {
        output,
        metadata: {
          provider: 'fake',
          model: 'fake',
          usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
          cost: 0,
          cached: false,
          latency: 1,
        },
      }
    },
    getModelDetails: async () => ({ input: { maxTokens }, output: { maxTokens: 4096 } }),
  }
  return { zai: new Zai({ client: mock }), calls }
}

const lastUser = (req: FakeRequest) => String(req.messages[req.messages.length - 1]!.content)
const isRetry = (req: FakeRequest) => lastUser(req).startsWith('ERROR PARSING OUTPUT')

describe('filter robustness', () => {
  const items = ['apple', 'banana', 'car', 'potato']
  const fruit = [true, true, false, false]
  const answer = fruit.map((f, i) => `■${i}:${f}`).join('')

  it.each([
    ['plain', answer],
    ['code fences', '```\n' + answer + '\n```'],
    ['trailing prose', answer + '\nThose are my decisions.'],
    ['one per line with spaces', fruit.map((f, i) => `■ ${i} : ${f}`).join('\n')],
    ['yes/no', fruit.map((f, i) => `■${i}:${f ? 'yes' : 'no'}`).join('')],
    ['inline reason', fruit.map((f, i) => `■${i}: ${f} (reason ${i})`).join('\n')],
    ['upper case', answer.toUpperCase()],
  ])('parses %s', async (_name, output) => {
    const { zai, calls } = makeZai(() => output)
    expect(await zai.filter(items, 'is a fruit')).toEqual(['apple', 'banana'])
    expect(calls).toHaveLength(1)
  })

  it('retries with feedback when items are missing (e.g. truncated output)', async () => {
    const { zai, calls } = makeZai((req) => (isRetry(req) ? answer : '■0:true■1:true'))
    expect(await zai.filter(items, 'is a fruit')).toEqual(['apple', 'banana'])
    expect(calls).toHaveLength(2)
    expect(lastUser(calls[1]!)).toContain('■2')
  })

  it('retries when indices are 1-based (out of range)', async () => {
    const oneBased = fruit.map((f, i) => `■${i + 1}:${f}`).join('')
    const { zai, calls } = makeZai((req) => (isRetry(req) ? answer : oneBased))
    expect(await zai.filter(items, 'is a fruit')).toEqual(['apple', 'banana'])
    expect(calls).toHaveLength(2)
    expect(lastUser(calls[1]!)).toContain('start at 0')
  })

  it('fails after retries on garbage instead of returning []', async () => {
    const { zai, calls } = makeZai(() => 'I cannot do that')
    await expect(zai.filter(items, 'is a fruit')).rejects.toThrow(/missing decisions/)
    expect(calls.length).toBeGreaterThan(1)
  })

  it('uses the built-in examples when none are provided', async () => {
    const { zai, calls } = makeZai(() => answer)
    await zai.filter(items, 'is a fruit')
    const firstExample = String(calls[0]!.messages[0]!.content)
    expect(firstExample).toContain('■0 = apple')
    expect(firstExample).not.toContain('from ■0 to ■-1')
  })

  it('truncates each item to tokensPerItem in the prompt', async () => {
    const huge = 'word '.repeat(20_000)
    const { zai, calls } = makeZai(() => '■0:true■1:false')
    const res = await zai.filter([huge, 'short'], 'anything', { tokensPerItem: 10 })
    expect(res).toEqual([huge]) // the original element is returned, not the truncated text
    expect(lastUser(calls[0]!).length).toBeLessThan(1000)
  })

  it('stops sibling chunks after a chunk fails', async () => {
    const many = Array.from({ length: 30 * 50 }, (_, i) => `item ${i}`)
    let n = 0
    const { zai } = makeZai(async () => {
      n++
      await new Promise((r) => setTimeout(r, 5))
      throw new Error('persistent API failure')
    })
    await expect(zai.filter(many, 'anything')).rejects.toThrow()
    await new Promise((r) => setTimeout(r, 200))
    // 30 chunks × 4 attempts would be 120 calls without the abort
    expect(n).toBeLessThan(60)
  })
})

describe('sort robustness', () => {
  const criteria = (labels = 'cheap;medium;expensive', name = 'cost') => `■${name}■\n${labels}\n■END■`
  const isCriteria = (req: FakeRequest) => !!req.systemPrompt?.startsWith('You are creating sorting criteria')
  const isTieBreak = (req: FakeRequest) => !!req.systemPrompt?.startsWith('You are breaking a tie')

  it('does not drop every other item when the closing ■ is missing', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req)
        ? criteria('very_low;low;medium;high;very_high', 'price')
        : // A=very_high, B=high, C=low, D=very_low → D, C, B, A
          '■0:price=very_high\n■1:price=high\n■2:price=low\n■3:price=very_low'
    )
    expect(await zai.sort(['A', 'B', 'C', 'D'], 'cheapest first')).toEqual(['D', 'C', 'B', 'A'])
  })

  it('matches criterion names that contain spaces', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req)
        ? criteria('slow;medium;fast', 'top speed')
        : '■0:top speed=fast■\n■1:top speed=slow■\n■2:top speed=medium■'
    )
    expect(await zai.sort(['A', 'B', 'C'], 'slowest first')).toEqual(['B', 'C', 'A'])
  })

  it('counts a missing criterion as the middle value, not the best', async () => {
    const { zai } = makeZai((req) => {
      if (isCriteria(req)) return '■cost■\ncheap;medium;expensive\n■speed■\nfast;medium;slow\n■END■'
      if (isTieBreak(req)) return '■0■\n■1■\n■2■'
      // A: cost only, expensive (2) + missing speed (middle 1) = 3 → last
      return '■0:cost=expensive■\n■1:cost=cheap;speed=fast■\n■2:cost=medium;speed=medium■'
    })
    expect(await zai.sort(['A', 'B', 'C'], 'cheapest and fastest first')).toEqual(['B', 'C', 'A'])
  })

  it('retries when items are missing from the scores', async () => {
    const { zai, calls } = makeZai((req) => {
      if (isCriteria(req)) return criteria()
      return isRetry(req) ? '■0:cost=expensive■\n■1:cost=cheap■' : '■0:cost=expensive■'
    })
    expect(await zai.sort(['A', 'B'], 'cheapest first')).toEqual(['B', 'A'])
    expect(calls.filter(isRetry)).toHaveLength(1)
  })

  it('bounds the size of tie-break prompts', async () => {
    const items = Array.from({ length: 120 }, (_, i) => `item ${i}`)
    const tieBreakSizes: number[] = []
    const { zai } = makeZai((req) => {
      if (isCriteria(req)) return criteria()
      const n = Number(lastUser(req).match(/\(■0 to ■(\d+)\)/)?.[1] ?? -1) + 1
      if (isTieBreak(req)) {
        const count = (lastUser(req).match(/^■\d+:/gm) ?? []).length
        tieBreakSizes.push(count)
        return Array.from({ length: count }, (_, i) => `■${count - 1 - i}■`).join('\n')
      }
      return Array.from({ length: n }, (_, i) => `■${i}:cost=medium■`).join('\n')
    })
    const sorted = await zai.sort(items, 'cheapest first')
    expect(sorted).toHaveLength(120)
    expect(new Set(sorted).size).toBe(120)
    expect(Math.max(...tieBreakSizes)).toBeLessThanOrEqual(50)
  })
})

describe('rate robustness', () => {
  const isCriteria = (req: FakeRequest) => !!req.systemPrompt?.startsWith('You are creating evaluation criteria')
  const labels = { very_bad: 'a', bad: 'b', average: 'c', good: 'd', very_good: 'e' }

  it('keeps the user criterion keys even when the model renames them', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req)
        ? JSON.stringify({ bestPractices: labels, Docs: labels })
        : '■0:Best Practices=good;docs=very_good■\n■1:best_practices=bad;DOCS=average■'
    )
    const res = await zai.rate(['x', 'y'], { best_practices: 'follows best practices', docs: 'documented' })
    expect(res).toEqual([
      { best_practices: 4, docs: 5, total: 9 },
      { best_practices: 2, docs: 3, total: 5 },
    ])
  })

  it('parses numeric ratings and the open form (no closing ■)', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req) ? JSON.stringify({ quality: labels }) : '■0:quality=5\n■1:quality=1\n■2:quality=very_good'
    )
    const res = await zai.rate(['a', 'b', 'c'], { quality: 'quality' })
    expect(res.map((r) => r.quality)).toEqual([5, 1, 5])
  })

  it('parses fenced criteria JSON with nested objects', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req) ? '```json\n' + JSON.stringify({ quality: labels }, null, 2) + '\n```' : '■0:quality=good■'
    )
    expect(await zai.rate(['a'], 'how good')).toEqual([4])
  })

  it('retries when a criterion is missing instead of shrinking the total', async () => {
    const { zai, calls } = makeZai((req) => {
      if (isCriteria(req)) return JSON.stringify({ a: labels, b: labels })
      return isRetry(req) ? '■0:a=good;b=good■' : '■0:a=good■'
    })
    expect(await zai.rate(['x'], { a: 'a', b: 'b' })).toEqual([{ a: 4, b: 4, total: 8 }])
    expect(lastUser(calls.find(isRetry)!)).toContain('missing rating for "b"')
  })

  it('retries on invalid labels instead of silently using 3', async () => {
    const { zai, calls } = makeZai((req) => {
      if (isCriteria(req)) return JSON.stringify({ a: labels })
      return isRetry(req) ? '■0:a=bad■' : '■0:a=superb■'
    })
    expect(await zai.rate(['x'], { a: 'a' })).toEqual([{ a: 2, total: 2 }])
    expect(calls.filter(isRetry)).toHaveLength(1)
  })

  it('rejects "total" as a criterion name', async () => {
    const { zai } = makeZai(() => '')
    await expect(zai.rate(['x'], { total: 'overall' })).rejects.toThrow(/reserved/)
  })

  it('drops a model-generated "total" criterion', async () => {
    const { zai } = makeZai((req) =>
      isCriteria(req) ? JSON.stringify({ quality: labels, total: labels }) : '■0:quality=good■'
    )
    expect(await zai.rate(['a'], 'how good')).toEqual([4])
  })
})

describe('group robustness', () => {
  const elementCount = (req: FakeRequest) => {
    const m = lastUser(req).match(/Elements \(■0 to ■(\d+)\)/)
    return m ? Number(m[1]) + 1 : 0
  }

  it('does not merge "New York" into "York"', async () => {
    const { zai } = makeZai((req) => Array.from({ length: elementCount(req) }, (_, i) => `■${i}:G${i + 1}■`).join('\n'))
    const { output: res } = await zai
      .group(['Manhattan', 'Shambles'], {
        initialGroups: [
          { id: 'ny', label: 'New York' },
          { id: 'yk', label: 'York' },
        ],
        newGroups: false,
      })
      .result()
    expect(Object.fromEntries(res.map((g) => [g.id, g.elements]))).toEqual({ ny: ['Manhattan'], yk: ['Shambles'] })
  })

  it('still strips an explicit "New Group:" marker from invented labels', async () => {
    const { zai } = makeZai((req) =>
      Array.from({ length: elementCount(req) }, (_, i) => `■${i}:${i === 0 ? 'New Group: Snacks' : 'Snacks'}■`).join(
        '\n'
      )
    )
    const { output: res } = await zai.group(['chips', 'pretzels']).result()
    expect(res).toHaveLength(1)
    expect(res[0]!.label).toBe('Snacks')
  })

  it('parses answers without the closing ■', async () => {
    const { zai, calls } = makeZai((req) =>
      Array.from({ length: elementCount(req) }, (_, i) => `■${i}:G${(i % 2) + 1}`).join('\n')
    )
    const { output: res } = await zai
      .group(['a', 'b', 'c', 'd'], {
        initialGroups: [
          { id: 'odd', label: 'Odd' },
          { id: 'even', label: 'Even' },
        ],
        newGroups: false,
      })
      .result()
    expect(Object.fromEntries(res.map((g) => [g.id, g.elements]))).toEqual({ odd: ['a', 'c'], even: ['b', 'd'] })
    expect(calls).toHaveLength(1)
  })

  it('rejects duplicate initialGroups ids', async () => {
    const { zai } = makeZai(() => '')
    await expect(
      zai.group(['a'], {
        initialGroups: [
          { id: 'x', label: 'One' },
          { id: 'x', label: 'Two' },
        ],
      })
    ).rejects.toThrow(/duplicate initialGroups id/)
  })

  it('places orphans in the renamed group after a maxGroups merge', async () => {
    const items = ['apple', 'pear', 'carrot', 'leek', 'bolt', 'nut', 'basil']
    const kind = (e: string) =>
      ['apple', 'pear'].includes(e)
        ? 'Fruit'
        : ['carrot', 'leek'].includes(e)
          ? 'Veg'
          : e === 'basil'
            ? 'Herb'
            : 'Hardware'
    const { zai } = makeZai((req) => {
      if (req.systemPrompt?.startsWith('You are consolidating')) {
        const lines = [...lastUser(req).matchAll(/^■(\d+):([^(]+)\(/gm)].map((m) => [m[1], m[2]!.trim()])
        return lines.map(([i, label]) => `■${i}:${label === 'Hardware' ? 'Hardware' : 'Produce'}■`).join('\n')
      }
      const user = lastUser(req)
      const els = [...user.matchAll(/^■(\d+): (.*)■$/gm)].map((m) => m[2]!)
      const refs = new Map([...user.matchAll(/^(G\d+): (.*)$/gm)].map((m) => [m[2]!.trim(), m[1]!]))
      return els
        .map((e, i) => {
          if (refs.has('Produce') && e === 'basil') return `■${i}:${refs.get('Produce')}■`
          const k = kind(e)
          return `■${i}:${refs.get(k) ?? k}■`
        })
        .join('\n')
    })
    const { output: res } = await zai.group(items, { maxGroups: 3, minElements: 2 }).result()
    const produce = res.find((g) => g.label === 'Produce')
    expect(produce?.elements).toContain('basil')
    expect(res.find((g) => g.label === 'Hardware')?.elements).not.toContain('basil')
  })
})

describe('rate criteria and values', () => {
  it('parses decimal ratings', () => {
    expect(parseRatingValue('4.0')).toBe(4)
    expect(parseRatingValue('4.')).toBe(4)
    expect(parseRatingValue('Good.')).toBe(4)
    expect(parseRatingValue('4.5')).toBeUndefined()
  })

  it('accepts non-English criterion names', async () => {
    const labels = { very_bad: 'a', bad: 'b', average: 'c', good: 'd', very_good: 'e' }
    const { zai } = makeZai((req) =>
      req.systemPrompt?.startsWith('You are creating evaluation criteria')
        ? JSON.stringify({ 质量: labels, 速度: labels })
        : '■0:质量=good;速度=bad■'
    )
    const res = await zai.rate(['x'], { 质量: 'quality', 速度: 'speed' })
    expect(res).toEqual([{ 质量: 4, 速度: 2, total: 6 }])
  })
})
