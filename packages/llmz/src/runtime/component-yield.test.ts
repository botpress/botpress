import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Chat } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { ListenExit } from '../context.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })

  return { promise, release }
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('business tool component delivery ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('rejects invalid raw yielded props before invoking the registered handler', async () => {
    const handler = vi.fn()
    const notice = new Component({
      name: 'notice',
      description: 'A notice with a string label.',
      props: z.object({ label: z.string() }),
      handler,
    })
    const emit = new Tool({
      name: 'emitNotice',
      async *handler() {
        yield { type: 'component' as const, name: 'notice', props: { label: 42 } }
        return true
      },
    })
    const result = await executeContext({
      client: new NativeClient([
        javascript('await emitNotice(); return exit("listen");'),
        javascript('return exit("listen");'),
      ]),
      chat: new Chat({ components: [notice] }),
      tools: [emit],
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(result.iterations[0]?.error).toContain('label')
    expect(handler).not.toHaveBeenCalled()
    expect(result.iterations[0]?.traces.filter((trace) => trace.type === 'yield')).toEqual([])
    expect(result.iterations[0]?.traces.find((trace) => trace.type === 'tool_call')).toMatchObject({ success: false })
  })

  test.each(['raw', 'rendered'] as const)(
    'validates and transforms a %s yielded component exactly once',
    async (kind) => {
      const handler = vi.fn()
      const transform = vi.fn((label: string) => `${label}!`)
      const notice = new Component({
        name: 'notice',
        description: 'A notice with a normalized label.',
        props: z.object({ label: z.string().transform(transform) }),
        handler,
      })
      const emit = new Tool({
        name: 'emitNotice',
        async *handler() {
          yield kind === 'rendered'
            ? notice.render({ label: 'Saved' })
            : { type: 'component' as const, name: 'notice', props: { label: 'Saved' } }
          return true
        },
      })
      const result = await executeContext({
        client: new NativeClient([javascript('await emitNotice(); return exit("listen");')]),
        chat: new Chat({ components: [notice] }),
        tools: [emit],
      })
      const call = result.iteration?.traces.find((trace) => trace.type === 'tool_call')
      const deliveries = result.iteration?.traces.filter((trace) => trace.type === 'yield')

      expect(result.is(ListenExit)).toBe(true)
      expect(transform).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledOnce()
      expect(handler.mock.calls[0]?.[0]).toEqual({ label: 'Saved!' })
      expect(deliveries).toHaveLength(1)
      expect(deliveries?.[0]).toMatchObject({
        message_id: `${call?.tool_call_id}:yield-0`,
        native_call_id: result.iteration?.nativeCallId,
        success: true,
        value: { type: 'component', name: 'notice', props: { label: 'Saved!' } },
      })
      expect(handler.mock.calls[0]?.[1].id).toBe(deliveries?.[0]?.message_id)
    }
  )

  test('queues yielded messages behind chat sends and joins all deliveries before exit', async () => {
    const cardReady = gate()
    const cardDelivery = gate()
    const yielding = gate()
    const buttonReady = gate()
    const buttonDelivery = gate()
    const events: string[] = []
    const cardHandler = vi.fn(async () => {
      events.push('card started')
      cardReady.release()
      await cardDelivery.promise
      events.push('card delivered')
    })
    const buttonHandler = vi.fn(async () => {
      events.push('button started')
      buttonReady.release()
      await buttonDelivery.promise
      events.push('button delivered')
    })
    const button = DefaultComponents.Buttons.withHandler(buttonHandler)
    const offerChoice = new Tool({
      name: 'offerChoice',
      async *handler() {
        yielding.release()
        yield button.render([{ label: 'Continue' }])
        events.push('tool continued')
        return 'offered'
      },
    })
    let settled = false
    const execution = executeContext({
      client: new NativeClient([
        javascript('chat.card({ title: "First" }); await offerChoice(); return exit("listen");'),
      ]),
      chat: new Chat({ components: [DefaultComponents.Card.withHandler(cardHandler), button] }),
      tools: [offerChoice],
      onExit: () => {
        events.push('exit')
      },
    }).then((result) => {
      settled = true
      return result
    })

    await cardReady.promise
    await yielding.promise
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(cardHandler).toHaveBeenCalledOnce()
    expect(buttonHandler).not.toHaveBeenCalled()
    expect(settled).toBe(false)

    cardDelivery.release()
    await buttonReady.promise

    expect(events).toEqual(['card started', 'card delivered', 'button started'])
    expect(settled).toBe(false)

    buttonDelivery.release()
    const result = await execution

    expect(result.is(ListenExit)).toBe(true)
    expect(events).toEqual([
      'card started',
      'card delivered',
      'button started',
      'button delivered',
      'tool continued',
      'exit',
    ])
    const deliveries = result.iteration?.traces.filter((trace) => trace.type === 'yield')

    expect(deliveries?.map((trace) => trace.value)).toEqual([
      { type: 'component', name: 'card', props: { title: 'First' } },
      { type: 'component', name: 'buttons', props: [{ action: 'say', label: 'Continue' }] },
    ])
    expect(deliveries?.every((trace) => trace.success)).toBe(true)
    expect(deliveries?.[0]?.message_id).toContain(':message:1')
    expect(deliveries?.[1]?.message_id).toContain(':yield-0')
  })
})
