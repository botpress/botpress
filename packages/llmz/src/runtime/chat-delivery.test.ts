import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Chat, type MessageDelta, type MessageMetadata } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { ListenExit } from '../context.js'
import type { ResponsePreset } from '../response.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, NativeStreamClient, javascript, nativeCall, response } from './fixtures/native-client.js'

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('direct chat delivery ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test.each<ResponsePreset>(['markdown', 'text', 'speech'])(
    'streams one canonical text response using the %s preset',
    async (preset) => {
      const handler = vi.fn()
      const deltas: MessageDelta[] = []
      const text = 'Your order arrives tomorrow.'
      const client = new NativeStreamClient([response(text)], 3)
      const result = await executeContext({
        client,
        chat: new Chat({
          response: {
            preset,
            handler,
            onDelta: (delta) => {
              deltas.push(delta)
            },
          },
        }),
      })

      expect(result.is(ListenExit)).toBe(true)
      expect(handler).toHaveBeenCalledOnce()
      expect(handler.mock.calls[0]?.[0]).toBe(text)
      const streamed = deltas.filter((delta) => !delta.restart)

      expect(streamed.map((delta) => delta.delta).join('')).toBe(text)
      expect(streamed.every((delta) => delta.type === 'text')).toBe(true)
      expect(streamed.every((delta) => delta.id === handler.mock.calls[0]?.[1].id)).toBe(true)
      expect(streamed.every((delta) => !('props' in delta) && !('component' in delta))).toBe(true)
      expect(result.session.messages).toEqual([{ role: 'assistant', content: text }])
      expect(client.requests[0]?.messages[0]?.content).toContain('# Assistant response')
      expect(client.requests[0]?.messages[0]?.content).not.toMatch(/chat\.(?:text|markdown|speech)\(/)
    }
  )

  test('delivers flat card and carousel props to their own handlers in one response', async () => {
    const card = vi.fn()
    const carousel = vi.fn()
    const text = vi.fn()
    const client = new NativeClient([
      response('Here are your choices.', [
        nativeCall('run_javascript', {
          code: `chat.card({ title: 'Standard', text: 'Five projects.', buttons: [{ label: 'Choose' }] });
chat.carousel({ cards: [{ title: 'Team', text: 'Twenty projects.', image: { url: 'https://example.com/team.png' } }] });
return exit('listen');`,
        }),
      ]),
    ])
    const result = await executeContext({
      client,
      chat: new Chat({
        response: { handler: text },
        components: [DefaultComponents.Card.withHandler(card), DefaultComponents.Carousel.withHandler(carousel)],
      }),
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(client.requests).toHaveLength(1)
    expect(text.mock.calls[0]?.[0]).toBe('Here are your choices.')
    expect(card.mock.calls[0]?.[0]).toEqual({
      title: 'Standard',
      text: 'Five projects.',
      buttons: [{ action: 'say', label: 'Choose' }],
    })
    expect(carousel.mock.calls[0]?.[0]).toEqual({
      cards: [{ title: 'Team', text: 'Twenty projects.', image: { url: 'https://example.com/team.png' } }],
    })
    expect(card.mock.calls[0]?.[1].iterationId).toBe(carousel.mock.calls[0]?.[1].iterationId)
    expect(card.mock.calls[0]?.[1].id).not.toBe(carousel.mock.calls[0]?.[1].id)
    expect(text.mock.invocationCallOrder[0]).toBeLessThan(card.mock.invocationCallOrder[0]!)
    expect(card.mock.invocationCallOrder[0]).toBeLessThan(carousel.mock.invocationCallOrder[0]!)
    expect(JSON.stringify(result.iteration?.traces)).not.toMatch(/"(?:children|__jsx)":/)
  })

  test('validates and transforms props once before invoking a component handler', async () => {
    const handler = vi.fn()
    const transform = vi.fn((label: string) => label + '!')
    const notice = new Component({
      name: 'Notice',
      description: 'A structured notice.',
      props: z.object({ label: z.string().transform(transform) }),
      handler,
    })
    const result = await executeContext({
      client: new NativeClient([javascript('chat.notice({ label: "Saved" }); return exit("listen");')]),
      chat: new Chat({ components: [notice] }),
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(transform).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0]?.[0]).toEqual({ label: 'Saved!' })
  })

  test('rejects unbound components before calling the model', async () => {
    const client = new NativeClient([])
    const result = await executeContext({ client, chat: new Chat({ components: [DefaultComponents.Card] }) })

    expect(result.isError()).toBe(true)
    expect(client.requests).toEqual([])

    if (result.isError()) {
      expect(String(result.error)).toContain('requires a handler')
    }
  })

  test('keeps response instructions and callbacks fixed for each generation', async () => {
    let resolutions = 0
    const committed: Array<{ iteration: number; text: string; metadata: MessageMetadata }> = []
    const streamed: Array<{ iteration: number; delta: MessageDelta }> = []
    const client = new NativeStreamClient([
      response('Checking.', [nativeCall('run_javascript', { code: 'return inspect(42);' })]),
      response('The answer is forty two.'),
    ])
    const result = await executeContext({
      client,
      chat: new Chat({
        response: () => {
          const iteration = ++resolutions

          return {
            instructions: `Reply style for generation ${iteration}.`,
            handler: (text, metadata) => {
              committed.push({ iteration, text, metadata })
            },
            onDelta: (delta) => {
              streamed.push({ iteration, delta })
            },
          }
        },
      }),
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(resolutions).toBe(2)
    expect(committed.map(({ iteration, text }) => ({ iteration, text }))).toEqual([
      { iteration: 1, text: 'Checking.' },
      { iteration: 2, text: 'The answer is forty two.' },
    ])

    for (let index = 0; index < 2; index++) {
      expect(client.requests[index]?.messages[0]?.content).toContain(`Reply style for generation ${index + 1}.`)
      expect(
        streamed
          .filter(({ iteration }) => iteration === index + 1)
          .every(({ delta }) => !delta.restart && delta.id === committed[index]?.metadata.id)
      ).toBe(true)
    }
  })

  test('routes a component yielded by a business tool to the registered component handler', async () => {
    const handler = vi.fn()
    const button = DefaultComponents.Button.withHandler(handler)
    const tool = new Tool({
      name: 'offerChoice',
      async *handler() {
        yield button.render({ label: 'Continue' })
        return 'offered'
      },
    })
    const result = await executeContext({
      client: new NativeClient([javascript('await offerChoice(); return exit("listen");')]),
      tools: [tool],
      chat: new Chat({ components: [button] }),
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0]?.[0]).toEqual({ action: 'say', label: 'Continue' })
    expect(handler.mock.calls[0]?.[1].id).toContain(':yield-0')
    expect(result.iteration?.traces.filter((trace) => trace.type === 'yield')).toHaveLength(1)
  })
})
