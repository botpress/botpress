// Offline regression tests for summarize / answer / patch / micropatch / json-utils: a fake cognitive client returns
// crafted model outputs, so these never call the network and never touch the e2e cache.
import { describe, it, expect } from 'vitest'
import { Zai } from '../src'
import { validateOrRepairJson } from '../src/json-utils'
import { Micropatch } from '../src/micropatch'
import { parseResponse } from '../src/operations/answer'
import { getTokenizer } from '../src/tokenizer'

type FakeRequest = {
  systemPrompt?: string
  maxTokens?: number
  messages: Array<{ role: string; content: string }>
}

type Reply = string | { output: string; stopReason?: 'stop' | 'max_tokens' }

const makeZai = (
  handler: (req: FakeRequest, n: number) => Reply | Promise<Reply>,
  model: { input: number; output: number } = { input: 100_000, output: 8_192 }
) => {
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
      const reply = await handler(snapshot, calls.length - 1)
      const { output, stopReason } = typeof reply === 'string' ? { output: reply, stopReason: 'stop' } : reply
      return {
        output,
        metadata: {
          provider: 'fake',
          model: 'fake',
          usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
          cost: 0,
          cached: false,
          latency: 1,
          stopReason: stopReason ?? 'stop',
        },
      }
    },
    getModelDetails: async () => ({
      name: 'fake',
      input: { maxTokens: model.input },
      output: { maxTokens: model.output },
    }),
  }
  return { zai: new Zai({ client: mock }), calls }
}

const firstUser = (req: FakeRequest) => String(req.messages[0]!.content)
const lastUser = (req: FakeRequest) => String(req.messages[req.messages.length - 1]!.content)
const isRetry = (req: FakeRequest) => req.messages.length > 1

const words = (n: number, seed = 'word') => Array.from({ length: n }, (_, i) => `${seed}${i}`).join(' ')

describe('micropatch robustness', () => {
  const abcde = 'a\nb\nc\nd\ne'

  it('does not touch the line before a deleted range when a later op targets the deleted line', () => {
    expect(Micropatch.applyText(abcde, '◼︎-3-4\n◼︎=4|X')).toBe('a\nb\ne')
    expect(Micropatch.applyText('L1\nL2\nL3\nL4', '◼︎-2-3\n◼︎=3|X')).toBe('L1\nL4')
    expect(Micropatch.applyText('L1\nL2\nL3\nL4', '◼︎-3\n◼︎=3|X')).toBe('L1\nL2\nL4')
  })

  it('reports ops skipped because their line was already deleted', () => {
    const { text, skipped } = Micropatch.applyWithReport(abcde, '◼︎-3\n◼︎=3|X')
    expect(text).toBe('a\nb\nd\ne')
    expect(skipped).toEqual([expect.objectContaining({ op: '◼︎=3', reason: 'conflict' })])
  })

  it('inserts next to a deleted line where that line was', () => {
    expect(Micropatch.applyText(abcde, '◼︎-3\n◼︎<3|NEW')).toBe('a\nb\nNEW\nd\ne')
    expect(Micropatch.applyText(abcde, '◼︎-3\n◼︎>3|NEW')).toBe('a\nb\nNEW\nd\ne')
  })

  it('supports multi-line inserts (as the patch prompt teaches)', () => {
    const source = 'export function add(a, b) {\n  return a + b\n}'
    expect(Micropatch.applyText(source, '◼︎<1|/**\n * Adds two numbers\n */')).toBe(
      '/**\n * Adds two numbers\n */\nexport function add(a, b) {\n  return a + b\n}'
    )
    expect(Micropatch.applyText('a\nb', '◼︎>1|x\ny\n◼︎=2|B')).toBe('a\nx\ny\nB')
  })

  it('inserts after a multi-line replacement, not inside it', () => {
    expect(Micropatch.applyText('1\n2\n3', '◼︎=2|a\nb\nc\n◼︎>2|X')).toBe('1\na\nb\nc\nX\n3')
  })

  it('keeps the written order of several inserts at the same line', () => {
    expect(Micropatch.applyText('a\nb', '◼︎<2|1\n◼︎<2|2\n◼︎>2|3\n◼︎>2|4')).toBe('a\n1\n2\nb\n3\n4')
  })

  it('does not add the blank lines between ops to the file', () => {
    expect(Micropatch.applyText('1\n2\n3', '◼︎=1|A\n\n◼︎=3|C\n\n')).toBe('A\n2\nC')
  })

  it('accepts the marker without its variation selector, and ■', () => {
    expect(Micropatch.applyText('1\n2\n3', '◼=1|A\n■=2|B\n◼︎=3|C')).toBe('A\nB\nC')
    expect(Micropatch.applyText('A\nL2\nL3', '◼=2|B')).toBe('A\nB\nL3')
  })

  it('reports ops that target lines past the end of the file', () => {
    const { text, skipped } = Micropatch.applyWithReport('a\nb', '◼︎=9|X\n◼︎-1-5')
    expect(text).toBe('')
    expect(skipped.map((x) => x.reason)).toEqual(['out_of_range', 'out_of_range'])
  })

  it('does not overwrite part of an earlier range replacement', () => {
    const { text, skipped } = Micropatch.applyWithReport(abcde, '◼︎=2-3|X\n◼︎=3-4|Y')
    expect(text).toBe('a\nX\nd\ne')
    expect(skipped).toHaveLength(1)
  })
})

