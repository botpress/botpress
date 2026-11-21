import { describe, it, expect } from 'vitest'
import { Zai } from '../src/zai'
import '../src'

// Offline tests for the Cognitive classification API path of check / label, its LLM fallback and reasoningEffort

type ClassifyResponder = (input: any) => any

const makeZai = (
  props: {
    classify?: ClassifyResponder | null
    llm?: (input: any) => string
    config?: Record<string, unknown>
    adapter?: any
    learn?: string
  } = {}
) => {
  const classifyCalls: any[] = []
  const llmCalls: any[] = []
  const events: string[] = []
  const make = (): any => {
    const listeners: Record<string, ((...args: any[]) => void)[]> = {}
    const emit = (type: string, ...args: any[]) => (listeners[type] ?? []).forEach((l) => l(...args))
    const client: any = {
      $$IS_COGNITIVE_BETA: 'v2',
      clone: () => make(),
      on: (type: string, listener: (...args: any[]) => void) => {
        ;(listeners[type] ??= []).push(listener)
        return () => {}
      },
      getModelDetails: async (id: string) => ({
        id,
        name: id,
        input: { maxTokens: 128_000 },
        output: { maxTokens: 8_192 },
      }),
      generateText: async (input: any, options: any) => {
        llmCalls.push({ input: { ...input, messages: [...(input.messages ?? [])] }, options })
        emit('request', {})
        const res = {
          output: props.llm?.(input) ?? 'Analysis: ok\nFinal Answer: ■TRUE■',
          metadata: {
            provider: 'fake',
            model: 'fake-llm',
            stopReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 10, inputCost: 0.01, outputCost: 0.02 },
          },
        }
        emit('response', {}, res)
        return res
      },
    }
    if (props.classify !== null) {
      client.classify = async (input: any, options: any) => {
        classifyCalls.push({ input, options })
        events.push('classify')
        emit('request', {})
        try {
          const out = (props.classify ?? (() => ({ yes: 0.95 })))(input)
          if (out instanceof Error) {
            throw out
          }
          const yes = out.yes as number
          const scores: Array<{ label: string; probability: number }> | undefined = out.scores
          const winner = scores ? [...scores].sort((a, b) => b.probability - a.probability)[0]!.label : undefined
          const res = {
            output: {
              label: out.label ?? winner ?? (yes >= 0.5 ? 'yes' : 'no'),
              confidence: 0.9,
              scores: out.unscored
                ? []
                : (scores ?? [
                    { label: 'yes', probability: yes },
                    { label: 'no', probability: 1 - yes },
                  ]),
            },
            metadata: {
              requestId: 'r',
              backend: 'jev',
              provider: 'typesafe',
              model: 'typesafe:jev-1.13.0',
              usage: { inputTokens: 100, outputTokens: 1 },
              cost: 0.001,
              latency: 50,
            },
            ...(out.error ? { error: out.error } : {}),
          }
          emit('response', {}, res)
          return res
        } catch (err) {
          emit('error', {}, err)
          throw err
        }
      }
    }
    return client
  }

  // Most tests exercise `moderate`; the defaults are tested explicitly (config: { priority: undefined })
  let zai: any = new Zai({ client: make(), modelId: 'fast', priority: 'moderate', ...props.config })
  if (props.learn) {
    zai = zai.with({ activeLearning: { enable: true, taskId: props.learn, tableName: 'FakeTable' } })
  }
  if (props.adapter) {
    zai.adapter = props.adapter
  }
  return { zai: zai as Zai, classifyCalls, llmCalls }
}

const fakeAdapter = (examples: any[] = []) => {
  const saved: any[] = []
  return {
    saved,
    getExamples: async () => examples,
    saveExample: async (p: any) => {
      saved.push(p)
    },
  }
}

