import type { Models } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { Chat, DefaultComponents, Example, ListenExit, Tool, execute, type ExecutionResult } from '../src/index.js'
import { cases, client, expectAcceptedProtocol, metrics, models, withExamples } from './__tests__/model-evaluation.js'

// Desired behavior comes from examples, not duplicated task instructions.
// The same assertions are retained when LLMZ_EVAL_EXAMPLES=0 for ablation runs.
const capitals = new Example({
  situation: 'Answering a geography question. The user asks for the capital of Italy.',
  messages: [{ component: 'message', body: 'THE CAPITAL OF ITALY IS ROME.' }],
  exit: 'listen',
  reason: 'Short labels make this answer easy to scan.',
})
const announcement = (situation: string) =>
  new Example({
    situation,
    messages: [{ component: 'message', body: 'Checking the documentation.' }],
    code: 'return await searchKnowledge({ query: "change account email" })',
  })
const batchExamples = [
  new Example({
    situation: 'The user asks to compare Paris and Berlin quotas in standard mode.',
    code: 'return await Promise.all([readQuota({ region: "Paris" }), readQuota({ region: "Berlin" })])',
  }),
  new Example({
    situation: 'The user asks to compare Paris and Berlin quotas in audit mode.',
    code: 'const first = await readQuota({ region: "Paris" }); const second = await readQuota({ region: "Berlin" }); return [first, second]',
    reason: 'Audit mode keeps each regional check separate so its completion can be observed before the next begins.',
  }),
]

const assertProtocol = (result: ExecutionResult) => {
  expect(result.isSuccess()).toBe(true)
  expectAcceptedProtocol(result)
}

