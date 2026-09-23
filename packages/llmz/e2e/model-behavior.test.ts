import type { Models } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'

import type { ChatMessage } from '../src/chat/chat.js'
import { Component, DefaultComponents, Exit, ListenExit, Tool, execute } from '../src/index.js'
import { Session } from '../src/session/session.js'

import { createTestChat } from './__tests__/chat.js'
import {
  cases,
  client,
  expectAcceptedProtocol,
  expectRuntimeModelRoute,
  metrics,
  models,
} from './__tests__/model-evaluation.js'

// These are behavioral regression checks, not a semantic judge. Review captured
// responses for unsupported claims and reasoning leakage beyond the patterns below.
describe.skipIf(!models.length).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'model behavior: $model, run $run',
  ({ model, run }) => {
    it.each([false, true])(
      'finishes on the last iteration when the tool is unavailable=%s',
      async (unavailable) => {
        const events: string[] = []
        const sent: string[] = []
        const limit = unavailable ? 3 : 2
        const tool = new Tool({
          name: 'readAccount',
          output: z.object({ plan: z.string(), projects: z.number() }),
          handler: async () => {
            events.push('lookup')

            if (unavailable) {
              throw new Error('The account service is temporarily unavailable. Try again.')
            }

            return { plan: 'Orchid', projects: 17 }
          },
        })
        const session = new Session()
        session.append([{ role: 'user', content: 'What is my account plan and project count?' }])

        const result = await execute({
          session,
          client,
          model: model as Models,
          instructions:
            'Read the account information using readAccount. Call it once per response and do not catch its errors.',
          tools: [tool],
          chat: createTestChat({
            components: [],
            onMessage: async (message) => {
              events.push('send')
              expect(message.type).toBe('text')
              if (message.type === 'text') {
                sent.push(message.text)
              }
            },
          }),
          options: { loop: limit },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: unavailable ? 'last-iteration-blocked' : 'last-iteration-answer',

            success: result.isSuccess(),
            ...metrics(result),
            events,
            messages: sent,
          })
        )

        expect(result.isSuccess()).toBe(true)
        expect(result.iterations).toHaveLength(limit)
        expect(events).toEqual(unavailable ? ['lookup', 'lookup', 'send'] : ['lookup', 'send'])
        expect(sent).toHaveLength(1)
        expect(sent[0]).not.toMatch(/iteration|generation|budget|internal limit/i)

        if (unavailable) {
          expect(sent[0]).toMatch(/unavailable|unable|couldn.t|cannot|can.t|could not|failed|try again/i)
          expect(sent[0]).not.toMatch(/Orchid|\b17\b/)
        } else {
          expect(sent[0]).toMatch(/Orchid/)
          expect(sent[0]).toMatch(/\b17\b/)
        }

        expectRuntimeModelRoute(result, model)
        expectAcceptedProtocol(result)
      },
      120_000
    )

    it.each(['silent-success', 'silent-blocked', 'updates-instructions', 'updates-user'] as const)(
      'handles transient execution failures: %s',
      async (scenario) => {
        const events: string[] = []
        const sent: string[] = []
        let attempts = 0
        const blocked = scenario === 'silent-blocked'
        const updates = scenario.startsWith('updates-')
        const update = 'Retrying the account lookup.'
        const request = `After each failed lookup, send exactly "${update}" and then try again.`
        const lookupAccount = new Tool({
          name: 'lookupAccount',
          description: 'Reads the current account information.',
          output: z.object({ plan: z.string(), projects: z.number() }),
          handler: async () => {
            attempts++

            if (blocked || attempts < 3) {
              events.push('failed-lookup')
              throw new Error('Account service temporarily unavailable. Retry lookupAccount.')
            }

            events.push('successful-lookup')
            return { plan: 'Orchid', projects: 17 }
          },
        })
        const session = new Session()
        session.append([
          {
            role: 'user',
            content: `What is my account plan and project count? ${scenario === 'updates-user' ? request : ''}`,
          },
        ])

        const result = await execute({
          session,
          client,
          model: model as Models,
          instructions: `Fetch the current account information using lookupAccount. Retry temporary failures until the lookup succeeds or you have made three total attempts. Call lookupAccount once per response and do not catch its errors. After successful recovery, answer the original question without mentioning resolved internal failures or retries, unless requested or relevant to the outcome. Explain unresolved failures that prevent completion. ${scenario === 'updates-instructions' ? request : ''}`,
          tools: [lookupAccount],
          // Explicit update requests override the instruction to omit resolved failures.
          chat: createTestChat({
            components: [],
            onMessage: async (message) => {
              events.push('send')
              expect(message.type).toBe('text')
              if (message.type === 'text') {
                sent.push(message.text)
              }
            },
          }),
          options: { loop: 6 },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: `transient-failure-${scenario}`,

            success: result.isSuccess(),
            ...metrics(result),
            events,
            messages: sent,
            attempts,
          })
        )

        expect(result.isSuccess()).toBe(true)
        expect(attempts).toBe(3)
        expect(result.iterations.filter((iteration) => iteration.status.type === 'execution_error')).toHaveLength(
          blocked ? 3 : 2
        )
        expect(events).toEqual(
          updates
            ? ['failed-lookup', 'send', 'failed-lookup', 'send', 'successful-lookup', 'send']
            : ['failed-lookup', 'failed-lookup', blocked ? 'failed-lookup' : 'successful-lookup', 'send']
        )

        if (updates) {
          expect(sent.slice(0, -1)).toEqual([update, update])
        }

        const answer = sent.at(-1)!

        if (blocked) {
          expect(answer).toMatch(/unavailable|unable|couldn.t|cannot|can.t|could not|failed|try again/i)
          expect(answer).not.toMatch(/Orchid|\b17\b/)
        } else {
          expect(answer).toMatch(/Orchid/)
          expect(answer).toMatch(/\b17\b/)
          // Omit recovered failures by default. An explicit request for recovery
          // updates permits a recap; exact updates and tool order are checked above.
          if (!updates) {
            expect(answer).not.toMatch(/sorry|apolog|error|retry|retried|temporar|failed/i)
          }
        }

        expectRuntimeModelRoute(result, model)
        expectAcceptedProtocol(result)
      },
      120_000
    )

    it.each(['instructions', 'user'] as const)(
      'honors explicitly requested search updates from %s',
      async (source) => {
        const events: string[] = []
        const sent: string[] = []
        const requestedUpdate = 'Before searching, send exactly "Checking the documentation." Then search and answer.'
        const tool = new Tool({
          name: 'searchKnowledge',
          input: z.object({ query: z.string() }),
          output: z.array(z.string()),
          handler: async () => {
            events.push('search')
            return ['Open Settings, select Export, then choose Download archive.']
          },
        })
        const session = new Session()
        session.append([
          {
            role: 'user',
            name: 'user',
            content: `How do I export an archive? ${source === 'user' ? requestedUpdate : ''}`,
          },
        ])

        const result = await execute({
          session,
          client,
          model: model as Models,
          instructions: `Answer using the knowledge base. ${source === 'instructions' ? requestedUpdate : ''}`,

          tools: [tool],
          chat: createTestChat({
            components: [],
            onMessage: async (message) => {
              events.push('send')
              expect(message.type).toBe('text')
              if (message.type === 'text') {
                sent.push(message.text)
              }
            },
          }),
          options: { loop: 4 },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: `requested-progress-${source}`,

            success: result.isSuccess(),
            ...metrics(result),
            events,
            messages: sent,
          })
        )

        expect(result.isSuccess()).toBe(true)
        expect(events).toEqual(['send', 'search', 'send'])
        expect(sent[0]).toBe('Checking the documentation.')
        expect(sent[1]).toMatch(/Download archive/i)
        expectRuntimeModelRoute(result, model)
        expectAcceptedProtocol(result)
      },
      120_000
    )

    it('uses tools and returns a structured exit in worker mode', async () => {
      let calls = 0
      const tool = new Tool({
        name: 'readLimit',
        output: z.number(),
        handler: async () => {
          calls++
          return 17
        },
      })
      const done = new Exit({
        name: 'done',
        description: 'Finish with the current limit.',
        schema: z.object({ limit: z.number() }),
      })
      const result = await execute({
        client,
        model: model as Models,
        instructions:
          'Read the current limit using readLimit, then return exit("done", { limit }) with that exact limit from the same JavaScript program.',
        tools: [tool],
        exits: [done],

        options: { loop: 4 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'worker',

          success: result.isSuccess(),
          ...metrics(result),
          calls,
        })
      )

      expect(result.is(done)).toBe(true)

      if (result.is(done)) {
        expect(result.output).toEqual({ limit: 17 })
      }

      expect(calls).toBe(1)
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it.each([
      { scenario: 'intake-missing', input: 'Set up Cedar Foundation. We have 12 board members.', complete: false },
      {
        scenario: 'intake-complete',
        input: 'Set up Cedar Foundation. We have 12 board members. Actually, 9. We use email for meetings.',
        complete: true,
      },
    ])(
      'uses supplied intake fields: $scenario',
      async ({ input, complete }) => {
        const sent: string[] = []
        const session = new Session()
        session.append([{ role: 'user', name: 'user', content: input }])

        const result = await execute({
          session,
          client,
          model: model as Models,
          instructions:
            'Collect exactly three onboarding details: organization name, board size, and current meeting process. Ask only for missing details. Once all three are available, acknowledge completion without proposing further setup or follow-up actions.',

          chat: createTestChat({
            components: [],
            onMessage: async (message) => {
              expect(message.type).toBe('text')
              if (message.type === 'text') {
                sent.push(message.text)
              }
            },
          }),
          options: { loop: 4 },
        })
        const text = sent.join('\n')
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: complete ? 'intake-complete' : 'intake-missing',

            success: result.isSuccess(),
            ...metrics(result),
            words: text.split(/\s+/).filter(Boolean).length,
            messages: sent,
          })
        )

        expect(result.isSuccess()).toBe(true)
        expect(sent).toHaveLength(1)
        expect(text.split(/\s+/).length).toBeLessThanOrEqual(70)
        expect(text).not.toMatch(/the user (?:is|has)|I (?:should|need to) (?:follow|ask|use)|playbook|<think>/i)
        expect(text).not.toMatch(
          /(?:what(?:'s| is)|confirm|provide|share|tell me).{0,35}(?:organization.{0,10}name|board.{0,10}(?:size|members))/i
        )

        if (complete) {
          expect(text).not.toContain('?')
          expect(text).not.toMatch(/\b12\b/)
        } else {
          expect(text).toMatch(/meeting|manage/i)
          expect(text.match(/\?/g)).toHaveLength(1)
        }

        expectRuntimeModelRoute(result, model)
        expectAcceptedProtocol(result)
      },
      120_000
    )

    it('refines an empty search without speaking between calls', async () => {
      const events: string[] = []
      const queries: string[] = []
      const sent: string[] = []
      const searchKnowledge = new Tool({
        name: 'searchKnowledge',
        description: 'Searches product documentation using a natural language query.',
        input: z.object({ query: z.string() }),
        output: z.array(z.string()),
        handler: async ({ query }) => {
          events.push('search')
          queries.push(query)
          return queries.length === 1
            ? []
            : ['To export an archive, open Settings, select Export, then choose Download archive.']
        },
      })
      const session = new Session()
      session.append([{ role: 'user', name: 'user', content: 'How do I export an archive?' }])

      const result = await execute({
        session,
        client,
        model: model as Models,
        instructions:
          'Answer product questions using the knowledge base. If no useful evidence is found, try a different query before answering. Perform one search at a time.',

        tools: [searchKnowledge],
        chat: createTestChat({
          components: [],
          onMessage: async (message) => {
            events.push('send')
            expect(message.type).toBe('text')
            if (message.type === 'text') {
              sent.push(message.text)
            }
          },
        }),
        options: { loop: 5 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'silent-search-retry',

          success: result.isSuccess(),
          ...metrics(result),
          events,
          queries,
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(events).toEqual(['search', 'search', 'send'])
      expect(queries[1]).not.toBe(queries[0])
      expect(sent[0]).toMatch(/Settings/i)
      expect(sent[0]).toMatch(/Download archive/i)
      expect(sent[0]!.split(/\s+/).length).toBeLessThanOrEqual(70)
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('runs independent searches in parallel before answering', async () => {
      let active = 0
      let peakActive = 0
      const queries: string[] = []
      const events: string[] = []
      const sent: string[] = []
      const searchKnowledge = new Tool({
        name: 'searchKnowledge',
        description: 'Search documentation for a single topic per query.',
        input: z.object({ query: z.string() }),
        output: z.array(z.string()),
        handler: async ({ query }) => {
          queries.push(query)
          events.push('search')
          peakActive = Math.max(peakActive, ++active)
          await new Promise((resolve) => setTimeout(resolve, 30))
          active--
          return [/standard/i.test(query) ? 'Standard supports 8 projects.' : 'Team supports 30 projects.']
        },
      })

      const session = new Session()
      session.append([
        {
          role: 'user',
          name: 'user',
          content: 'Search separately for Standard and Team project limits and compare them.',
        },
      ])

      const result = await execute({
        session,
        client,
        model: model as Models,
        instructions: 'Answer plan questions using the knowledge base. Fetch independent topics in parallel.',

        tools: [searchKnowledge],
        chat: createTestChat({
          components: [],
          onMessage: async (message) => {
            events.push('send')
            expect(message.type).toBe('text')
            if (message.type === 'text') {
              sent.push(message.text)
            }
          },
        }),
        options: { loop: 4 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'parallel-search',

          success: result.isSuccess(),
          ...metrics(result),
          queries,
          peakActive,
          events,
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(queries).toHaveLength(2)
      expect(peakActive).toBe(2)
      expect(events).toEqual(['search', 'search', 'send'])
      expect(sent.join(' ')).toMatch(/\b8\b/)
      expect(sent.join(' ')).toMatch(/\b30\b/)
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('emits cards, images and distinct button actions with exact props', async () => {
      const sent: ChatMessage[] = []

      const session = new Session()
      session.append([
        {
          role: 'user',
          name: 'user',
          content:
            'Send a card titled "Cycling guide" with text "Road safety tips.", then the image https://example.com/cycling.jpg with alt "Cycling guide cover", then one group of buttons: a URL button labeled "Read guide" pointing to https://example.com/cycling and a postback button labeled "Save guide" with value "save_cycling", in that order.',
        },
      ])

      const result = await execute({
        session,
        client,
        model: model as Models,
        instructions:
          'Present supplied content using the requested components. Use exact titles, labels, URLs, and action values. Do not add a text introduction or closing message.',

        chat: createTestChat({
          components: [DefaultComponents.Card, DefaultComponents.Image, DefaultComponents.Buttons],

          onMessage: async (message) => {
            sent.push(message)
          },
        }),
        options: { loop: 3 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'rich-messages',

          success: result.isSuccess(),
          ...metrics(result),
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(sent).toEqual([
        DefaultComponents.Card.render({ title: 'Cycling guide', text: 'Road safety tips.' }),
        DefaultComponents.Image.render({ url: 'https://example.com/cycling.jpg', alt: 'Cycling guide cover' }),
        DefaultComponents.Buttons.render([
          { action: 'url', label: 'Read guide', url: 'https://example.com/cycling' },
          { action: 'postback', label: 'Save guide', value: 'save_cycling' },
        ]),
      ])
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('renders the default carousel with flat cards, images and buttons', async () => {
      const cards: Parameters<typeof DefaultComponents.Carousel.render>[0]['cards'] = [
        {
          title: 'Blue mug',
          subtitle: '$12',
          text: 'Dishwasher safe.',
          image: { url: 'https://example.com/blue.jpg', alt: 'Blue mug' },
          buttons: [{ action: 'url', label: 'View Blue', url: 'https://example.com/blue' }],
        },
        {
          title: 'Green mug',
          subtitle: '$15',
          text: 'Hand glazed.',
          image: { url: 'https://example.com/green.jpg', alt: 'Green mug' },
          buttons: [{ action: 'postback', label: 'Choose Green', value: 'green_mug' }],
        },
      ]
      const sent: unknown[] = []
      const session = new Session()
      session.append([{ role: 'user', name: 'user', content: `Show these products: ${JSON.stringify(cards)}` }])

      const result = await execute({
        session,
        client,
        model: model as Models,
        instructions:
          'Present supplied products as one carousel, preserving their order and all supplied content. Do not add introductory or closing text.',
        chat: createTestChat({
          components: [DefaultComponents.Carousel],

          onMessage: async (message) => {
            sent.push(message)
          },
        }),
        options: { loop: 3 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'default-carousel',
          success: result.isSuccess(),
          ...metrics(result),
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(sent).toEqual([DefaultComponents.Carousel.render({ cards })])
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('emits structured custom carousel props', async () => {
      const ProductCarousel = new Component({
        name: 'productCarousel',
        description: 'Displays products as a carousel of cards.',
        props: z.object({
          cards: z
            .array(z.object({ title: z.string(), imageUrl: z.string(), url: z.string() }))
            .min(1)
            .max(10),
        }),
      })
      const cards = [
        { title: 'Blue mug', imageUrl: 'https://example.com/blue.jpg', url: 'https://example.com/blue' },
        { title: 'Green mug', imageUrl: 'https://example.com/green.jpg', url: 'https://example.com/green' },
      ]
      const sent: ChatMessage[] = []
      const session = new Session()
      session.append([{ role: 'user', name: 'user', content: `Show these products: ${JSON.stringify(cards)}` }])

      const result = await execute({
        session,
        client,
        model: model as Models,
        instructions:
          'Present the supplied products as one carousel, preserving their order. Do not add introductory or closing text.',
        chat: createTestChat({
          components: [ProductCarousel],

          onMessage: async (message) => {
            sent.push(message)
          },
        }),
        options: { loop: 3 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'carousel',

          success: result.isSuccess(),
          ...metrics(result),
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(sent).toEqual([ProductCarousel.render({ cards })])
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)
  },
  { retry: 0 }
)
