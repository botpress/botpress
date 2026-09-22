import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'

import { Exit, ThinkSignal, Tool, execute } from '../src/index.js'
import { getCachedCognitiveClient } from './__tests__/index.js'

const client = getCachedCognitiveClient()
const options = { loop: 3, timeout: 45_000 }
const done = new Exit({
  name: 'done',
  description: 'Answer using the retrieved stock and collection instructions.',
  schema: z.object({ stock: z.number(), collection: z.string() }),
})

// Real model calls use the existing request cache. Business tools only read
// fixed local data. No retries: a repeated successful search is the regression.
describe('ThinkSignal forced inspection', { retry: 0, timeout: 60_000 }, () => {
  it.each(['thrown', 'returned'] as const)(
    'uses a %s successful search result without searching again',
    async (delivery) => {
      let searches = 0
      const search = new Tool({
        name: 'search',
        description: 'Find banana stock and collection instructions.',
        input: z.object({ query: z.string() }),
        output: z.object({ stock: z.number(), collection: z.string() }),
        handler: async () => {
          searches++
          const signal = new ThinkSignal('Review the collection instructions before answering.', {
            stock: 4,
            collection: 'Dock 7',
          })
          if (delivery === 'thrown') throw signal
          return signal
        },
      })
      const result = await execute({
        client,
        model: ['openai:gpt-5.6-luna'],
        temperature: 0,
        reasoningEffort: 'none',
        options,
        tools: [search],
        exits: [done],
        instructions:
          'Find how many bananas are in stock and where I can collect them. Search for bananas, inspect the result, then answer through done.',
      })

      expect.soft(result.is(done)).toBe(true)
      expect.soft(result.output).toEqual({ stock: 4, collection: 'Dock 7' })
      expect.soft(searches).toBe(1)
      expect.soft(result.iterations).toHaveLength(2)
      expect.soft(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
      expect.soft(result.iterations[0]?.status.type).toBe('thinking_requested')
      const report = result.session.messages.find((message) => message.type === 'tool_result')
      expect.soft(String(report?.content)).toMatch(/forced inspection/i)
      expect.soft(String(report?.content)).not.toContain('interrupted; pending')
      const section = String(report?.content).match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0] ?? ''
      const entry = section.match(/<tool name="search" line="\d+">[\s\S]*?<\/tool>/)?.[0] ?? ''
      expect.soft(entry).toContain('<reason>Review the collection instructions before answering.</reason>')
      expect.soft(entry).toContain('"stock": 4')
      expect.soft(entry).toContain('"collection": "Dock 7"')
    }
  )

  it.each([
    { ending: 'premature exit', code: 'return exit("done", { stock: 0, collection: "unknown" });' },
    { ending: 'later code error', code: 'throw new Error("later calculation failed");' },
  ])('reviews both parallel search results after a $ending without repeating either search', async ({ code }) => {
    const calls: string[] = []
    const searchStock = new Tool({
      name: 'searchStock',
      description: 'Read banana stock.',
      output: z.object({ stock: z.number() }),
      handler: async () => {
        calls.push('stock')
        throw new ThinkSignal('Review the available stock.', { stock: 4 })
      },
    })
    const searchCollection = new Tool({
      name: 'searchCollection',
      description: 'Read collection instructions.',
      output: z.object({ collection: z.string() }),
      handler: async () => {
        calls.push('collection')
        return new ThinkSignal('Review the collection instructions.', { collection: 'Dock 7' })
      },
    })
    const exitPayloads: unknown[] = []
    const result = await execute({
      client,
      model: ['openai:gpt-5.6-luna'],
      temperature: 0,
      reasoningEffort: 'none',
      options,
      tools: [searchStock, searchCollection],
      exits: [done],
      onExit: ({ result }) => {
        exitPayloads.push(result)
      },
      instructions: [
        'This fixture tests forced inspection when code tries to finish too early or fails after successful searches.',
        'For your first response, run this exact JavaScript:',
        `const results = await Promise.all([searchStock(), searchCollection()]); ${code}`,
        'After receiving the execution report, answer with the actual stock and collection through done.',
      ].join('\n'),
    })

    expect.soft(result.is(done)).toBe(true)
    expect.soft(result.output).toEqual({ stock: 4, collection: 'Dock 7' })
    expect.soft(calls.slice().sort()).toEqual(['collection', 'stock'])
    expect.soft(result.iterations).toHaveLength(2)
    expect.soft(exitPayloads).toEqual([{ stock: 4, collection: 'Dock 7' }])
    expect.soft(result.iterations[0]?.code).toContain('Promise.all')
    expect.soft(result.iterations[0]?.code).toContain(code)
    expect.soft(result.session.memory.variables.results).toEqual([{ stock: 4 }, { collection: 'Dock 7' }])
    expect.soft(result.iterations[0]?.status.type).toBe('thinking_requested')
    const report = String(result.session.messages.find((message) => message.type === 'tool_result')?.content)
    expect.soft(report).toMatch(/forced inspection/i)
    expect.soft(report).toContain('Review the available stock.')
    expect.soft(report).toContain('Review the collection instructions.')
    const section = report.match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0] ?? ''
    const stockEntry = section.match(/<tool name="searchStock" line="1">[\s\S]*?<\/tool>/)?.[0] ?? ''
    const collectionEntry = section.match(/<tool name="searchCollection" line="1">[\s\S]*?<\/tool>/)?.[0] ?? ''
    expect.soft(stockEntry).toContain('<reason>Review the available stock.</reason>')
    expect.soft(stockEntry).toContain('"stock": 4')
    expect.soft(collectionEntry).toContain('<reason>Review the collection instructions.</reason>')
    expect.soft(collectionEntry).toContain('"collection": "Dock 7"')
    if (code.includes('later calculation failed')) {
      expect.soft(report).toContain('later calculation failed')
      expect
        .soft(result.iterations[0]?.errors.some((error) => error.message.includes('later calculation failed')))
        .toBe(true)
    }
  })
})