describe('json-utils robustness', () => {
  it('rejects a repair that turns an object into an array', () => {
    expect(validateOrRepairJson('{"a":1}\n{"b":2}').valid).toBe(false)
    expect(validateOrRepairJson('{"a":1}\n"b": 2\n}').valid).toBe(false)
  })

  it('still repairs small syntax errors', () => {
    const result = validateOrRepairJson('{"a":1,}')
    expect(result.valid && result.data).toEqual({ a: 1 })
  })

  it('unwraps a fenced JSON block', () => {
    const result = validateOrRepairJson('```json\n{"a": 1}\n```')
    expect(result.valid).toBe(true)
    expect(result.valid && result.data).toEqual({ a: 1 })
  })

  it('rejects valid JSON of the wrong top-level kind when a kind is required', () => {
    expect(validateOrRepairJson('[1]', { kind: 'object' }).valid).toBe(false)
    expect(validateOrRepairJson('{"a":1}', { kind: 'object' }).valid).toBe(true)
  })
})

describe('patch robustness', { timeout: 30_000 }, () => {
  const file = { path: 'src/a.ts', name: 'a.ts', content: 'L1\nL2\nL3' }

  it('does not loop forever when a single line is longer than maxTokensPerChunk', async () => {
    const minified = JSON.stringify(Object.fromEntries(Array.from({ length: 400 }, (_, i) => [`key${i}`, i])))
    const { zai, calls } = makeZai(() => '')
    const [out] = await zai.patch([{ path: 'a.json', name: 'a.json', content: minified }], 'noop', {
      maxTokensPerChunk: 50,
    })
    expect(out!.content).toBe(minified)
    expect(calls).toHaveLength(1)
  })

  it('fails clearly when a single line does not fit the model', async () => {
    const { zai, calls } = makeZai(() => '', { input: 3_000, output: 1_000 })
    const content = `short\n${words(3_000)}`
    await expect(zai.patch([{ path: 'a.txt', name: 'a.txt', content }], 'noop')).rejects.toThrow(
      /Line 2 of "a.txt" is \d+ tokens long/
    )
    expect(calls).toHaveLength(0)
  })

  it('rejects maxTokensPerChunk below 1', async () => {
    const { zai } = makeZai(() => '')
    await expect(zai.patch([file], 'noop', { maxTokensPerChunk: 0 })).rejects.toThrow()
  })

  it.each([
    ['invalid op syntax', '<FILE path="src/a.ts">\n◼︎<2-3|x\n</FILE>', /Insert cannot target a range/],
    ['a line past the end of the file', '<FILE path="src/a.ts">\n◼︎=9|x\n</FILE>', /targets line 9/],
    ['a missing </FILE>', '<FILE path="src/a.ts">\n◼︎=1|x\n', /not closed/],
    ['an unknown path', '<FILE path="src/b.ts">\n◼︎=1|x\n</FILE>', /no file with path "src\/b.ts"/],
    ['ops outside of FILE blocks', '◼︎=1|x', /inside <FILE/],
  ])('retries with feedback on %s', async (_name, bad, error) => {
    const { zai, calls } = makeZai((_req, n) => (n === 0 ? bad : '<FILE path="src/a.ts">\n◼︎=2|B\n</FILE>'))
    const [out] = await zai.patch([file], 'change line 2')
    expect(out!.content).toBe('L1\nB\nL3')
    expect(calls).toHaveLength(2)
    expect(isRetry(calls[1]!)).toBe(true)
    expect(lastUser(calls[1]!)).toMatch(error)
  })

  it('fails instead of returning the file unchanged when the patch never applies', async () => {
    const { zai } = makeZai(() => '<FILE path="src/a.ts">\n◼︎=9|x\n</FILE>')
    await expect(zai.patch([file], 'change line 9')).rejects.toThrow(/targets line 9/)
  })

  it('combines two FILE blocks for the same path', async () => {
    const { zai } = makeZai(
      () => '<FILE path="src/a.ts">\n◼︎=1|A\n</FILE>\n<FILE path="src/a.ts">\n◼︎=3|C\n</FILE>'
    )
    const [out] = await zai.patch([file], 'change lines 1 and 3')
    expect(out!.content).toBe('A\nL2\nC')
  })

  it('applies ops written without the variation selector instead of pasting them into the file', async () => {
    const { zai } = makeZai(() => '<FILE path="src/a.ts">\n◼︎=1|A\n◼=2|B\n</FILE>')
    const [out] = await zai.patch([file], 'change lines 1 and 2')
    expect(out!.content).toBe('A\nB\nL3')
  })

  it('ignores a code fence around the ops', async () => {
    const { zai } = makeZai(() => '<FILE path="src/a.ts">\n```\n◼︎=1|A\n```\n</FILE>')
    const [out] = await zai.patch([file], 'change line 1')
    expect(out!.content).toBe('A\nL2\nL3')
  })

  it('applies the multi-line insert of the prompt example', async () => {
    const utils = { path: 'src/utils.ts', name: 'utils.ts', content: 'export function add(a, b) {\n  return a + b\n}' }
    const { zai } = makeZai(() => '<FILE path="src/utils.ts">\n◼︎<1|/**\n * Adds two numbers\n */\n</FILE>')
    const [out] = await zai.patch([utils], 'add a doc comment')
    expect(out!.content).toBe('/**\n * Adds two numbers\n */\nexport function add(a, b) {\n  return a + b\n}')
  })

  it('does not let jsonrepair turn a JSON object file into an array', async () => {
    const json = { path: 'c.json', name: 'c.json', content: '{\n  "a": 1\n}' }
    // The patch closes the object early and adds a second one; the fix-up call then makes it valid again
    const { zai, calls } = makeZai((_req, n) =>
      n === 0
        ? '<FILE path="c.json">\n◼︎=3|}\n{"b": 2}\n</FILE>'
        : '<FILE path="c.json">\n◼︎=3|}\n◼︎-4\n</FILE>'
    )
    const [out] = await zai.patch([json], 'add b')
    expect(JSON.parse(out!.content)).toEqual({ a: 1 })
    expect(calls).toHaveLength(2)
  })
})