describe('check with the classifier', () => {
  it('answers with the classifier by default, without calling the LLM', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ classify: () => ({ yes: 0.97 }) })
    const { output, usage } = await zai.check('I love it', 'is positive').result()
    expect(output.value).toBe(true)
    expect(output.explanation).toContain('typesafe:jev-1.13.0')
    expect(output.explanation).toContain('97%')
    expect(llmCalls).toHaveLength(0)
    expect(classifyCalls).toHaveLength(1)
    // No model: the backend picks its classifier chain
    expect(classifyCalls[0].input).not.toHaveProperty('model')
    expect(classifyCalls[0].input.instructions).toContain('is positive')
    expect(classifyCalls[0].input.labels.map((l: any) => l.name)).toEqual(['yes', 'no'])
    expect(classifyCalls[0].options.signal).toBeInstanceOf(AbortSignal)
    // Classification responses only report a total cost
    expect(usage.cost.total).toBeCloseTo(0.001)
    expect(usage.requests.requests).toBe(1)
  })

  it('answers false when confidently no', async () => {
    const { zai, llmCalls } = makeZai({ classify: () => ({ yes: 0.03 }) })
    expect(await zai.check('meh', 'is positive')).toBe(false)
    expect(llmCalls).toHaveLength(0)
  })

  it('lets the LLM decide when the classifier is not confident', async () => {
    for (const yes of [0.06, 0.5, 0.94]) {
      const { zai, classifyCalls, llmCalls } = makeZai({ classify: () => ({ yes }) })
      const { output, usage } = await zai.check('x', 'y').result()
      expect(output.explanation).toContain('ok')
      expect(classifyCalls).toHaveLength(1)
      expect(llmCalls).toHaveLength(1)
      // Both calls are accounted
      expect(usage.cost.total).toBeCloseTo(0.031)
      expect(usage.requests.requests).toBe(2)
    }
  })

  it('stringifies non-string inputs (arrays are judged as a whole)', async () => {
    const { zai, classifyCalls } = makeZai({ classify: () => ({ yes: 0.01 }) })
    expect(await zai.check(['apple', 'house'], 'only fruits')).toBe(false)
    expect(classifyCalls).toHaveLength(1)
    expect(classifyCalls[0].input.input).toContain('house')
  })

  it('lets the LLM decide when the answer is unscored (server generation fallback)', async () => {
    const { zai, llmCalls } = makeZai({
      classify: () => ({ yes: 0, label: 'no', unscored: true }),
    })
    // The fake LLM answers TRUE, the unscored classifier said no
    expect(await zai.check('x', 'y')).toBe(true)
    expect(llmCalls).toHaveLength(1)
  })

  it("priority 'speed' uses the winning label of an unscored answer", async () => {
    const { zai, llmCalls } = makeZai({
      config: { priority: 'speed' },
      classify: () => ({ yes: 0, label: 'yes', unscored: true }),
    })
    expect(await zai.check('x', 'y')).toBe(true)
    expect(llmCalls).toHaveLength(0)
  })

  it('falls back to the LLM when the classifier throws', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ classify: () => new Error('503 unavailable') })
    const { output } = await zai.check('x', 'y').result()
    expect(output.value).toBe(true)
    expect(output.explanation).toContain('ok')
    expect(classifyCalls).toHaveLength(1)
    expect(llmCalls).toHaveLength(1)
  })

  it('falls back to the LLM when the response has an error or an unknown label', async () => {
    for (const out of [
      { yes: 0.99, error: 'degraded' },
      { yes: 0.99, label: 'maybe' },
    ]) {
      const { zai, llmCalls } = makeZai({ classify: () => out })
      await zai.check('x', 'y')
      expect(llmCalls).toHaveLength(1)
    }
  })

  it('falls back to the LLM when the client has no classify method', async () => {
    const { zai, llmCalls } = makeZai({ classify: null })
    expect(await zai.check('x', 'y')).toBe(true)
    expect(llmCalls).toHaveLength(1)
  })

  it('uses the LLM when examples are given (the classifier cannot learn from them)', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai()
    await zai.check('x', 'y', { examples: [{ input: 'a', check: true, reason: 'r' }] })
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('uses the LLM when the adapter returns approved examples', async () => {
    const adapter = fakeAdapter([{ key: 'k', input: 'a', output: true, explanation: 'e', similarity: 1 }])
    const { zai, classifyCalls, llmCalls } = makeZai({ adapter, learn: 't' })
    await zai.check('x', 'y')
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('uses the LLM for inputs over the classifier limit', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai()
    await zai.check('word '.repeat(20_001), 'y')
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it("priority 'speed' answers with the classifier alone, at the 0.6 threshold", async () => {
    for (const [yes, expected] of [
      [0.6, true],
      [0.59, false],
      [0.5, false],
      [0.94, true],
    ] as const) {
      const { zai, llmCalls } = makeZai({ config: { priority: 'speed' }, classify: () => ({ yes }) })
      expect(await zai.check('x', 'y')).toBe(expected)
      expect(llmCalls).toHaveLength(0)
    }
  })

  it("priority 'speed' still falls back to the LLM when the classifier is unavailable", async () => {
    const { zai, llmCalls } = makeZai({ config: { priority: 'speed' }, classify: () => new Error('down') })
    expect(await zai.check('x', 'y')).toBe(true)
    expect(llmCalls).toHaveLength(1)
  })

  it('priority can be changed with with()', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ classify: () => ({ yes: 0.5 }) })
    await zai.with({ priority: 'accuracy' }).check('x', 'y')
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('never calls the classifier when it is disabled', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ config: { priority: 'accuracy' } })
    await zai.check('x', 'y')
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('passes a custom classifier chain', async () => {
    const { zai, classifyCalls } = makeZai({ config: { classifier: ['jev', 'openai:gpt-6-luna'] } })
    await zai.check('x', 'y')
    expect(classifyCalls[0].input.model).toEqual(['jev', 'openai:gpt-6-luna'])
  })

  it('rejects an invalid classifier option', () => {
    expect(() => makeZai({ config: { classifier: [] } })).toThrow()
    expect(() => makeZai({ config: { classifier: false } })).toThrow()
    expect(() => makeZai({ config: { priority: 'fast' } })).toThrow()
  })

  it('saves the classifier answer as an active learning example', async () => {
    const adapter = fakeAdapter()
    const { zai } = makeZai({ adapter, learn: 't', classify: () => ({ yes: 0.97 }) })
    await zai.check('x', 'y')
    expect(adapter.saved).toHaveLength(1)
    expect(adapter.saved[0].output).toBe(true)
    expect(adapter.saved[0].metadata.model).toBe('typesafe:jev-1.13.0')
  })

  it('surfaces an abort instead of falling back to the LLM', async () => {
    const controller = new AbortController()
    const { zai, llmCalls } = makeZai({
      classify: () => {
        controller.abort(new Error('stop'))
        return new Error('aborted')
      },
    })
    const response = zai.check('x', 'y')
    void response.bindSignal(controller.signal)
    await expect(response).rejects.toThrow('stop')
    expect(llmCalls).toHaveLength(0)
  })
})

