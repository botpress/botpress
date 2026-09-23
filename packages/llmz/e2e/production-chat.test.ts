import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { Component, Exit, ListenExit, Session, ThinkSignal, Tool, execute } from '../src/index.js'
import { createTestChat } from './__tests__/chat.js'
import { nativeDemonstrationHook } from './__tests__/native-demonstrations.js'
import { productionTest } from './__tests__/quarantine.js'
import {
  expectCleanDelivery,
  expectProductionRun,
  productionChat,
  productionModels,
  productionOptions,
  textOf,
} from './__tests__/production.js'

// Distilled from the Sep 23 production dump: real user utterances and routing shapes,
// with synthetic business data. No prescribed JavaScript, model-answer mocks, or grading LLM.
// A four-response budget exposes costly loops instead of allowing ten identical retries.
describe.each(productionModels)('production chat: %s', (model) => {
  const settings = {
    model: [model],
    temperature: 0.7,
    reasoningEffort: 'none' as const,
    options: productionOptions,
    onBeforeRequest: nativeDemonstrationHook,
  }

  describe('playbook routing', { retry: 0, timeout: 60_000 }, () => {
    it.each([
      {
        scenario: 'NKF program question',
        user: 'How do i participate in a kidney walk?',
        id: 'cited-answering',
        title: 'Cited Answering',
        trigger: 'Questions about nonprofit programs, including Kidney Walk participation.',
      },
      {
        scenario: 'container recommendation',
        user: 'I need a container for storing furniture outdoors. Which size should I get?',
        id: 'container-recommendation',
        title: 'Find Your Container',
        trigger: 'Questions about selecting a shipping container for a particular use.',
      },
      {
        scenario: 'human handoff',
        user: 'I need to speak with a person about my order.',
        id: 'system-escalation',
        title: 'Talk to Support',
        trigger: 'An explicit request to speak with a human about an order.',
      },
      {
        scenario: 'Arabic booking',
        user: 'أريد حجز موعد لتنظيف البشرة',
        id: 'appointment-booking',
        title: 'إدارة الحجوزات',
        trigger: 'The user wants to book an appointment, in any language.',
      },
      {
        scenario: 'Indonesian ordering',
        user: 'Bagaimana saya dapat memesan?',
        id: 'shopping-and-orders',
        title: 'Shopping and Orders',
        trigger: 'The user asks how to place an order, in any language.',
      },
    ])('starts the correct playbook for $scenario', async ({ user, id, title, trigger }) => {
      const fixture = productionChat()
      const session = new Session()
      session.append({ role: 'user', content: user })
      const started: unknown[] = []
      const start = new Exit({
        name: 'playbook_start',
        description: `Start one available playbook. Identifier: ${id}; Title: ${title}; Use when: ${trigger}\nIdentifier: account-access; Title: Account Access; Use when: the user cannot sign in.`,
        schema: z.object({
          playbook: z.enum([id, 'account-access']).describe('Exact playbook identifier, not its title.'),
          reason: z.string().min(1),
        }),
      })
      const searches: string[] = []
      const result = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        exits: [start],
        tools: [
          new Tool({
            name: 'search_knowledge',
            description: 'Search support knowledge when no playbook applies.',
            input: z.string(),
            output: z.string(),
            handler: async (query) => {
              searches.push(query)
              return 'No matching information.'
            },
          }),
        ],
        instructions: [
          'You are a customer support assistant. Reply in the user’s language.',
          'Playbooks are procedures. When a trigger matches, start that playbook before answering or searching.',
          `{{label:${title},id:${id},type:playbook}} — Trigger: ${trigger}`,
          '{{label:Account Access,id:account-access,type:playbook}} — Trigger: The user cannot sign in.',
          'Transitions are internal actions. Do not announce them or expose internal identifiers to the user.',
          'If no trigger matches, answer normally. Never invent business details.',
        ].join('\n'),
        onExit: ({ result }) => {
          started.push(result)
        },
      })
      expectProductionRun(result, fixture.client, model)
      expect.soft(result.is(start)).toBe(true)
      expect.soft(result.output).toEqual({ playbook: id, reason: expect.any(String) })
      expect.soft(started).toHaveLength(1)
      expect.soft(searches).toEqual([])
      expect.soft(fixture.messages).toEqual([])
      expect.soft(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
      expectCleanDelivery(fixture.messages, fixture.deltas)
    })
  })

  describe('grounded replies', { retry: 0, timeout: 60_000 }, () => {
    for (const { user, topic, label, forced, scenario } of [
      {
        user: 'Food',
        topic: /food|product|catalog|stock/i,
        label: 'short category',
        forced: false,
        scenario: 'catalog-food',
      },
      { user: 'Tomatoes', topic: /tomato/i, label: 'bare product name', forced: true, scenario: 'catalog-tomatoes' },
      {
        user: 'Do you have the "Chef’s box"? What does it cost?',
        topic: /chef|box/i,
        label: 'quotes in a query',
        forced: false,
        scenario: 'catalog-quotes',
      },
    ]) {
      productionTest(model, scenario, `searches a '${label}' and answers from the result`, async () => {
        const fixture = productionChat()
        const session = new Session()
        session.append({ role: 'user', content: user })
        const queries: string[] = []
        const result = await execute({
          ...settings,
          client: fixture.client,
          chat: fixture.chat,
          session,
          instructions: [
            'You are a grocery shop assistant. For category, product, price or availability inquiries, search the catalog.',
            'A single category or product word is a request to see matching products, not a greeting.',
            'Use only the current search results. Include the price and the exact product link in your answer.',
            'Keep lookups silent. Speak naturally to the customer; do not show internal transport objects.',
          ].join('\n'),
          tools: [
            new Tool({
              name: 'search_knowledge',
              description: 'Search the catalog. Pass the search query as a string.',
              input: z.string(),
              output: z.string(),
              handler: async (query) => {
                queries.push(query)
                const output =
                  'Available: Chef’s tomato box. Price: $17.43. Product link: https://shop.example.test/p/box-7?ref=chat&lang=en'
                if (forced) throw new ThinkSignal('Use these catalog results to answer the customer.', output)
                return output
              },
            }),
          ],
        })
        expectProductionRun(result, fixture.client, model)
        expect.soft(result.is(ListenExit)).toBe(true)
        expect.soft(queries).toHaveLength(1)
        expect.soft(queries[0] ?? '').toMatch(topic)
        expect.soft(textOf(fixture.messages)).toContain('17.43')
        expect.soft(textOf(fixture.messages)).toContain('https://shop.example.test/p/box-7?ref=chat&lang=en')
        expect.soft(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
        expectCleanDelivery(fixture.messages, fixture.deltas)
      })
    }

    it('answers a known FAQ without executing the answer as code or leaking a message envelope', async () => {
      const fixture = productionChat()
      const session = new Session()
      session.append({ role: 'user', content: 'How much is the training kit?' })
      const result = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        instructions:
          'You assist equipment buyers. FAQ: The training kit costs $1,128 and includes three practice modules. Answer the user’s question using this FAQ. No lookup or other action is needed.',
      })
      expectProductionRun(result, fixture.client, model)
      expect.soft(result.is(ListenExit)).toBe(true)
      expect.soft(textOf(fixture.messages)).toMatch(/1,?128/)
      expect.soft(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
      expectCleanDelivery(fixture.messages, fixture.deltas)
    })

    it('greets naturally without leaking reasoning tags, then searches on a terse follow-up', async () => {
      const fixture = productionChat()
      let session = new Session()
      session.append({ role: 'user', content: 'hi' })
      const queries: string[] = []
      const tools = [
        new Tool({
          name: 'search_knowledge',
          description: 'Search available produce. Accepts a query string.',
          input: z.string(),
          output: z.string(),
          handler: async (query) => {
            queries.push(query)
            throw new ThinkSignal('Answer from these results.', 'Tomatoes are available in 2 kg boxes for $8.61.')
          },
        }),
      ]
      const instructions =
        'You are a friendly grocery assistant. Greet new customers and ask how you can help. For product inquiries, search current stock and include the returned size and price. Do not repeat greetings on follow-up messages.'
      const greeting = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        tools,
        instructions,
      })
      expectProductionRun(greeting, fixture.client, model)
      expect.soft(greeting.is(ListenExit)).toBe(true)
      expect.soft(textOf(fixture.messages).trim()).not.toBe('')
      expect.soft(queries).toEqual([])
      expectCleanDelivery(fixture.messages, fixture.deltas)
      // A production adapter persists the session between incoming user messages.
      session = Session.fromJSON(JSON.parse(JSON.stringify(session)))
      session.append({ role: 'user', content: 'Tomatoes' })
      const offset = fixture.messages.length
      const answer = await execute({
        ...settings,
        client: fixture.client,
        chat: fixture.chat,
        session,
        tools,
        instructions,
      })
      expectProductionRun(answer, fixture.client, model)
      expect.soft(answer.is(ListenExit)).toBe(true)
      expect.soft(queries).toHaveLength(1)
      expect.soft(queries[0] ?? '').toMatch(/tomato/i)
      expect.soft(textOf(fixture.messages.slice(offset))).toContain('8.61')
      expect.soft(textOf(fixture.messages.slice(offset))).toMatch(/2\s*(?:kg|kilogram)/i)
      expectCleanDelivery(fixture.messages, fixture.deltas)
    })

    productionTest(
      model,
      'choice-introduction',
      'sends an actual choice component together with an introduction',
      async () => {
        const fixture = productionChat()
        const session = new Session()
        session.append({
          role: 'user',
          content:
            'Introduce yourself in a text message, then send a separate message with buttons to shop or track my order.',
        })
        const choice = new Component({
          name: 'Choice',
          description: 'Display clickable options to the customer.',
          props: z.object({
            text: z.string(),
            options: z.array(z.object({ label: z.string(), value: z.enum(['shop', 'track']) })),
          }),
        })
        const result = await execute({
          ...settings,
          client: fixture.client,
          session,
          chat: createTestChat({
            components: [choice],
            onMessage: (message) => {
              fixture.messages.push(message)
            },
            onDelta: (delta) => {
              if (!delta.restart) fixture.deltas.push(delta.delta)
            },
          }),
          instructions:
            'You are the shop assistant. Introduce yourself in a short sentence and use Choice for navigation buttons. The shop option has value shop; order tracking has value track. Wait for the customer to choose.',
        })
        expectProductionRun(result, fixture.client, model)
        expect.soft(result.is(ListenExit)).toBe(true)
        expect.soft(textOf(fixture.messages).trim()).not.toBe('')
        const components = fixture.messages.filter((message) => message.type === 'component')
        expect.soft(components).toEqual([
          expect.objectContaining({
            name: 'Choice',
            props: {
              text: expect.any(String),
              options: expect.arrayContaining([
                { label: expect.any(String), value: 'shop' },
                { label: expect.any(String), value: 'track' },
              ]),
            },
          }),
        ])
        expectCleanDelivery(fixture.messages, fixture.deltas)
      }
    )
  })
})
