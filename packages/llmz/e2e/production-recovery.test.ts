import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { Exit, ListenExit, Session, Tool, execute } from '../src/index.js'
import { nativeDemonstrationHook } from './__tests__/native-demonstrations.js'
import {
  expectCleanDelivery,
  expectProductionRun,
  productionChat,
  productionModels,
  productionOptions,
  textOf,
} from './__tests__/production.js'

// Fault injection is explicit: only the first assistant tool call is seeded.
// LLMz builds its real error report; the actual provider must recover from it.
// The first three bad programs come from qwen-failed-turns.zip (Sep 23, 2026).
// Do not add corrective JavaScript to task instructions: recovery is the library's job.
describe.each(productionModels)('production recovery: %s', (model) => {
  const settings = {
    model: [model],
    temperature: 0.7,
    reasoningEffort: 'none' as const,
    options: productionOptions,
    onBeforeRequest: nativeDemonstrationHook,
  }

  describe('repair a failed lookup', { retry: 0, timeout: 60_000 }, () => {
    it.each([
      {
        name: 'search terms submitted as JavaScript',
        code: 'participate in a kidney walk',
        error: 'invalid_code_error',
      },
      { name: 'a bare identifier submitted as JavaScript', code: 'Food', error: 'execution_error' },
      { name: 'an unquoted strict directive', code: 'use strict', error: 'invalid_code_error' },
      {
        name: 'an object passed to a string parameter',
        code: 'const result = await search_knowledge({ query: "kidney walk" }); return inspect(result);',
        error: 'execution_error',
      },
      {
        name: 'a nonexistent business tool',
        code: 'const result = await searchKnowledge("kidney walk"); return inspect(result);',
        error: 'execution_error',
      },
    ])('recovers from $name without another failed program', async ({ code, error }) => {
      const fixture = productionChat(code)
      const session = new Session()
      session.append({ role: 'user', content: 'How do i participate in a kidney walk?' })
      const queries: string[] = []
      const result = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        instructions:
          'You help people find community events. Answer only from the knowledge search results and include the exact registration link. Do not expose internal errors or tool details to the customer.',
        tools: [
          new Tool({
            name: 'search_knowledge',
            description: 'Search event information. Accepts the query string itself.',
            input: z.string(),
            output: z.string(),
            handler: async (query) => {
              queries.push(query)
              return 'The next Kidney Walk starts at Pier 23 at 09:40. Register at https://events.example.test/walk/register?city=north&year=2026. Registration is free.'
            },
          }),
        ],
      })
      expectProductionRun(result, fixture.client, model)
      // Prove we exercised the intended fault and that later responses came from the provider.
      expect.soft(result.iterations[0]?.code).toBe(code)
      expect.soft(result.iterations[0]?.status.type).toBe(error)
      expect
        .soft(
          fixture.client.requests[1]?.messages.some(
            (message) => message.type === 'tool_result' && String(message.content).includes('<recovery>')
          )
        )
        .toBe(true)
      expect.soft(result.iterations.slice(1).flatMap((iteration) => iteration.errors)).toEqual([])
      expect.soft(result.is(ListenExit)).toBe(true)
      expect.soft(queries).toHaveLength(1)
      expect.soft(queries[0] ?? '').toMatch(/kidney|walk/i)
      expect.soft(textOf(fixture.messages)).toContain('https://events.example.test/walk/register?city=north&year=2026')
      expect.soft(textOf(fixture.messages)).toMatch(/Pier\s+23/i)
      expectCleanDelivery(fixture.messages, fixture.deltas)
    })
  })

  it(
    'retains a successful order after a later code error without placing it twice',
    { retry: 0, timeout: 60_000 },
    async () => {
      const firstCode =
        'const order = await place_order({ sku: "KIT-9", quantity: 1 }); throw new Error("receipt formatting failed");'
      const fixture = productionChat(firstCode)
      const session = new Session()
      session.append({ role: 'user', content: 'Order one KIT-9 and give me the order number. I confirm the purchase.' })
      const orders: unknown[] = []
      const result = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        instructions:
          'You are an order assistant. The customer authorized one purchase. Place the requested order and tell the customer its order number and total. Never place a second order for the same purchase.',
        tools: [
          new Tool({
            name: 'place_order',
            description: 'Create a new order. Each successful call creates and charges a separate purchase.',
            input: z.object({ sku: z.literal('KIT-9'), quantity: z.literal(1) }),
            output: z.object({ orderId: z.string(), total: z.number() }),
            handler: async (input) => {
              orders.push(input)
              return { orderId: `ORDER-${740 + orders.length}`, total: 83.27 }
            },
          }),
        ],
      })
      expectProductionRun(result, fixture.client, model)
      expect.soft(result.iterations[0]?.status.type).toBe('execution_error')
      expect.soft(orders).toEqual([{ sku: 'KIT-9', quantity: 1 }])
      expect.soft(result.session.memory.variables.order).toEqual({ orderId: 'ORDER-741', total: 83.27 })
      expect.soft(result.is(ListenExit)).toBe(true)
      expect.soft(textOf(fixture.messages)).toContain('ORDER-741')
      expect.soft(textOf(fixture.messages)).toContain('83.27')
      expect.soft(result.iterations.slice(1).flatMap((iteration) => iteration.errors)).toEqual([])
      expectCleanDelivery(fixture.messages, fixture.deltas)
    }
  )

  it(
    'recovers a worker exit instead of repeating a bare playbook identifier',
    { retry: 0, timeout: 60_000 },
    async () => {
      // containers-02 emitted bare playbook identifiers; this also checks the text-forbidden worker path.
      const fixture = productionChat('container-recommendation')
      const done = new Exit({
        name: 'done',
        description: 'Return the selected procedure and why it applies.',
        schema: z.object({
          playbook: z.enum(['container-recommendation', 'purchasing-inquiry']),
          reason: z.string().min(1),
        }),
      })
      const result = await execute({
        ...settings,
        client: fixture.client,
        exits: [done],
        instructions: [
          'Classify this customer request: "Which container size do I need for storing furniture?"',
          'Available procedures: container-recommendation for selecting a size; purchasing-inquiry for buying a chosen container.',
          'Return the matching procedure and the reason for selecting it.',
        ].join('\n'),
      })
      expectProductionRun(result, fixture.client, model)
      expect.soft(result.iterations[0]?.code).toBe('container-recommendation')
      expect.soft(result.iterations[0]?.status.type).toBe('execution_error')
      expect.soft(result.is(done)).toBe(true)
      expect.soft(result.output).toEqual({ playbook: 'container-recommendation', reason: expect.any(String) })
      expect.soft(result.iterations.slice(1).flatMap((iteration) => iteration.errors)).toEqual([])
      expect.soft(result.iterations.every((iteration) => !iteration.llm?.output.trim())).toBe(true)
    }
  )
})
