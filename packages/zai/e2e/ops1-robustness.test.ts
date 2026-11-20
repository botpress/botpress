import { z } from '@bpinternal/zui'
import { describe, it, expect } from 'vitest'
import { Zai } from '../src/zai'
import '../src'

// Offline tests for extract / check / label / text / rewrite: a fake Cognitive client returns crafted outputs

type FakeOutput = string | undefined | { output: string | undefined; stopReason?: string }
type Responder = (input: any, idx: number) => FakeOutput

const makeZai = (
  responder: Responder,
  opts: { inMax?: number; outMax?: number; adapter?: any; learn?: string } = {}
) => {
  const calls: any[] = []
  const make = (): any => {
    const listeners: Record<string, ((...args: any[]) => void)[]> = {}
    const emit = (type: string, ...args: any[]) => (listeners[type] ?? []).forEach((l) => l(...args))
    return {
      $$IS_COGNITIVE_BETA: 'v2',
      clone: () => make(),
      on: (type: string, listener: (...args: any[]) => void) => {
        ;(listeners[type] ??= []).push(listener)
        return () => {}
      },
      getModelDetails: async (id: string) => ({
        id,
        name: id,
        input: { maxTokens: opts.inMax ?? 128_000 },
        output: { maxTokens: opts.outMax ?? 8_192 },
      }),
      generateText: async (input: any) => {
        calls.push({ ...input, messages: [...(input.messages ?? [])] })
        emit('request', {})
        const r = responder(input, calls.length - 1)
        const isPlain = typeof r !== 'object' || r === null
        let output = (isPlain ? r : (r as { output: string | undefined }).output) as string | undefined
        const stopReason = isPlain ? 'stop' : (r as { stopReason?: string }).stopReason
        // Providers stop before the stop sequence and don't include it
        for (const s of input.stopSequences ?? []) {
          if (output?.includes(s)) {
            output = output.slice(0, output.indexOf(s))
          }
        }
        const res = {
          output,
          metadata: {
            provider: 'fake',
            model: 'fake',
            stopReason,
            usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
            cost: 0,
          },
        }
        emit('response', {}, res)
        return res
      },
    }
  }

  let zai: any = new Zai({ client: make(), modelId: 'fast' })
  if (opts.learn) {
    zai = zai.with({ activeLearning: { enable: true, taskId: opts.learn, tableName: 'FakeTable' } })
  }
  if (opts.adapter) {
    zai.adapter = opts.adapter
  }
  return { zai: zai as Zai, calls }
}

const fakeAdapter = (examples: any[] = []) => {
  const saved: any[] = []
  return {
    saved,
    getExamples: async () => examples,
    saveExample: async (props: any) => {
      saved.push(props)
    },
  }
}

const el = (x: unknown) => `■json_start■${JSON.stringify(x)}■json_end■`
const lastUser = (call: any) => String(call.messages.at(-1)?.content ?? '')

const Person = z.object({ name: z.string(), age: z.number() })