describe('label with the classifier', () => {
  const labels = { billing: 'Is it about billing?', urgent: 'Is it urgent?', human: 'Wants a human?' }

  it('classifies each label in parallel and sends only the uncertain ones to the LLM', async () => {
    const p: Record<string, number> = { billing: 0.99, urgent: 0.7, human: 0.01 }
    const { zai, classifyCalls, llmCalls } = makeZai({
      classify: (input) => {
        const key = Object.entries(labels).find(([, q]) => input.instructions.includes(q))![0]
        return { yes: p[key]! }
      },
      llm: () => '■urgent:【the customer is waiting】:PROBABLY_YES■\n■END■',
    })
    const { output } = await zai.label('I was charged twice', labels, { instructions: 'Be strict' }).result()
    expect(classifyCalls).toHaveLength(3)
    expect(classifyCalls.every((c) => c.input.instructions.includes('Be strict'))).toBe(true)
    expect(llmCalls).toHaveLength(1)
    // Only the uncertain label is asked to the LLM
    const prompt = JSON.stringify(llmCalls[0].input)
    expect(prompt).toContain('■urgent:')
    expect(prompt).not.toContain('■billing:')
    expect(output.billing).toMatchObject({ value: true, confidence: 1 })
    expect(output.billing.explanation).toContain('99%')
    expect(output.urgent).toMatchObject({ value: true, confidence: 0.5, explanation: 'the customer is waiting' })
    expect(output.human).toMatchObject({ value: false, confidence: 1 })
  })

  it('does not call the LLM when every label is confident', async () => {
    const { zai, llmCalls } = makeZai({ classify: () => ({ yes: 0.98 }) })
    expect(await zai.label('x', labels)).toEqual({ billing: true, urgent: true, human: true })
    expect(llmCalls).toHaveLength(0)
  })

  it('sends a label the classifier failed on to the LLM, keeping the others', async () => {
    const { zai, llmCalls } = makeZai({
      classify: (input) => (input.instructions.includes('urgent') ? new Error('boom') : { yes: 0.99 }),
      llm: () => '■urgent:【no】:PROBABLY_NOT■\n■END■',
    })
    const { output } = await zai.label('I was charged twice', labels).result()
    expect(llmCalls).toHaveLength(1)
    expect(output.billing).toMatchObject({ value: true, confidence: 1 })
    expect(output.urgent).toMatchObject({ value: false, confidence: 0.5, explanation: 'no' })
  })

  it('saves the merged answer as one active learning example', async () => {
    const adapter = fakeAdapter()
    const { zai } = makeZai({
      adapter,
      learn: 't',
      classify: (input) => ({ yes: input.instructions.includes('urgent') ? 0.5 : 0.99 }),
      llm: () => '■urgent:【maybe】:AMBIGUOUS■\n■END■',
    })
    await zai.label('x', labels)
    expect(adapter.saved).toHaveLength(1)
    expect(Object.keys(adapter.saved[0].output).sort()).toEqual(['billing', 'human', 'urgent'])
    expect(adapter.saved[0].output.urgent.label).toBe('AMBIGUOUS')
  })

  it("priority 'speed' answers every label with the classifier (probably below 0.95)", async () => {
    const p: Record<string, number> = { billing: 0.99, urgent: 0.7, human: 0.3 }
    const { zai, llmCalls } = makeZai({
      config: { priority: 'speed' },
      classify: (input) => ({ yes: p[Object.entries(labels).find(([, q]) => input.instructions.includes(q))![0]]! }),
    })
    const { output } = await zai.label('x', labels).result()
    expect(llmCalls).toHaveLength(0)
    expect(output.billing).toMatchObject({ value: true, confidence: 1 })
    expect(output.urgent).toMatchObject({ value: true, confidence: 0.5 })
    expect(output.human).toMatchObject({ value: false, confidence: 0.5 })
  })

  it('uses the LLM when examples are given', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ llm: () => '■a:【x】:ABSOLUTELY_YES■\n■END■' })
    await zai.label('x', { a: 'q?' }, { examples: [{ input: 'y', labels: { a: { label: 'ABSOLUTELY_NOT' } } }] })
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('never calls the classifier when it is disabled', async () => {
    const { zai, classifyCalls } = makeZai({
      config: { priority: 'accuracy' },
      llm: () => '■a:【x】:ABSOLUTELY_YES■\n■END■',
    })
    expect(await zai.label('x', { a: 'q?' })).toEqual({ a: true })
    expect(classifyCalls).toHaveLength(0)
  })
})