describe('answer robustness', { timeout: 30_000 }, () => {
  const lines = Array.from({ length: 12 }, (_, i) => `Fact number ${i + 1}.`)

  it('keeps the last character of the answer (the citation at the end)', async () => {
    const docs = lines
    const { zai } = makeZai(() => '■answer\nThe twelfth fact.■012')
    const result = await zai.answer(docs, 'What is the twelfth fact?')
    expect(result.type).toBe('answer')
    if (result.type !== 'answer') return
    expect(result.answer).toBe('The twelfth fact.')
    expect(result.citations.map((c) => c.item)).toEqual(['Fact number 12.'])
  })

  it('drops what the model writes after ■end■', async () => {
    const { zai } = makeZai(() => '■answer\nFirst.■001\n■end■ trailing junk ■003')
    const result = await zai.answer(lines, 'q?')
    expect(result.type === 'answer' && result.citations.map((c) => c.item)).toEqual(['Fact number 1.'])
  })

  it('removes repeated adjacent citation markers from the answer', () => {
    const result = parseResponse('■answer\nParis is the capital■001■001 of France.', [
      { lineNumber: 1, documentIndex: 0, lineInDocument: 0, text: 'Paris', document: 'doc' },
    ])
    expect(result.type === 'answer' && result.answer).toBe('Paris is the capital of France.')
    expect(result.type === 'answer' && result.citations).toHaveLength(1)
  })

  it('clamps hallucinated citation ranges', () => {
    const start = Date.now()
    const result = parseResponse('■answer\nText■001-999999999', [
      { lineNumber: 1, documentIndex: 0, lineInDocument: 0, text: 'a', document: 'doc' },
    ])
    expect(Date.now() - start).toBeLessThan(500)
    expect(result.type === 'answer' && result.citations).toHaveLength(1)
  })

  it('rejects an ambiguous response with fewer than 2 answers', () => {
    const mapping = [{ lineNumber: 1, documentIndex: 0, lineInDocument: 0, text: 'a', document: 'doc' }]
    expect(() => parseResponse('■ambiguous\nUnclear\n■follow_up\nWhich?', mapping)).toThrow(/at least 2/)
    expect(() => parseResponse('■ambiguous\nUnclear\n■follow_up\nWhich?\n■answer\nA■001', mapping)).toThrow(
      /at least 2/
    )
  })

  it('reads the follow-up question wherever it is', () => {
    const mapping = [
      { lineNumber: 1, documentIndex: 0, lineInDocument: 0, text: 'a', document: 'doc' },
      { lineNumber: 2, documentIndex: 0, lineInDocument: 1, text: 'b', document: 'doc' },
    ]
    const result = parseResponse('■ambiguous\nUnclear\n■answer\nA■001\n■answer\nB■002\n■follow_up\nWhich one?', mapping)
    expect(result.type === 'ambiguous' && result.follow_up).toBe('Which one?')
  })

  // Each document is long enough to take a chunk of its own with chunkLength 250
  const doc = (tag: string) => `${tag} ${words(100, tag.toLowerCase())}`

  it('prefers an ambiguous chunk result over missing knowledge and out of topic', async () => {
    const docs = [doc('MISSING'), doc('AMBIG'), doc('OFFTOPIC')]
    const { zai } = makeZai((req) => {
      const content = firstUser(req)
      if (content.includes('AMBIG')) return '■ambiguous\nTwo meanings\n■follow_up\nWhich?\n■answer\nA■001\n■answer\nB■001'
      if (content.includes('MISSING')) return '■missing_knowledge\nNothing here'
      return '■out_of_topic\nUnrelated'
    })
    const result = await zai.answer(docs, 'q?', { chunkLength: 250 })
    expect(result.type).toBe('ambiguous')
  })

  it('keeps the chunk answers when the merge call does not answer', async () => {
    // Chunks: [ALPHA, NOISE] and [BETA]; the merge call gets the cited documents only: ALPHA and BETA
    const docs = [`ALPHA ${words(20, 'a')}`, `NOISE ${words(35, 'n')}`, `BETA ${words(20, 'b')}`]
    const { zai, calls } = makeZai((req) => {
      const content = firstUser(req)
      if (content.includes('ALPHA') && content.includes('BETA')) return '■missing_knowledge\nCannot merge'
      return content.includes('ALPHA') ? '■answer\nAlpha.■001' : '■answer\nBeta part one.■001 Beta part two.■001'
    })
    const result = await zai.answer(docs, 'q?', { chunkLength: 250 })
    expect(calls.length).toBe(3)
    expect(calls.some((c) => firstUser(c).includes('ALPHA') && firstUser(c).includes('BETA'))).toBe(true)
    expect(result.type).toBe('answer')
  })

  it('splits a document longer than a chunk, and cites the right lines of it', async () => {
    const tokenizer = await getTokenizer()
    const big = Array.from({ length: 300 }, (_, i) => `Line ${i + 1} says ${words(5, `w${i}x`)}`).join('\n')
    const { zai, calls } = makeZai((req) => {
      const content = firstUser(req)
      return content.includes('Line 300 says') ? '■answer\nThe last line.■' + content.match(/■(\d+) \| Line 300 says/)![1] : '■missing_knowledge\nNo'
    })
    const result = await zai.answer([big], 'What does line 300 say?', { chunkLength: 1000 })
    expect(calls.length).toBeGreaterThan(1)
    for (const call of calls) {
      const docs = firstUser(call).split('<documents>')[1]!.split('</documents>')[0]!
      expect(tokenizer.count(docs)).toBeLessThanOrEqual(700)
    }
    expect(result.type).toBe('answer')
    if (result.type !== 'answer') return
    expect(result.citations[0]!.item).toBe(big)
    expect(result.citations[0]!.snippet).toMatch(/^Line 300 says/)
  })

  it('stops the other chunks once one fails', async () => {
    const docs = Array.from({ length: 30 }, (_, i) => doc(i === 0 ? 'FAIL' : `OK${i}`))
    const { zai, calls } = makeZai(async (req) => {
      if (firstUser(req).includes('FAIL')) throw new Error('persistent API failure')
      await new Promise((resolve) => setTimeout(resolve, 50))
      return '■answer\nOk.■001'
    })
    await expect(zai.answer(docs, 'q?', { chunkLength: 250 })).rejects.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 300))
    const okCalls = calls.filter((c) => !firstUser(c).includes('FAIL'))
    expect(okCalls.length).toBeLessThan(29)
  })
})

