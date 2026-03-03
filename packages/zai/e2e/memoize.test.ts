import { describe, it, expect, vi } from 'vitest'
import { z } from '@bpinternal/zui'

import { Zai, type Memoizer } from '../src'

let _responseText = ''

const createMockCognitive = () => {
  const mock: any = {
    $$IS_COGNITIVE: true,
    clone() {
      return { ...mock, clone: mock.clone, on: mock.on }
    },
    on: vi.fn(() => () => {}),
    generateContent: vi.fn(async () => ({
      output: { choices: [{ content: _responseText }] },
      meta: { cached: false, tokens: { input: 10, output: 10 }, cost: { input: 0.001, output: 0.001 } },
    })),
    getModelDetails: vi.fn(async () => ({
      input: { maxTokens: 100_000 },
      output: { maxTokens: 4096 },
    })),
  }
  return mock
}

const createSequenceMock = (responses: string[]) => {
  let callCount = 0
  const mock = createMockCognitive()
  mock.generateContent = vi.fn(async () => {
    const text = responses[callCount] ?? responses[responses.length - 1]
    callCount++
    return {
      output: { choices: [{ content: text }] },
      meta: { cached: false, tokens: { input: 10, output: 10 }, cost: { input: 0.001, output: 0.001 } },
    }
  })
  return mock
}

const createSpyMemoizer = () => {
  const spy = vi.fn(async (_id: string, fn: () => Promise<any>) => fn())
  const factory = () => ({ run: spy }) as Memoizer
  return { factory, spy }
}

describe('memoizer integration', { timeout: 10_000 }, () => {
  it('zai.check calls memoizer at least 1 time', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.check('Hello world', 'is english')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.check:/)
  })

  it('zai.extract calls memoizer at least 1 time', async () => {
    _responseText = '■json_start■\n{"name": "John", "age": 30}\n■json_end■\n■NO_MORE_ELEMENT■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    const schema = z.object({ name: z.string(), age: z.number() })
    await zai.extract('John is 30 years old', schema)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.extract:/)
  })

  it('zai.text calls memoizer at least 1 time', async () => {
    _responseText = 'Hello, this is generated text.'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.text('Write a greeting')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.text:/)
  })

  it('zai.check calls memoizer at least 1 time (non-factory)', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const spy = vi.fn(async (_id: string, fn: () => Promise<any>) => fn())
    const memoizer: Memoizer = { run: spy }
    const zai = new Zai({ client: createMockCognitive(), memoize: memoizer })
    await zai.check('Hello world', 'is english')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('zai.filter calls memoizer at least 1 time', async () => {
    _responseText = '■0:true■1:false■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.filter(['apple', 'rock'], 'is a fruit')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.filter:/)
  })

  it('zai.label calls memoizer at least 1 time', async () => {
    _responseText = '■positive:【The text sounds happy】:ABSOLUTELY_YES■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.label('I love this!', { positive: 'is positive sentiment' })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.label:/)
  })

  it('zai.rate calls memoizer at least 1 time', async () => {
    // rate has 2 phases: criteria generation (expects JSON) + scoring
    const mock = createSequenceMock([
      '```json\n{"quality": {"very_bad": "terrible", "bad": "poor", "average": "ok", "good": "nice", "very_good": "excellent"}}\n```',
      '■0:quality=good■\n■END■',
    ])
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: mock, memoize: factory })
    await zai.rate(['item1'], 'quality')
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.rate:/)
  })

  it('zai.sort calls memoizer at least 1 time', async () => {
    // sort has 2 phases: criteria generation + scoring
    const mock = createSequenceMock([
      '■relevance■\nlow;medium;high\n■END■',
      '■0:relevance=high■\n■1:relevance=low■\n■END■',
    ])
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: mock, memoize: factory })
    await zai.sort(['banana', 'apple'], 'alphabetical order')
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.sort:/)
  })

  it('zai.answer calls memoizer at least 1 time', async () => {
    _responseText = '■answer\nBotpress was founded in 2016 ■001.\n■end■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.answer(['Botpress was founded in 2016.'], 'When was Botpress founded?')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.answer:/)
  })

  it('zai.summarize calls memoizer at least 1 time', async () => {
    _responseText = '■START■\nThis is a summary of the text.\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.summarize('This is a long text that needs to be summarized.', { length: 20 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:summarize:/)
  })

  it('zai.rewrite calls memoizer at least 1 time', async () => {
    _responseText = '■START■\nBonjour le monde\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.rewrite('Hello world', 'Translate to French')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.rewrite:/)
  })

  it('zai.patch calls memoizer at least 1 time', async () => {
    _responseText = '<FILE path="hello.ts">\n◼︎=1|console.log("Hi")\n</FILE>'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.patch([{ name: 'hello.ts', path: 'hello.ts', content: 'console.log("Hello")' }], 'Change Hello to Hi')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.patch:/)
  })

  it('zai.group calls memoizer at least 1 time', async () => {
    _responseText = '■0:Fruits■\n■1:Vegetables■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    await zai.group(['apple', 'carrot'])
    // group may do multiple passes (initial + merge)
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(spy.mock.calls[0]![0]).toMatch(/^zai:memo:zai\.group:/)
  })

  it('memoizer key is deterministic for same inputs', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })

    await zai.check('Hello world', 'is english')
    await zai.check('Hello world', 'is english')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]![0]).toBe(spy.mock.calls[1]![0])
  })

  it('memoizer key differs for different inputs', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })

    await zai.check('Hello world', 'is english')
    await zai.check('Bonjour le monde', 'is english')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]![0]).not.toBe(spy.mock.calls[1]![0])
  })

  it('memoizer key differs for different operations', async () => {
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })

    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    await zai.check('Hello', 'is english')

    _responseText = 'Generated text.'
    await zai.text('Hello')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]![0]).not.toBe(spy.mock.calls[1]![0])
  })

  it('memoizer can short-circuit and return cached result', async () => {
    // The check transform returns { finalAnswer, explanation }, so the cached result must match
    const cachedResult = {
      meta: { cached: true, tokens: { input: 0, output: 0 }, cost: { input: 0, output: 0 } },
      output: { choices: [{ content: '' }] },
      text: '',
      extracted: { finalAnswer: true, explanation: 'cached' },
    }

    const spy = vi.fn(async (_id: string, _fn: () => Promise<any>) => cachedResult)
    const memoizer: Memoizer = { run: spy as any }
    const mock = createMockCognitive()
    const zai = new Zai({ client: mock, memoize: memoizer })

    const result = await zai.check('anything', 'anything')
    expect(result).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(mock.generateContent).not.toHaveBeenCalled()
  })

  it('works with .with() chaining', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const { factory, spy } = createSpyMemoizer()
    const zai = new Zai({ client: createMockCognitive(), memoize: factory })
    const fast = zai.with({ modelId: 'fast' })

    await fast.check('Hello', 'is english')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('no memoizer means no wrapping (noop)', async () => {
    _responseText = 'The text is in English.\n■TRUE■\n■END■'
    const mock = createMockCognitive()
    const zai = new Zai({ client: mock })
    await zai.check('Hello', 'is english')
    expect(mock.generateContent).toHaveBeenCalled()
  })
})