describe('reasoningEffort', () => {
  it('is not sent unless configured (each model keeps its default)', async () => {
    const { zai, llmCalls } = makeZai({ config: { priority: 'accuracy' } })
    await zai.check('x', 'y')
    expect(llmCalls[0].input.reasoningEffort).toBeUndefined()
  })

  it('is sent on every LLM call when configured, overriding the operation default', async () => {
    const { zai, llmCalls } = makeZai({ config: { priority: 'accuracy', reasoningEffort: 'high' } })
    await zai.check('x', 'y')
    await zai.with({ reasoningEffort: 'low' }).text('hello')
    expect(llmCalls.map((c) => c.input.reasoningEffort)).toEqual(['high', 'low'])
  })

  it('rejects an invalid value', () => {
    expect(() => makeZai({ config: { reasoningEffort: 'max' } })).toThrow()
  })
})

const FRUITS = new Set(['apple', 'banana', 'mango'])

describe('filter with the classifier', () => {
  const items = ['apple', 'carrot', 'banana', 'tomato', 'mango', 'apple', 'potato']
  const pFruit = (text: string) => (FRUITS.has(text) ? 0.99 : text === 'tomato' ? 0.5 : 0.01)

  it('classifies each distinct item once, sends only uncertain ones to the LLM, keeps input order', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({
      classify: (input) => ({ yes: pFruit(input.input) }),
      llm: () => '■0:true■\n■END■',
    })
    const { output, usage } = await zai.filter(items, 'is a fruit').result()
    expect(output).toEqual(['apple', 'banana', 'tomato', 'mango', 'apple'])
    // 'apple' appears twice but is classified once
    expect(classifyCalls).toHaveLength(6)
    expect(llmCalls).toHaveLength(1)
    expect(JSON.stringify(llmCalls[0].input.messages.at(-1))).toContain('tomato')
    expect(JSON.stringify(llmCalls[0].input.messages.at(-1))).not.toContain('banana')
    expect(usage.cost.total).toBeCloseTo(6 * 0.001 + 0.03)
  })

  it("priority 'speed' never calls the LLM", async () => {
    const { zai, llmCalls } = makeZai({
      config: { priority: 'speed' },
      classify: (input) => ({ yes: pFruit(input.input) }),
    })
    expect(await zai.filter(items, 'is a fruit')).toEqual(['apple', 'banana', 'mango', 'apple'])
    expect(llmCalls).toHaveLength(0)
  })

  it('falls back to the LLM for items the classifier failed on', async () => {
    const { zai, llmCalls } = makeZai({
      classify: (input) => (input.input === 'carrot' ? new Error('boom') : { yes: pFruit(input.input) }),
      llm: (input) => (JSON.stringify(input.messages.at(-1)).includes('carrot') ? '■0:false■1:true■\n■END■' : ''),
    })
    expect(await zai.filter(items, 'is a fruit')).toEqual(['apple', 'banana', 'tomato', 'mango', 'apple'])
    expect(llmCalls).toHaveLength(1)
  })

  it('uses only the LLM with examples or with priority accuracy', async () => {
    for (const props of [
      { options: { examples: [{ input: 'kiwi', filter: true }] } },
      { config: { priority: 'accuracy' }, options: {} },
    ] as const) {
      const { zai, classifyCalls, llmCalls } = makeZai({
        config: 'config' in props ? props.config : undefined,
        llm: () => '■0:true■1:false■2:true■3:false■4:true■5:false■\n■END■',
      })
      await zai.filter(['a', 'b', 'c', 'd', 'e', 'f'], 'x', props.options as any)
      expect(classifyCalls).toHaveLength(0)
      expect(llmCalls).toHaveLength(1)
    }
  })
})