describe('extract robustness', () => {
  it('merging chunk results always terminates, even when each merge round does not shrink', async () => {
    const big = Array.from({ length: 40 }, (_, i) => ({ name: `person number ${i} with a long name`, age: i }))
    const { zai, calls } = makeZai(() => big.map(el).join('') + '■NO_MORE_ELEMENT■')
    const text = 'word '.repeat(3000)

    const result = await zai.extract(text, z.array(Person), { chunkLength: 100 })

    expect(result).toHaveLength(40)
    expect(calls.length).toBeLessThan(100)
  })

  it('throws when every chunk fails instead of merging nothing', async () => {
    const { zai, calls } = makeZai(() => '■json_start■{not json at all■json_end■■NO_MORE_ELEMENT■')
    const text = 'word '.repeat(500)

    await expect(zai.extract(text, z.array(Person), { chunkLength: 200 })).rejects.toThrow()
    expect(calls.some((c) => lastUser(c).includes('split into 0 parts'))).toBe(false)
  })

  it('saves examples under the task id used to look them up', async () => {
    const adapter = fakeAdapter()
    const { zai } = makeZai(() => el({ name: 'Alice', age: 30 }), { adapter, learn: 'people' })

    await zai.extract('Alice is 30', Person)

    expect(adapter.saved).toHaveLength(1)
    expect(adapter.saved[0].taskId).toBe('zai/people')
  })

  it('recovers an object cut off before its closing brace', async () => {
    const { zai } = makeZai(() => '■json_start■{"name":"Alice","age":3')
    expect(await zai.extract('Alice is 3', Person)).toEqual({ name: 'Alice', age: 3 })
  })

  it('splits the input instead of losing elements when the output hits the token limit', async () => {
    const people = Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, age: i }))
    const text = people.map((p) => `${p.name} is ${p.age}. ` + 'filler '.repeat(60)).join('\n')
    const { zai } = makeZai((input) => {
      const content = lastUser(input)
      const present = people.filter((p) => content.includes(`${p.name} is`))
      if (present.length === people.length) {
        // everything at once does not fit: two elements and a cut-off third
        return { output: el(people[0]) + el(people[1]) + '■json_start■{"name":"P2","a', stopReason: 'max_tokens' }
      }
      return present.map(el).join('') + '■NO_MORE_ELEMENT■'
    })

    const result = await zai.extract(text, z.array(Person))
    expect(result.map((p) => p.name).sort()).toEqual(people.map((p) => p.name))
  })

  it('keeps ■ inside values', async () => {
    const { zai } = makeZai(() => el({ name: 'Price ■ 5', age: 3 }))
    expect(await zai.extract('x', Person)).toEqual({ name: 'Price ■ 5', age: 3 })
  })

  it('ignores prose before the first marker, even when it contains braces', async () => {
    const { zai } = makeZai(() => `Extracting the {name, age} pairs:\n${el({ name: 'Bob', age: 25 })}`)
    expect(await zai.extract('Bob is 25', Person)).toEqual({ name: 'Bob', age: 25 })
  })

  it('does not reuse a cached result made for a different schema', async () => {
    const adapter = fakeAdapter()
    const first = makeZai(() => el({ name: 'Alice', age: 30 }), { adapter, learn: 'people' })
    await first.zai.extract('Alice is 30', Person)
    const cached = { ...adapter.saved[0], similarity: 1 }

    const City = z.object({ city: z.string() })
    const second = makeZai(() => el({ city: 'Paris' }), { adapter: fakeAdapter([cached]), learn: 'people' })
    expect(await second.zai.extract('Alice is 30', City)).toEqual({ city: 'Paris' })
    expect(second.calls).toHaveLength(1)

    // same schema: exact cache hit, no call
    const third = makeZai(() => el({ name: 'X', age: 0 }), { adapter: fakeAdapter([cached]), learn: 'people' })
    expect(await third.zai.extract('Alice is 30', Person)).toEqual({ name: 'Alice', age: 30 })
    expect(third.calls).toHaveLength(0)
  })

  it("validates the final result against the caller's schema and retries", async () => {
    const { zai, calls } = makeZai((_input, i) =>
      i === 0
        ? el({ name: 'A', age: 1 }) + el({ name: 'B', age: 2 }) + '■NO_MORE_ELEMENT■'
        : el({ name: 'A', age: 1 }) + '■NO_MORE_ELEMENT■'
    )
    const result = await zai.extract('A and B', z.array(Person).max(1))
    expect(result).toEqual([{ name: 'A', age: 1 }])
    expect(calls).toHaveLength(2)
  })

  it('applies refinements of the caller schema', async () => {
    const { zai } = makeZai(() => el({ name: 'A', age: -1 }))
    await expect(
      zai.extract(
        'x',
        Person.refine((p) => p.age >= 0, 'age must be positive')
      )
    ).rejects.toThrow(/age must be positive/)
  })

  it('keeps nullable / optional on top-level values', async () => {
    const nullable = makeZai(() => el({ value: null }))
    expect(await nullable.zai.extract('nothing', z.string().nullable())).toBeNull()

    const optional = makeZai(() => '■ZERO_ELEMENTS■')
    expect(await optional.zai.extract('nothing', Person.optional())).toBeUndefined()
  })

  it('never returns an object for a primitive schema in non-strict mode', async () => {
    const { zai } = makeZai(() => el({}))
    const result = await zai.extract('no age here', z.number(), { strict: false })
    expect(typeof result === 'object' && result !== null).toBe(false)
  })

  it('rejects date / bigint in strict mode and recursive schemas with a clear error, without calling the model', async () => {
    const { zai, calls } = makeZai(() => el({}))
    await expect(zai.extract('x', z.object({ when: z.date() }))).rejects.toThrow(/z\.date\(\) is not supported/)
    await expect(zai.extract('x', z.object({ n: z.bigint() }))).rejects.toThrow(/z\.bigint\(\) is not supported/)

    const NodeSchema: any = z.lazy(() => z.object({ name: z.string(), children: z.array(NodeSchema) }))
    await expect(zai.extract('x', z.object({ root: NodeSchema }) as any)).rejects.toThrow(/recursive/)
    expect(calls).toHaveLength(0)
  })

  it('explains when the schema does not fit the model context', async () => {
    const shape = Object.fromEntries(
      Array.from({ length: 300 }, (_, i) => [`field_${i}`, z.string().describe('a very long description '.repeat(5))])
    )
    const { zai } = makeZai(() => el({}), { inMax: 2_000 })
    await expect(zai.extract('x', z.object(shape))).rejects.toThrow(/schema is too large/)
  })
})

