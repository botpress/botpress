import { describe, assert, expect, test } from 'vitest'

import { Tool } from './tool.js'
import { llmz } from './llmz.js'

import { z } from '@bpinternal/zui'

import { getCachedCognitiveClient } from './__tests__/index.js'
import { Exit } from './exit.js'
import { SnapshotSignal } from './errors.js'

const client = getCachedCognitiveClient()

const MATRIX_MOVIE_ID = 'Matrix_1124'
const MOVIES = [
  { id: 'Inception_1125', title: 'Inception', price: 12 },
  { id: MATRIX_MOVIE_ID, title: 'Ze MaTriX', price: 10 },
  { id: 'Interstellar_1126', title: 'Interstellar', price: 15 },
]

const PAYMENT_INTENT_ID = 'pi_1J2e3f4g5h6i7j8k9l0'
const TICKET_ID = 'T-123'

const tBuyMovieTicket = () =>
  new Tool({
    name: 'buyMovieTicket',
    description: 'Buy a ticket for a movie',
    input: z.object({
      movieId: z.string(),
      paymentIntentId: z.string(),
    }),
    output: z.object({
      ticketId: z.string(),
    }),
    handler: async (input) => {
      if (PAYMENT_INTENT_ID !== input.paymentIntentId) {
        throw new Error('Invalid payment intent id')
      }

      if (input.movieId !== MATRIX_MOVIE_ID) {
        throw new Error('Invalid movie')
      }

      return { ticketId: TICKET_ID }
    },
  })

const tListMovies = () =>
  new Tool({
    name: 'listMovies',
    output: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        price: z.number(),
      })
    ),
    handler: async () => MOVIES,
  })

const tGetPaymentIntent = () =>
  new Tool({
    name: 'getPaymentIntent',
    input: z.object({ amount: z.number() }),
    output: z.object({ paymentIntent: z.string() }),
    handler: async () => {
      throw new SnapshotSignal('payment needed')
    },
  })

describe('snapshots', { retry: 0, timeout: 10_000 }, async () => {
  const eDone = new Exit({
    name: 'done',
    description: 'when you purchased a ticket',
    schema: z.object({
      ticketId: z.string(),
    }),
  })

  const eAbandon = new Exit({
    name: 'cancel',
    description: 'when you need to cancel the purchase',
    schema: z.object({
      reason: z.string(),
    }),
  })

  const result = await llmz.executeContext({
    client,
    instructions:
      'You are a blockbuster operator. You need to help customers buy tickets for movies. Once you have the movie, go straight to the payment intent.',
    tools: [tListMovies(), tBuyMovieTicket(), tGetPaymentIntent()],
    transcript: [
      {
        role: 'user',
        name: 'John',
        content: 'hello can I buy a ticket for the um..., it is called zematrix or something?',
      },
    ],
    exits: [eDone, eAbandon],
  })

  test('an execute signal creates a snapshot', async () => {
    assert(result.status === 'interrupted')
    expect(result.signal).toBeInstanceOf(SnapshotSignal)
    expect(result.snapshot).toBeDefined()
    expect(result.snapshot.reason).toBe('payment needed')

    assert(!!result.snapshot.toolCall)
    expect(result.snapshot.toolCall.name).toBe(tGetPaymentIntent().name)
    expect(result.snapshot.toolCall.input).toEqual({ amount: 10 })
    expect(result.snapshot.toolCall.inputSchema).toEqual(tGetPaymentIntent().zInput.toJsonSchema())
    expect(result.snapshot.toolCall.outputSchema).toEqual(tGetPaymentIntent().zOutput.toJsonSchema())
  })

  test('cannot resume from a snapshot without resolving it', async () => {
    assert(result.status === 'interrupted')

    const snapshot = result.snapshot.clone()
    assert(snapshot.status.type === 'pending')

    const final = await llmz.executeContext({
      client,
      instructions: result.context.instructions,
      transcript: result.context.transcript,
      objects: result.context.objects,
      components: result.context.components,
      tools: result.context.tools,
      exits: result.context.exits,
      snapshot,
    })

    assert(final.status === 'error')
    expect(final.error).toMatch(/still pending/)
  })

  test('a snapshot can be resolved', async () => {
    assert(result.status === 'interrupted')

    const snapshot = result.snapshot.clone()

    snapshot.resolve({
      paymentIntentId: PAYMENT_INTENT_ID,
    })

    const final = await llmz.executeContext({
      client,
      instructions: result.context.instructions,
      transcript: result.context.transcript,
      objects: result.context.objects,
      components: result.context.components,
      tools: result.context.tools,
      exits: result.context.exits,
      snapshot,
    })

    assert(final.status === 'success')
    const lastIteration = final.iterations.at(-1)

    assert(!!lastIteration)
    assert(lastIteration.hasExitedWith(eDone))
    expect(lastIteration.status.exit_success.return_value.ticketId).toBe(TICKET_ID)
  })

  test('a snapshot can be rejected', async () => {
    assert(result.status === 'interrupted')

    const snapshot = result.snapshot.clone()

    snapshot.reject({
      message: 'Payment system is down, try later',
    })

    const final = await llmz.executeContext({
      client,
      instructions: result.context.instructions,
      transcript: result.context.transcript,
      objects: result.context.objects,
      components: result.context.components,
      tools: result.context.tools,
      exits: result.context.exits,
      snapshot,
    })

    assert(final.status === 'success')
    const lastIteration = final.iterations.at(-1)

    assert(!!lastIteration)
    assert(lastIteration.hasExitedWith(eAbandon))
    expect(lastIteration.status.exit_success.return_value.reason).toBeDefined()
  })
})