const CRITERIA_JSON = JSON.stringify({
  quality: { very_bad: 'awful', bad: 'poor', average: 'ok', good: 'nice', very_good: 'excellent' },
})

const levelScores = (winner: string, p = 0.97) =>
  ['very_bad', 'bad', 'average', 'good', 'very_good'].map((label) => ({
    label,
    probability: label === winner ? p : (1 - p) / 4,
  }))

describe('rate with the classifier', () => {
  it('rates confident items with the classifier and the rest with the LLM, in input order', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({
      classify: (input) => {
        expect(input.labels.map((l: any) => l.name)).toEqual(['very_bad', 'bad', 'average', 'good', 'very_good'])
        expect(input.labels[4].description).toBe('excellent')
        if (input.input === 'great') return { scores: levelScores('very_good') }
        if (input.input === 'bad') return { scores: levelScores('bad') }
        return { scores: levelScores('average', 0.5) }
      },
      llm: (input) =>
        JSON.stringify(input).includes('evaluation criteria for rating') ? CRITERIA_JSON : '■0:quality=good■\n■END■',
    })
    const ratings = await zai.rate(['great', 'meh', 'bad'], { quality: 'How good it is' })
    expect(ratings).toEqual([
      { quality: 5, total: 5 },
      { quality: 4, total: 4 },
      { quality: 2, total: 2 },
    ])
    expect(classifyCalls).toHaveLength(3)
    // criteria generation + one chunk with the uncertain item
    expect(llmCalls).toHaveLength(2)
  })

  it("priority 'speed' takes the most likely level without the LLM (except criteria generation)", async () => {
    const { zai, llmCalls } = makeZai({
      config: { priority: 'speed' },
      classify: () => ({ scores: levelScores('good', 0.4) }),
      llm: () => CRITERIA_JSON,
    })
    expect(await zai.rate(['a', 'b'], { quality: 'q' })).toEqual([
      { quality: 4, total: 4 },
      { quality: 4, total: 4 },
    ])
    expect(llmCalls).toHaveLength(1)
  })
})

