import { check } from '@botpress/vai'
import { describe, it, expect, vi } from 'vitest'

import { Zai } from '../src'
import { BotpressDocumentation, getZai, tokenizer } from './utils'

describe('zai.summarize', () => {
  const zai = getZai()

  it('summarize long document to a concise 2000 token summary', async () => {
    let progress: number = 0

    const result = await zai
      .summarize(BotpressDocumentation, {
        length: 2000,
        prompt: `Extract the Table of Contents for the Botpress Documentation. Start with a short sentence explaining what Botpress is. Pay special attention to all the different features. Focus on horizontal coverage of features rather than going in depth into one feature. The goal is to have a complete overview of what the documentation covers.`,
      })
      .on('progress', () => (progress = progress + 1))

    // The documentation fits the model's input context, so it is summarized in one call
    expect(progress).toBeGreaterThanOrEqual(1)
    check(result, 'The text is a summary of the Botpress documentation').toBe(true)
    check(result, 'The text explains shortly what botpress is').toBe(true)
    check(result, 'The text uses markdown format').toBe(true)
    check(result, 'The text has some information about integrations').toBe(true)
    check(result, 'The text has a section about Flows (or Workflows)').toBe(true)
    check(result, 'The text has a section about the Botpress API').toBe(true)
    check(result, 'The text mentions the notion of workspaces').toBe(true)
    check(result, 'The text has some information about the Webchat').toBe(true)
    check(result, 'The text has some information about HITL (human in the loop)').toBe(true)
  })

  // Each heading of the documentation gets a citation marker like 【BP001】
  const withMarkers = () => {
    let n = 0
    const markers = new Set<string>()
    const text = BotpressDocumentation.split('\n')
      .map((line) => {
        if (!line.startsWith('#')) return line
        const marker = `【BP${String(++n).padStart(3, '0')}】`
        markers.add(marker)
        return `${line} ${marker}`
      })
      .join('\n')
    return { text, markers }
  }

  const citationPrompt =
    'An overview of the features the Botpress documentation covers. After each statement, keep the citation markers (like 【BP001】) of the sections it comes from, exactly as written.'

  it('summarizes parts in parallel and keeps the citation markers through the merge', async () => {
    const { text, markers } = withMarkers()

    const result = await zai.summarize(text, {
      length: 1500,
      prompt: citationPrompt,
      sliding: { window: 60_000 },
    })

    const cited = result.match(/【BP\d{3}】/g) ?? []
    expect(cited.length).toBeGreaterThanOrEqual(10)
    expect(cited.filter((marker) => !markers.has(marker))).toEqual([])
    check(result, 'The text is a summary of the Botpress documentation').toBe(true)
  })

  it('summarizes window after window with the sliding strategy', async () => {
    const { text, markers } = withMarkers()
    const part = tokenizer.truncate(text, 50_000)

    const result = await zai.summarize(part, {
      length: 800,
      prompt: citationPrompt,
      strategy: 'sliding',
      sliding: { window: 20_000, overlap: 250 },
    })

    const cited = result.match(/【BP\d{3}】/g) ?? []
    expect(cited.length).toBeGreaterThanOrEqual(3)
    expect(cited.filter((marker) => !markers.has(marker))).toEqual([])
    check(result, 'The text is a summary of part of the Botpress documentation').toBe(true)
  })
})

describe('zai.summarize output budget', { timeout: 30_000 }, () => {
  type Call = { systemPrompt: string; maxTokens: number }

  // A model with an 8k output limit; `reply` decides each call's output and stop reason
  const fakeModel = (reply: (call: Call, index: number) => { output: string; stopReason: 'stop' | 'max_tokens' }) => {
    const calls: Call[] = []
    const mock: any = {
      $$IS_COGNITIVE_BETA: 'v2',
      clone: () => mock,
      on: vi.fn(() => () => {}),
      getModelDetails: vi.fn(async () => ({
        name: 'fake',
        input: { maxTokens: 100_000 },
        output: { maxTokens: 8_192 },
      })),
      generateText: vi.fn(async (input: { systemPrompt: string; maxTokens: number }) => {
        const call = { systemPrompt: input.systemPrompt, maxTokens: input.maxTokens }
        calls.push(call)
        const { output, stopReason } = reply(call, calls.length - 1)
        return {
          output,
          metadata: {
            provider: 'fake',
            model: 'fake',
            usage: { inputTokens: 10, inputCost: 0, outputTokens: 10, outputCost: 0 },
            cost: 0,
            latency: 1,
            stopReason,
          },
        }
      }),
    }
    return { zai: new Zai({ client: mock }), calls }
  }

  const text = () => tokenizer.truncate(BotpressDocumentation, 60_000)
  const isMerge = (call: Call) => call.systemPrompt.startsWith('You are merging')

  it('gives every call, the merge included, headroom above the length it asks for', async () => {
    const { zai, calls } = fakeModel(() => ({ output: '■START■A complete summary.', stopReason: 'stop' }))

    const result = await zai.summarize(text(), { length: 2_500, sliding: { window: 20_000, overlap: 250 } })

    expect(result).toBe('A complete summary.')
    const merge = calls.find(isMerge)!
    expect(merge).toBeDefined()
    expect(merge.maxTokens).toBeGreaterThan(2_500)
    expect(calls.every((call) => call.maxTokens <= 8_192 - 512)).toBe(true)
  })

  it('makes a call that ran out of output tokens again, shorter and with a larger budget', async () => {
    const { zai, calls } = fakeModel((call) =>
      isMerge(call) && !call.systemPrompt.includes('was cut off')
        ? { output: '■START■## Summary\n- **Cr', stopReason: 'max_tokens' }
        : { output: '■START■A complete summary.', stopReason: 'stop' }
    )

    const result = await zai.summarize(text(), { length: 2_500, sliding: { window: 20_000, overlap: 250 } })

    expect(result).toBe('A complete summary.')
    const merges = calls.filter(isMerge)
    expect(merges).toHaveLength(2)
    expect(merges[1].maxTokens).toBeGreaterThan(merges[0].maxTokens)
    expect(merges[1].systemPrompt).toContain('was cut off')
  })

  it('fails instead of returning a cut-off summary', async () => {
    const { zai } = fakeModel(() => ({ output: '■START■## Summary\n- **Cr', stopReason: 'max_tokens' }))

    await expect(zai.summarize('A short text to summarize.', { length: 500 })).rejects.toThrow(
      /ran out of output tokens/
    )
  })
})