describe.skipIf(!models.length).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'example adherence: $model, run $run',
  ({ model, run }) => {
    const record = (scenario: string, result: ExecutionResult, observations: Record<string, unknown>) => {
      console.info(
        JSON.stringify({
          suite: 'example-adherence',
          model,
          run,
          scenario,
          withExamples,
          success: result.isSuccess(),
          ...metrics(result),
          ...observations,
        })
      )
    }

    it.each([
      { scenario: 'all-caps-from-example', scoped: true, override: false, caps: true, explicitReason: false },
      { scenario: 'all-caps-with-reason', scoped: true, override: false, caps: true, explicitReason: true },
      { scenario: 'unrelated-caps-example', scoped: false, override: false, caps: false, explicitReason: false },
      { scenario: 'instructions-override-caps', scoped: true, override: true, caps: false, explicitReason: false },
    ])(
      '$scenario',
      async ({ scenario, scoped, override, caps, explicitReason }) => {
        const sent: string[] = []
        const example = scoped
          ? explicitReason
            ? new Example({
                situation: capitals.situation,
                messages: [{ component: 'message', body: 'THE CAPITAL OF ITALY IS ROME.' }],
                exit: ListenExit,
                reason: 'We keep geography answers in uppercase so they read as short labels.',
              })
            : capitals
          : new Example({
              situation: 'Announcing an emergency drill when the user explicitly asks for a drill announcement.',
              messages: [{ component: 'message', body: 'THIS IS A DRILL. FOLLOW THE MARKED EXIT ROUTE.' }],
              exit: ListenExit,
            })
        const result = await execute({
          client,
          model: model as Models,
          instructions: `Answer the user's question in one short sentence.${override ? ' Use normal sentence casing, not all caps.' : ''}`,
          examples: withExamples ? [example] : [],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [{ role: 'user', name: 'user', content: 'What is the capital of Portugal?' }],
            handler: async (message) => {
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: 3 },
        })
        record(scenario, result, { messages: sent })
        assertProtocol(result)
        expect(sent).toHaveLength(1)
        const text = sent[0]!
        expect(text).toMatch(/Lisbon|Lisboa/i)
        expect(text).not.toMatch(/\b(?:Rome|Italy|drill)\b|exit route|short labels|easy to scan/i)
        if (caps) expect(text).toBe(text.toUpperCase())
        else expect(text).toMatch(/[a-z]/)
      },
      120_000
    )

    it.each([
      { scenario: 'announced-search-from-example', scoped: true, override: 'none', loud: true },
      { scenario: 'unrelated-announcement-example', scoped: false, override: 'none', loud: false },
      { scenario: 'instructions-override-announcement', scoped: true, override: 'instructions', loud: false },
      { scenario: 'user-override-announcement', scoped: true, override: 'user', loud: false },
    ])(
      '$scenario',
      async ({ scenario, scoped, override, loud }) => {
        const sent: string[] = []
        const events: string[] = []
        const queries: string[] = []
        const tool = new Tool({
          name: 'searchKnowledge',
          description: 'Finds product documentation for the query.',
          input: z.object({ query: z.string() }),
          output: z.array(z.string()),
          handler: async ({ query }) => {
            events.push('search')
            queries.push(query)
            return ['Open Settings, choose Export, then select Download archive.']
          },
        })
        const example = announcement(
          scoped
            ? 'Before answering a product documentation question, such as how to change an account email.'
            : 'Only when the user explicitly requests a narrated demonstration of how the knowledge search works.'
        )
        const quiet = 'Search silently. Do not send any message until the answer is ready.'
        const result = await execute({
          client,
          model: model as Models,
          instructions: `Answer product questions using the knowledge base. ${override === 'instructions' ? quiet : ''}`,
          examples: withExamples ? [example] : [],
          tools: [tool],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [
              {
                role: 'user',
                name: 'user',
                content: `How do I export an archive? ${override === 'user' ? quiet : ''}`,
              },
            ],
            handler: async (message) => {
              events.push('send')
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: 4 },
        })
        record(scenario, result, { messages: sent, events, queries })
        assertProtocol(result)
        expect(events).toEqual(loud ? ['send', 'search', 'send'] : ['search', 'send'])
        if (loud) expect(sent[0]).toMatch(/check|search|look|documentation/i)
        expect(sent.at(-1)).toMatch(/Download archive/i)
        expect(queries).toHaveLength(1)
        expect(queries[0]).toMatch(/export|archive/i)
        expect(queries[0]).not.toMatch(/email/i)
        expect(sent.join(' ')).not.toMatch(/email|example|situation/i)
      },
      120_000
    )

    it.each([
      { scenario: 'standard-mode-batches', mode: 'standard', override: false, parallel: true },
      { scenario: 'audit-mode-sequential', mode: 'audit', override: false, parallel: false },
      { scenario: 'instructions-override-batching', mode: 'standard', override: true, parallel: false },
    ])(
      '$scenario',
      async ({ scenario, mode, override, parallel }) => {
        let active = 0
        let peakActive = 0
        const calls: string[] = []
        const events: string[] = []
        const sent: string[] = []
        const readQuota = new Tool({
          name: 'readQuota',
          description: 'Returns the current quota for one region.',
          input: z.object({ region: z.string() }),
          output: z.object({ region: z.string(), quota: z.number() }),
          handler: async ({ region }) => {
            calls.push(region)
            events.push(`start:${region}`)
            peakActive = Math.max(peakActive, ++active)
            try {
              await new Promise((resolve) => setTimeout(resolve, 50))
              return { region, quota: region.toLowerCase() === 'oslo' ? 13 : 21 }
            } finally {
              active--
              events.push(`end:${region}`)
            }
          },
        })
        const result = await execute({
          client,
          model: model as Models,
          instructions: `Compare the requested regions using their current quotas.${override ? ' Run the regional checks one at a time, waiting for each to complete before starting the next.' : ''}`,
          examples: withExamples ? batchExamples : [],
          tools: [readQuota],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [{ role: 'user', name: 'user', content: `Compare Oslo and Kyoto quotas in ${mode} mode.` }],
            handler: async (message) => {
              events.push('send')
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: 4 },
        })
        record(scenario, result, { messages: sent, calls, events, peakActive })
        assertProtocol(result)
        expect(calls.map((value) => value.toLowerCase()).sort()).toEqual(['kyoto', 'oslo'])
        expect(peakActive).toBe(parallel ? 2 : 1)
        expect(events.slice(-1)).toEqual(['send'])
        expect(events.indexOf('send')).toBe(4)
        expect(sent).toHaveLength(1)
        expect(sent[0]).toMatch(/\b13\b/)
        expect(sent[0]).toMatch(/\b21\b/)
        expect(sent[0]).not.toMatch(/\b(?:Paris|Berlin)\b/i)
        expect(sent[0]).not.toContain(batchExamples[1]!.reason!)
      },
      120_000
    )

    it('dependent-call-uses-actual-result', async () => {
      const events: string[] = []
      const sent: string[] = []
      const receivedIds: string[] = []
      let resolved = false
      const lookupCustomer = new Tool({
        name: 'lookupCustomer',
        input: z.object({ name: z.string() }),
        output: z.object({ id: z.string() }),
        handler: async ({ name }) => {
          events.push(`lookup:${name}`)
          await new Promise((resolve) => setTimeout(resolve, 50))
          resolved = true
          return { id: 'actual-customer-137' }
        },
      })
      const readBalance = new Tool({
        name: 'readBalance',
        input: z.object({ customerId: z.string() }),
        output: z.number(),
        handler: async ({ customerId }) => {
          receivedIds.push(customerId)
          events.push(resolved ? 'balance' : 'premature-balance')
          return 37
        },
      })
      const example = new Example({
        situation: "The user asks for Noah's balance. Only the name is known; the customer ID must be looked up.",
        code: 'const customer = await lookupCustomer({ name: "Noah" }); return await readBalance({ customerId: customer.id })',
      })
      const result = await execute({
        client,
        model: model as Models,
        instructions: 'Answer account questions using the available tools.',
        examples: withExamples ? [example] : [],
        tools: [lookupCustomer, readBalance],
        chat: new Chat({
          components: [DefaultComponents.Text],
          transcript: [{ role: 'user', name: 'user', content: 'What is the balance for Ari?' }],
          handler: async (message) => {
            events.push('send')
            sent.push(message.children.join(''))
          },
        }),
        options: { loop: 4 },
      })
      record('dependent-call-uses-actual-result', result, { messages: sent, events, receivedIds })
      assertProtocol(result)
      expect(events).toEqual(['lookup:Ari', 'balance', 'send'])
      expect(receivedIds).toEqual(['actual-customer-137'])
      expect(sent[0]).toMatch(/\b37\b/)
      expect(sent.join(' ')).not.toMatch(/\b(?:Noah|Paris|Berlin)\b/i)
    }, 120_000)
  },
  { retry: 0 }
)