describe('rate with unscored answers', () => {
  it('rates unscored items with the LLM in moderate mode', async () => {
    const { zai, llmCalls } = makeZai({
      classify: () => ({ label: 'very_good', unscored: true }),
      llm: (input) =>
        JSON.stringify(input).includes('evaluation criteria for rating') ? CRITERIA_JSON : '■0:quality=bad■\n■END■',
    })
    expect(await zai.rate(['x'], { quality: 'q' })).toEqual([{ quality: 2, total: 2 }])
    expect(llmCalls).toHaveLength(2)
  })
})

describe('classify', () => {
  const intents = { billing: 'Payments and invoices', technical: 'Something is broken', other: 'Anything else' }
  const scoresFor = (winner: string, p = 0.97) =>
    Object.keys(intents).map((label) => ({ label, probability: label === winner ? p : (1 - p) / 2 }))
  const byText: Record<string, { winner: string; p?: number }> = {
    'charged twice': { winner: 'billing' },
    'app crashes': { winner: 'technical' },
    'hello there': { winner: 'other', p: 0.6 },
  }

  it('classifies a single input into exactly one label', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({ classify: () => ({ scores: scoresFor('billing') }) })
    const label: 'billing' | 'technical' | 'other' = await zai.classify('charged twice', intents)
    expect(label).toBe('billing')
    const { output } = await zai.classify('charged twice', intents).result()
    expect(output).toMatchObject({ label: 'billing', source: 'classifier' })
    expect(output.confidence).toBeCloseTo(0.97)
    expect(output.scores.billing).toBeCloseTo(0.97)
    expect(classifyCalls[0].input.labels).toEqual([
      { name: 'billing', description: 'Payments and invoices' },
      { name: 'technical', description: 'Something is broken' },
      { name: 'other', description: 'Anything else' },
    ])
    expect(llmCalls).toHaveLength(0)
  })

  it('accepts a list of label names', async () => {
    const { zai, classifyCalls } = makeZai({ classify: () => ({ scores: scoresFor('technical') }) })
    expect(await zai.classify('app crashes', ['billing', 'technical', 'other'])).toBe('technical')
    expect(classifyCalls[0].input.labels.map((l: any) => l.name)).toEqual(['billing', 'technical', 'other'])
  })

  it('classifies arrays item by item (identical items once) and batches uncertain ones in one LLM prompt', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({
      classify: (input) => ({ scores: scoresFor(byText[input.input]!.winner, byText[input.input]!.p) }),
      llm: () => '■0: Other■\n■END■',
    })
    const items = ['charged twice', 'app crashes', 'hello there', 'charged twice']
    const { output } = await zai.classify(items, intents).result()
    expect(output.map((o) => o.label)).toEqual(['billing', 'technical', 'other', 'billing'])
    expect(output.map((o) => o.source)).toEqual(['classifier', 'classifier', 'llm', 'classifier'])
    expect(output[2]!.confidence).toBeNull()
    expect(classifyCalls).toHaveLength(3)
    expect(llmCalls).toHaveLength(1)
    expect(await zai.with({ priority: 'speed' }).classify(items, intents)).toEqual([
      'billing',
      'technical',
      'other',
      'billing',
    ])
  })

  it('classifies an array as a single input when wrapped', async () => {
    const { zai, classifyCalls } = makeZai({ classify: () => ({ scores: scoresFor('other') }) })
    expect(await zai.classify([['a', 'b']], intents)).toEqual(['other'])
    expect(classifyCalls).toHaveLength(1)
    expect(classifyCalls[0].input.input).toContain('"a"')
  })

  it('returns [] for an empty array', async () => {
    const { zai } = makeZai()
    expect(await zai.classify([], intents)).toEqual([])
  })

  it('uses only the LLM with examples, priority accuracy, or more than 50 labels', async () => {
    const many = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`l${i}`, `label ${i}`]))
    for (const run of [
      (zai: Zai) => zai.classify(['x', 'y'], intents, { examples: [{ input: 'refund', label: 'billing' }] }),
      (zai: Zai) => zai.with({ priority: 'accuracy' }).classify(['x', 'y'], intents),
      (zai: Zai) => zai.classify(['x', 'y'], many),
    ]) {
      const { zai, classifyCalls, llmCalls } = makeZai({ llm: () => '■0:billing■1:l3■\n■END■' })
      await run(zai).catch(() => undefined)
      expect(classifyCalls).toHaveLength(0)
      expect(llmCalls.length).toBeGreaterThan(0)
    }
  })

  it('retries when the LLM answers with an unknown label or misses an item', async () => {
    const outputs = ['■0:refunds■\n■END■', '■0:billing■\n■END■', '■0:billing■1:**Technical**■\n■END■']
    const { zai, llmCalls } = makeZai({
      config: { priority: 'accuracy' },
      llm: () => outputs.shift()!,
    })
    expect(await zai.classify(['charged twice', 'app crashes'], intents)).toEqual(['billing', 'technical'])
    expect(llmCalls).toHaveLength(3)
    expect(JSON.stringify(llmCalls[1].input.messages)).toContain('is not one of the labels')
  })

  it('falls back to the LLM when the classifier fails', async () => {
    const { zai, llmCalls } = makeZai({ classify: () => new Error('down'), llm: () => '■0:technical■\n■END■' })
    const { output } = await zai.classify('app crashes', intents).result()
    expect(output).toEqual({ label: 'technical', confidence: null, scores: {}, source: 'llm' })
    expect(llmCalls).toHaveLength(1)
  })

  it('validates labels and examples', async () => {
    const { zai } = makeZai()
    await expect(zai.classify('x', ['only'])).rejects.toThrow('At least 2 labels')
    await expect(zai.classify('x', ['Billing', 'billing'])).rejects.toThrow('same')
    await expect(zai.classify('x', ['a', ''])).rejects.toThrow('non-empty')
    await expect(zai.classify('x', ['a', 'b'], { examples: [{ input: 'y', label: 'c' as 'a' }] })).rejects.toThrow(
      'not one of the labels'
    )
  })

  it('saves the result for active learning and replays an exact match', async () => {
    const adapter = fakeAdapter()
    const { zai, classifyCalls } = makeZai({ adapter, learn: 't', classify: () => ({ scores: scoresFor('billing') }) })
    await zai.classify(['charged twice'], intents)
    expect(adapter.saved).toHaveLength(1)
    expect(adapter.saved[0].output[0]).toMatchObject({ label: 'billing', source: 'classifier' })

    const replay = fakeAdapter([{ ...adapter.saved[0], similarity: 1 }])
    const second = makeZai({ adapter: replay, learn: 't', classify: () => ({ scores: scoresFor('other') }) })
    expect(await second.zai.classify(['charged twice'], intents)).toEqual(['billing'])
    expect(second.classifyCalls).toHaveLength(0)
    expect(classifyCalls).toHaveLength(1)
  })
})