describe('summarize robustness', { timeout: 30_000 }, () => {
  const summary = (n = 20) => ({ output: `■START■${words(n, 's')}`, stopReason: 'stop' as const })

  it('summarizes a long text with the default options on a small-context model', async () => {
    const { zai, calls } = makeZai(() => summary(), { input: 8_192, output: 4_096 })
    const result = await zai.summarize(words(6_000))
    expect(result.length).toBeGreaterThan(0)
    expect(calls.length).toBeLessThan(20)
  })

  it('fails clearly instead of collapsing the window when the length does not fit a small model', async () => {
    const { zai, calls } = makeZai(() => summary(), { input: 8_192, output: 4_096 })
    await expect(zai.summarize(words(6_000), { length: 1_000 })).rejects.toThrow(/too long to be summarized/)
    expect(calls).toHaveLength(0)
  })

  it.each([
    ['sliding', { strategy: 'sliding' as const, length: 300, sliding: { window: 200 } }],
    ['parallel', { strategy: 'parallel' as const, length: 200, sliding: { window: 500 } }],
  ])('rejects a %s window too small to ever converge', async (_name, options) => {
    const { zai, calls } = makeZai(() => summary(60))
    await expect(zai.summarize(words(3_000), options)).rejects.toThrow(/too long to be summarized/)
    expect(calls).toHaveLength(0)
  })

  it.each(['parallel', 'sliding'] as const)(
    'stops (%s) when the summaries are never shorter than the text',
    async (strategy) => {
      // A model that ignores the length and always writes a summary about as long as a window
      const { zai, calls } = makeZai(() => summary(1_500))
      await expect(
        zai.summarize(words(20_000), { strategy, length: 100, sliding: { window: 2_000, overlap: 100 } })
      ).rejects.toThrow(/did not converge/)
      expect(calls.length).toBeLessThan(200)
    }
  )

  it('sends at most `window` tokens of text per sliding call', async () => {
    const tokenizer = await getTokenizer()
    const { zai, calls } = makeZai(() => summary())
    const text = words(1_500)
    expect(tokenizer.count(text)).toBeGreaterThan(2_000)
    await zai.summarize(text, { strategy: 'sliding', length: 100, sliding: { window: 1_000, overlap: 200 } })
    expect(calls.length).toBeGreaterThan(1)
    for (const call of calls) {
      const content = firstUser(call)
      const newText = content.split('<|start_new_information|>\n')[1]?.split('\n<|new_information|>')[0]
      if (newText === undefined) continue // a merge step
      expect(tokenizer.count(newText)).toBeLessThanOrEqual(1_000)
    }
  })
})
