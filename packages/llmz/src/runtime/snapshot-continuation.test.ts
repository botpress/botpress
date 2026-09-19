import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Chat } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { SnapshotSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Tool } from '../tool.js'
import type { Transcript } from '../transcript.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript, response } from './fixtures/native-client.js'

const purchased = new Exit({
  name: 'purchaseComplete',
  description: 'When a ticket has been purchased.',
  schema: z.object({ ticketId: z.string() }),
})

const cancelled = new Exit({
  name: 'purchaseAbandoned',
  description: 'When payment fails and the purchase must be cancelled.',
  schema: z.object({ reason: z.string() }),
})

function createPurchaseChat() {
  const transcript: Transcript.Message[] = [{ role: 'user', content: 'Buy a ticket for The Matrix.' }]
  const delivered: string[] = []
  const chat = new Chat({
    components: [DefaultComponents.Text],
    transcript: () => transcript,
    handler: (message) => {
      const text = message.children.join('')
      delivered.push(text)
      transcript.push({ role: 'assistant', content: text })
    },
  })

  return { chat, delivered }
}

describe('snapshot continuation with chat and typed outcomes', () => {
  test('preserves a rejected branch and selects cancellation alongside assistant text without replaying work', async () => {
    const requestPayment = vi.fn(() => {
      throw new SnapshotSignal('Payment is pending.')
    })
    const buyTicket = vi.fn(async () => ({ ticketId: 'ticket-123' }))
    const tools = [
      new Tool({
        name: 'requestPayment',
        input: z.object({ amount: z.number() }),
        handler: requestPayment,
      }),
      new Tool({
        name: 'buyTicket',
        input: z.object({ movieId: z.string(), paymentId: z.string() }),
        handler: buyTicket,
      }),
    ]
    const exits = [purchased, cancelled]
    const instructions = 'Help customers purchase movie tickets.'
    const initial = await executeContext({
      client: new NativeClient([
        javascript(`
          const movie = { id: 'matrix', price: 10 };
          const payment = await requestPayment({ amount: movie.price });
          const ticket = await buyTicket({ movieId: movie.id, paymentId: payment.id });
          exit('purchaseComplete', { ticketId: ticket.ticketId });
        `),
      ]),
      chat: createPurchaseChat().chat,
      tools,
      exits,
      instructions,
    })

    if (!initial.isInterrupted()) {
      throw new Error('Expected the payment operation to create a snapshot.')
    }

    expect(requestPayment).toHaveBeenCalledOnce()
    expect(buyTicket).not.toHaveBeenCalled()

    const resolvedSnapshot = initial.snapshot.clone()
    resolvedSnapshot.resolve({ id: 'payment-approved' })
    const resolvedChat = createPurchaseChat()
    const resolvedProgram = javascript(`
      const ticket = await buyTicket({ movieId: movie.id, paymentId: payment.id });
      exit('purchaseComplete', { ticketId: ticket.ticketId });
    `)
    const resolved = await executeContext({
      client: new NativeClient([response('Your ticket is ready.', resolvedProgram.toolCalls)]),
      snapshot: resolvedSnapshot,
      chat: resolvedChat.chat,
      tools,
      exits,
      instructions,
      options: { loop: 1 },
    })

    expect(resolved.is(purchased)).toBe(true)
    expect(resolved.output).toEqual({ ticketId: 'ticket-123' })
    expect(resolvedChat.delivered).toEqual(['Your ticket is ready.'])
    expect(buyTicket).toHaveBeenCalledOnce()

    const rejectedSnapshot = initial.snapshot.clone()
    rejectedSnapshot.reject({ message: 'Payment service unavailable; cancel the purchase.' })
    const rejectedChat = createPurchaseChat()
    const cancellationProgram = javascript('exit("purchaseAbandoned", { reason: "Payment service unavailable" });')
    const client = new NativeClient([
      response('Sorry, payment is unavailable. The purchase has been cancelled.', cancellationProgram.toolCalls),
    ])
    const onExit = vi.fn()
    const rejected = await executeContext({
      client,
      snapshot: rejectedSnapshot,
      chat: rejectedChat.chat,
      tools,
      exits,
      instructions,
      onExit,
      options: { loop: 1 },
    })

    expect(rejected.is(cancelled)).toBe(true)
    expect(rejected.output).toEqual({ reason: 'Payment service unavailable' })
    expect(onExit).toHaveBeenCalledOnce()
    expect(rejectedChat.delivered).toEqual(['Sorry, payment is unavailable. The purchase has been cancelled.'])
    expect(requestPayment).toHaveBeenCalledOnce()
    expect(buyTicket).toHaveBeenCalledOnce()
    expect(rejected.session.memory.variables.movie).toEqual({ id: 'matrix', price: 10 })
    expect(rejected.session.memory.variables).not.toHaveProperty('payment')
    expect(rejected.session.memory.variables).not.toHaveProperty('ticket')
    expect(rejected.session.pendingCalls).toEqual([])

    const request = client.requests[0]!
    const pendingCallId = initial.snapshot.pendingCall!.callId
    const settlement = request.messages.filter((message) => message.toolResultCallId === pendingCallId)
    const system = request.messages.find((message) => message.role === 'system')?.content

    expect(client.requests).toHaveLength(1)
    expect(settlement).toHaveLength(1)
    expect(settlement[0]?.content).toContain('The interrupted operation failed')
    expect(settlement[0]?.content).toContain('Payment service unavailable; cancel the purchase.')
    expect(settlement[0]?.content).toContain('Its remaining statements did not run')
    expect(system).toContain('An apology or other prose does not select a typed exit')
    expect(system).toContain('exit("purchaseAbandoned", payload)')
    expect(JSON.stringify(request.messages)).not.toContain('Your ticket is ready.')
    expect(JSON.stringify(request.messages)).not.toContain('payment-approved')
    expect(initial.snapshot.status.type).toBe('pending')
  })
})