describe('defaults: priority speed and the fast service tier', () => {
  it("priority defaults to 'speed' (the classifier answers alone)", async () => {
    const { zai, llmCalls } = makeZai({ config: { priority: undefined }, classify: () => ({ yes: 0.7 }) })
    expect(await zai.check('x', 'y')).toBe(true)
    expect(llmCalls).toHaveLength(0)
  })

  it("requests the fast tier by default (priority 'speed')", async () => {
    const { zai, llmCalls } = makeZai({ config: { priority: undefined }, classify: null })
    await zai.check('x', 'y')
    expect(llmCalls[0].input.options).toEqual({ serviceTier: 'fast' })
  })

  it("uses the standard tier by default with priority 'moderate' or 'accuracy'", async () => {
    for (const priority of ['moderate', 'accuracy']) {
      const { zai, llmCalls } = makeZai({ config: { priority }, classify: null })
      await zai.check('x', 'y')
      expect(llmCalls[0].input.options).toBeUndefined()
    }
  })

  it('an explicit serviceTier wins over the priority default', async () => {
    const speed = makeZai({ config: { priority: 'speed', serviceTier: 'standard' }, classify: null })
    await speed.zai.check('x', 'y')
    expect(speed.llmCalls[0].input.options).toBeUndefined()

    const accurate = makeZai({ config: { priority: 'accuracy' } })
    await accurate.zai.with({ serviceTier: 'fast' }).check('x', 'y')
    expect(accurate.llmCalls[0].input.options).toEqual({ serviceTier: 'fast' })
  })

  it('does not apply to classification calls', async () => {
    const { zai, classifyCalls } = makeZai({ config: { priority: undefined }, classify: () => ({ yes: 0.99 }) })
    await zai.check('x', 'y')
    expect(classifyCalls[0].input).not.toHaveProperty('options')
  })

  it('rejects an invalid value', () => {
    expect(() => makeZai({ config: { serviceTier: 'flex' } })).toThrow()
  })
})

