import type { Models } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { Chat, Component, DefaultComponents, Example, Exit, ListenExit, Tool, execute } from '../src/index.js'
import {
  cases,
  client,
  expectAcceptedProtocol,
  expectRuntimeModelRoute,
  metrics,
  models,
  withExamples,
} from './__tests__/model-evaluation.js'

const intakeExample = new Example({
  situation: 'The user says: Set up Birch Association. We have 7 board members.',
  messages: [{ component: DefaultComponents.Text, body: 'How do you currently manage board meetings?' }],
  exit: ListenExit,
})
const searchExample = new Example({
  situation:
    'The user asks how to change their email. A previous search for "change email" returned no useful results.',
  code: 'return inspect(await searchKnowledge({ query: "update account email address" }))',
  reason:
    'The first query found no evidence. Try different wording before answering; routine retries need no announcement.',
})

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
        const result = await execute({
          client,
          model: model as Models,
          instructions:
            'Read the account information using readAccount. Call it once per response and do not catch its errors.',
          tools: [tool],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [{ role: 'user', content: 'What is my account plan and project count?' }],
            handler: async (message) => {
              events.push('send')
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: limit },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: unavailable ? 'last-iteration-blocked' : 'last-iteration-answer',
            withExamples: false,
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
        const request = `After each failed lookup, send exactly "${update}" before trying again.`
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
        const result = await execute({
          client,
          model: model as Models,
          instructions: `Fetch the current account information using lookupAccount. Retry temporary failures until the lookup succeeds or you have made three total attempts. Call lookupAccount once per response and do not catch its errors. ${scenario === 'updates-instructions' ? request : ''}`,
          tools: [lookupAccount],
          // No examples or explicit silence instructions; only the update cases override defaults.
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [
              {
                role: 'user',
                content: `What is my account plan and project count? ${scenario === 'updates-user' ? request : ''}`,
              },
            ],
            handler: async (message) => {
              events.push('send')
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: 6 },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: `transient-failure-${scenario}`,
            withExamples: false,
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
        const result = await execute({
          client,
          model: model as Models,
          instructions: `Answer using the knowledge base. ${source === 'instructions' ? requestedUpdate : ''}`,
          examples: withExamples ? [searchExample] : [],
          tools: [tool],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [
              {
                role: 'user',
                name: 'user',
                content: `How do I export an archive? ${source === 'user' ? requestedUpdate : ''}`,
              },
            ],
            handler: async (message) => {
              events.push('send')
              sent.push(message.children.join(''))
            },
          }),
          options: { loop: 4 },
        })
        console.info(
          JSON.stringify({
            model,
            run,
            scenario: `requested-progress-${source}`,
            withExamples,
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
        examples: withExamples
          ? [
              new Example({
                situation: 'The task needs the current limit, which has not been read yet.',
                code: 'const limit = await readLimit(); return exit("done", { limit });',
              }),
            ]
          : [],
        options: { loop: 4 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'worker',
          withExamples,
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
        const result = await execute({
          client,
          model: model as Models,
          instructions:
            'Collect exactly three onboarding details: organization name, board size, and current meeting process. Ask only for missing details. Once all three are available, acknowledge completion without proposing further setup or follow-up actions.',
          examples: withExamples ? [intakeExample] : [],
          chat: new Chat({
            components: [DefaultComponents.Text],
            transcript: [{ role: 'user', name: 'user', content: input }],
            handler: async (message) => {
              sent.push(message.children.join(''))
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
            withExamples,
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
      const result = await execute({
        client,
        model: model as Models,
        instructions:
          'Answer product questions using the knowledge base. If no useful evidence is found, try a different query before answering.',
        examples: withExamples ? [searchExample] : [],
        tools: [searchKnowledge],
        chat: new Chat({
          components: [DefaultComponents.Text],
          transcript: [{ role: 'user', name: 'user', content: 'How do I export an archive?' }],
          handler: async (message) => {
            events.push('send')
            sent.push(message.children.join(''))
          },
        }),
        options: { loop: 5 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'silent-search-retry',
          withExamples,
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
      const example = new Example({
        situation: 'The user asks: Compare the storage limits of Basic and Plus.',
        code: 'return inspect(await Promise.all([searchKnowledge({ query: "Basic storage limit" }), searchKnowledge({ query: "Plus storage limit" })]))',
      })
      const result = await execute({
        client,
        model: model as Models,
        instructions: 'Answer plan questions using the knowledge base. Fetch independent topics in parallel.',
        examples: withExamples ? [example] : [],
        tools: [searchKnowledge],
        chat: new Chat({
          components: [DefaultComponents.Text],
          transcript: [
            {
              role: 'user',
              name: 'user',
              content: 'Search separately for Standard and Team project limits and compare them.',
            },
          ],
          handler: async (message) => {
            events.push('send')
            sent.push(message.children.join(''))
          },
        }),
        options: { loop: 4 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'parallel-search',
          withExamples,
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
      const sent: Array<{ type: string; props: Record<string, unknown>; body: string }> = []
      const example = new Example({
        situation: 'The user asks: Present the Hiking guide and its cover, with links and actions.',
        messages: [
          { component: DefaultComponents.Card, props: { title: 'Hiking guide' }, body: 'Trail safety tips.' },
          {
            component: DefaultComponents.Image,
            props: { url: 'https://example.com/hiking.jpg', alt: 'Hiking guide cover' },
          },
          {
            component: DefaultComponents.Button,
            props: { action: 'url', label: 'Read guide', url: 'https://example.com/hiking' },
          },
          {
            component: DefaultComponents.Button,
            props: { action: 'postback', label: 'Save guide', value: 'save_hiking' },
          },
        ],
        exit: ListenExit,
      })
      const result = await execute({
        client,
        model: model as Models,
        instructions:
          'Present supplied content using the requested components. Use exact titles, labels, URLs, and action values. Do not add a text introduction or closing message.',
        examples: withExamples ? [example] : [],
        chat: new Chat({
          components: [
            DefaultComponents.Text,
            DefaultComponents.Card,
            DefaultComponents.Image,
            DefaultComponents.Button,
          ],
          transcript: [
            {
              role: 'user',
              name: 'user',
              content:
                'Send a card titled "Cycling guide" with body "Road safety tips.", then the image https://example.com/cycling.jpg with alt "Cycling guide cover", then a URL button labeled "Read guide" pointing to https://example.com/cycling, then a postback button labeled "Save guide" with value "save_cycling".',
            },
          ],
          handler: async (message) => {
            sent.push({ type: message.type.toLowerCase(), props: message.props, body: message.children.join('') })
          },
        }),
        options: { loop: 3 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'rich-messages',
          withExamples,
          success: result.isSuccess(),
          ...metrics(result),
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(sent.map((message) => message.type)).toEqual(['card', 'image', 'button', 'button'])
      expect(sent[0]).toMatchObject({ props: { title: 'Cycling guide' }, body: 'Road safety tips.' })
      expect(sent[1]!.props).toMatchObject({ url: 'https://example.com/cycling.jpg', alt: 'Cycling guide cover' })
      expect(sent[2]!.props).toMatchObject({ action: 'url', label: 'Read guide', url: 'https://example.com/cycling' })
      expect(sent[3]!.props).toMatchObject({ action: 'postback', label: 'Save guide', value: 'save_cycling' })
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('renders the default carousel as nested cards with images and buttons', async () => {
      const cards = [
        {
          title: 'Blue mug',
          subtitle: '$12',
          body: 'Dishwasher safe.',
          image: { url: 'https://example.com/blue.jpg', alt: 'Blue mug' },
          buttons: [{ action: 'url', label: 'View Blue', url: 'https://example.com/blue' }],
        },
        {
          title: 'Green mug',
          subtitle: '$15',
          body: 'Hand glazed.',
          image: { url: 'https://example.com/green.jpg', alt: 'Green mug' },
          buttons: [{ action: 'postback', label: 'Choose Green', value: 'green_mug' }],
        },
      ]
      const sent: unknown[] = []
      const result = await execute({
        client,
        model: model as Models,
        instructions:
          'Present supplied products as one carousel, preserving their order and all supplied content. Do not add introductory or closing text.',
        chat: new Chat({
          components: [DefaultComponents.Carousel],
          transcript: [{ role: 'user', name: 'user', content: `Show these products: ${JSON.stringify(cards)}` }],
          handler: async (message) => {
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
      expect(sent).toEqual([
        DefaultComponents.Carousel.render(
          {},
          cards.map(({ body, image, buttons, ...props }) =>
            DefaultComponents.Card.render(props, [
              body,
              DefaultComponents.Image.render(image),
              ...buttons.map((button) => DefaultComponents.Button.render(button)),
            ])
          )
        ),
      ])
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)

    it('emits structured carousel props without copying example facts', async () => {
      const ProductCarousel = new Component({
        type: 'leaf',
        name: 'ProductCarousel',
        description: 'Displays products as a carousel of cards.',
        leaf: {
          props: z.object({
            cards: z
              .array(z.object({ title: z.string(), imageUrl: z.string(), url: z.string() }))
              .min(1)
              .max(10),
          }),
        },
        generation: {
          examples: [
            {
              props: {
                cards: [
                  { title: 'Trail shoe', imageUrl: 'https://example.com/trail.jpg', url: 'https://example.com/trail' },
                  { title: 'Road shoe', imageUrl: 'https://example.com/road.jpg', url: 'https://example.com/road' },
                ],
              },
            },
          ],
        },
      })
      const cards = [
        { title: 'Blue mug', imageUrl: 'https://example.com/blue.jpg', url: 'https://example.com/blue' },
        { title: 'Green mug', imageUrl: 'https://example.com/green.jpg', url: 'https://example.com/green' },
      ]
      const sent: Array<{ type: string; props: Record<string, unknown>; body: string }> = []
      const result = await execute({
        client,
        model: model as Models,
        instructions:
          'Present the supplied products as one carousel, preserving their order. Do not add introductory or closing text.',
        chat: new Chat({
          components: [DefaultComponents.Text, ProductCarousel],
          transcript: [{ role: 'user', name: 'user', content: `Show these products: ${JSON.stringify(cards)}` }],
          handler: async (message) => {
            sent.push({ type: message.type.toLowerCase(), props: message.props, body: message.children.join('') })
          },
        }),
        options: { loop: 3 },
      })
      console.info(
        JSON.stringify({
          model,
          run,
          scenario: 'carousel',
          withExamples,
          success: result.isSuccess(),
          ...metrics(result),
          messages: sent,
        })
      )

      expect(result.isSuccess()).toBe(true)
      expect(sent).toEqual([{ type: 'productcarousel', props: { cards }, body: '' }])
      expectRuntimeModelRoute(result, model)
      expectAcceptedProtocol(result)
    }, 120_000)
  },
  { retry: 0 }
)