describe('label robustness', () => {
  const line = (key: string, label: string, explanation = 'because') => `■${key}:【${explanation}】:${label}■`

  it('parses ABSOLUTELY_YES with full confidence', async () => {
    const { zai } = makeZai(() => line('urgent', 'ABSOLUTELY_YES') + '\n■END■')
    const { output } = await zai.label('x', { urgent: 'is it urgent?' }).result()
    expect(output.urgent).toMatchObject({ value: true, confidence: 1 })
  })

  it('does not mix up two labels written on the same line', async () => {
    const { zai } = makeZai(() => `${line('urgent', 'ABSOLUTELY_NOT')} ${line('complaint', 'ABSOLUTELY_YES')}\n■END■`)
    const { output } = await zai.label('x', { urgent: 'urgent?', complaint: 'complaint?' }).result()
    expect(output.urgent).toMatchObject({ value: false, confidence: 1 })
    expect(output.complaint).toMatchObject({ value: true, confidence: 1 })
  })

  it('accepts multi-line explanations and labels written with spaces', async () => {
    const { zai } = makeZai(() => `■urgent:【line one\nline two】:Absolutely Yes■\n■END■`)
    const { output } = await zai.label('x', { urgent: 'urgent?' }).result()
    expect(output.urgent).toEqual({ value: true, confidence: 1, explanation: 'line one\nline two' })
  })

  it('retries when a label is missing instead of answering false', async () => {
    const { zai, calls } = makeZai((_input, i) =>
      i === 0 ? line('urgent', 'PROBABLY_YES') : `${line('urgent', 'PROBABLY_YES')}\n${line('spam', 'PROBABLY_NOT')}`
    )
    const { output } = await zai.label('x', { urgent: 'urgent?', spam: 'spam?' }).result()
    expect(calls).toHaveLength(2)
    expect(lastUser(calls[1])).toContain('spam')
    expect(output.spam).toMatchObject({ value: false, confidence: 0.5 })
  })

  it('does not put "undefined" in the prompt when there are no instructions', async () => {
    const { zai, calls } = makeZai(() => line('urgent', 'AMBIGUOUS'))
    await zai.label('x', { urgent: 'urgent?' })
    expect(calls[0].systemPrompt).not.toContain('undefined')
  })

  it('returns an empty result for an empty label set without calling the model', async () => {
    const { zai, calls } = makeZai(() => '')
    expect(await zai.label('x', {})).toEqual({})
    expect(calls).toHaveLength(0)
  })
})

describe('check robustness', () => {
  it('retries on an empty (undefined) output with a useful error', async () => {
    const { zai, calls } = makeZai((_input, i) => (i === 0 ? undefined : 'Analysis: yes.\nFinal Answer: ■TRUE■'))
    expect(await zai.check('x', 'is it?')).toBe(true)
    expect(calls).toHaveLength(2)
    expect(lastUser(calls[1])).toContain('Final Answer: ■TRUE■')
  })

  it('accepts marker variants', async () => {
    expect(await makeZai(() => 'Analysis: no.\nFinal Answer: ■false■').zai.check('x', 'is it?')).toBe(false)
    expect(await makeZai(() => 'Analysis: yes.\nFinal Answer: TRUE').zai.check('x', 'is it?')).toBe(true)
  })
})

describe('rewrite robustness', () => {
  it('does not return text written before ■START■', async () => {
    const { zai, calls } = makeZai((_input, i) =>
      i === 0 ? 'Sure! Here is the rewrite:\nBonjour' : 'Sure! Here is the rewrite:\n■START■Bonjour■END■'
    )
    expect(await zai.rewrite('Hello', 'translate to French')).toBe('Bonjour')
    expect(calls).toHaveLength(2)
  })

  it('handles an input that contains the markers', async () => {
    const { zai, calls } = makeZai((input) => {
      const [start, end] = [input.stopSequences[0].replace('END', 'START'), input.stopSequences[0]]
      return `${start}KEEP THE ■END■ MARKER${end}`
    })
    expect(await zai.rewrite('keep the ■END■ marker', 'uppercase')).toBe('KEEP THE ■END■ MARKER')
    expect(calls[0].stopSequences).not.toContain('■END■')
  })
})

describe('text robustness', () => {
  it('caps the output with maxTokens and never asks for more than the requested length', async () => {
    const { zai, calls } = makeZai(() => 'Boo.')
    await zai.text('scary', { length: 1 })
    expect(calls[0].maxTokens).toBeGreaterThan(0)
    expect(calls[0].systemPrompt).toContain('Length constraint: 1 tokens')
  })
})

describe('extract schema transforms', () => {
  it('applies nested transforms exactly once', async () => {
    const { zai } = makeZai(() => el({ n: 1 }))
    const res = await zai.extract('n is 1', z.object({ n: z.number().transform((n) => n + 1) }))
    expect(res).toEqual({ n: 2 })
  })

  it('accepts transforms that change the value type', async () => {
    const { zai, calls } = makeZai(() => el({ word: 'abc' }))
    const res = await zai.extract('the word is abc', z.object({ word: z.string().transform((s) => s.length) }), {
      strict: true,
    })
    expect(res).toEqual({ word: 3 })
    expect(calls).toHaveLength(1)
  })

  it('applies transforms once across chunked extraction and merging', async () => {
    const { zai } = makeZai(() => el({ n: 1 }) + '■NO_MORE_ELEMENT■')
    const res = await zai.extract('word '.repeat(600), z.array(z.object({ n: z.number().transform((n) => n * 10) })), {
      chunkLength: 200,
    })
    expect(res.length).toBeGreaterThan(0)
    expect(res.every((x) => x.n === 10)).toBe(true)
  })
})