describe('review fixes', () => {
  it('filter saves the classifier decisions as a learning example', async () => {
    const adapter = fakeAdapter()
    const { zai } = makeZai({
      adapter,
      learn: 't',
      config: { priority: 'speed' },
      classify: (input) => ({ yes: input.input === 'apple' ? 0.99 : 0.01 }),
    })
    expect(await zai.filter(['apple', 'rock'], 'is a fruit')).toEqual(['apple'])
    expect(adapter.saved).toHaveLength(1)
    expect(JSON.parse(adapter.saved[0].input)).toEqual(['apple', 'rock'])
    expect(adapter.saved[0].output).toEqual(['apple'])
    expect(adapter.saved[0].metadata.model).toBe('typesafe:jev-1.13.0')
  })

  it('filter memo keys are versioned (an old memoized result is never replayed as decisions)', async () => {
    const keys: string[] = []
    const memoize = {
      run: async (key: string, fn: () => Promise<any>) => {
        keys.push(key)
        return fn()
      },
    }
    const { zai } = makeZai({
      config: { priority: 'accuracy', memoize },
      llm: () => '■0:true■1:false■\n■END■',
    })
    await zai.filter(['apple', 'rock'], 'is a fruit')
    const { ZaiContext } = await import('../src/context')
    const ctx = new ZaiContext({
      client: (zai as any).client,
      taskType: 'zai.filter',
      taskId: '',
      modelId: 'fast',
      memoizer: memoize,
      priority: 'accuracy',
    })
    const unversioned = keys.length
    await ctx.generateContent({ messages: [{ role: 'user', content: 'x' }] })
    await ctx.generateContent({ messages: [{ role: 'user', content: 'x' }], memoVersion: 2 })
    expect(keys[unversioned]).not.toBe(keys[unversioned + 1])
  })

  it('sends over-limit label descriptions to the LLM instead of cutting them', async () => {
    const { zai, classifyCalls, llmCalls } = makeZai({
      config: { priority: 'speed' },
      llm: () => '■0:a■\n■END■',
    })
    expect(await zai.classify('x', { a: 'A'.repeat(501), b: 'B' })).toBe('a')
    expect(classifyCalls).toHaveLength(0)
    expect(llmCalls).toHaveLength(1)
  })

  it('matches the exact label before removing punctuation, and rejects ambiguous loose matches', async () => {
    const outputs = ['■0:[VIP]■\n■END■', '■0:vip!■\n■END■', '■0:VIP■\n■END■']
    const { zai, llmCalls } = makeZai({ config: { priority: 'accuracy' }, llm: () => outputs.shift()! })
    expect(await zai.classify('x', ['[VIP]', 'VIP'])).toBe('[VIP]')
    // 'vip!' matches both labels loosely: retried, then answered exactly
    expect(await zai.classify('y', ['[VIP]', 'VIP'])).toBe('VIP')
    expect(llmCalls).toHaveLength(3)
  })

  it('classify fails clearly when the labels alone do not fit the model, only if the LLM is needed', async () => {
    const huge = Object.fromEntries(Array.from({ length: 2 }, (_, i) => [`l${i}`, 'word '.repeat(200_000)]))
    const llm = makeZai({ config: { priority: 'accuracy' } })
    await expect(llm.zai.classify('x', huge)).rejects.toThrow('too many for the model')
  })

  it('a failed example lookup is not cached', async () => {
    let calls = 0
    const adapter = {
      saved: [] as any[],
      getExamples: async () => {
        calls++
        if (calls === 1) throw new Error('tables down')
        return []
      },
      saveExample: async () => undefined,
    }
    const { zai } = makeZai({ adapter, learn: 't', config: { priority: 'accuracy' }, llm: () => '■0:a■\n■END■' })
    await expect(zai.classify('x', ['a', 'b'])).rejects.toThrow('tables down')
    expect(await zai.classify('x', ['a', 'b'])).toBe('a')
    expect(calls).toBe(2)
  })
})
