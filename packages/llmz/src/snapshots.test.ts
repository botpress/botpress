import { describe } from 'vitest'

// const MATRIX_MOVIE_ID = 'Matrix_1124'
// const MOVIES = [
//   { id: MATRIX_MOVIE_ID, title: 'Ze MaTriX', price: 10 },
//   { id: 'Inception_1125', title: 'Inception', price: 12 },
//   { id: 'Interstellar_1126', title: 'Interstellar', price: 15 }
// ]

// const PAYMENT_INTENT_ID = 'pi_1J2e3f4g5h6i7j8k9l0'
// const TICKET_ID = 'T-123'

// const tBuyMovieTicket = () =>
//   makeTool({
//     name: 'buyMovieTicket',
//     description: 'Buy a ticket for a movie',
//     input: z.object({
//       movieId: z.string(),
//       paymentIntentId: z.string()
//     }),
//     output: z.promise(
//       z.object({
//         ticketId: z.string()
//       })
//     ),
//     fn: async (input) => {
//       if (PAYMENT_INTENT_ID !== input.paymentIntentId) {
//         throw new Error('Invalid payment intent id')
//       }

//       if (input.movieId !== MATRIX_MOVIE_ID) {
//         throw new Error('Invalid movie')
//       }

//       return { ticketId: TICKET_ID }
//     }
//   })

// const tListMovies = () =>
//   makeTool({
//     name: 'listMovies',
//     output: z.promise(
//       z.array(
//         z.object({
//           id: z.string(),
//           title: z.string(),
//           price: z.number()
//         })
//       )
//     ),
//     fn: async () => MOVIES
//   })

// const tGetPaymentIntent = () =>
//   makeTool({
//     name: 'getPaymentIntent',
//     input: z.object({ amount: z.number() }),
//     output: z.promise(z.object({ paymentIntent: z.string() })),
//     fn: async (_input, ctx) => {
//       ctx.executeQueuedSkills()
//       throw new Error('Will not reach this point')
//     }
//   })

// const tThink = () =>
//   makeTool({
//     name: 'think',
//     description: 'Request to think and process the output before continuing',
//     input: z.object({
//       reason: z.string().describe('What do you need to think about? Why are you pausing and requesting to think?'),
//       context: z
//         .record(z.any())
//         .optional()
//         .describe('Any data you need to look at before continuing? This includes tool outputs etc.')
//     }),
//     output: z.void(),
//     fn: (input, ctx) => ctx.think(input.reason, input.context)
//   })

// const getMovieObject = () =>
//   makeObject({
//     name: 'movies',
//     properties: [
//       {
//         type: z.object({
//           id: z.string(),
//           title: z.string(),
//           price: z.number()
//         }),
//         name: 'nowShowing',
//         value: MOVIES
//       }
//     ],
//     tools: [tListMovies(), tBuyMovieTicket(), tGetPaymentIntent(), tThink()]
//   })

describe.skip('llmz/snapshots', { retry: 0, timeout: 10_000 }, () => {
  //   describe('snapshot creation', async () => {
  //     it('an execute signal creates a snapshot', async () => {
  //       const context = llmz.createContext({
  //         instructions:
  //           "You are a blockbuster operator. You need to help customers buy tickets for movies. Once you have the movie, don't confirm, go straight to the payment intent.",
  //         loop: 3,
  //         objects: [getMovieObject()],
  //         tools: [tThink()],
  //         transcript: [
  //           {
  //             role: 'user',
  //             name: 'John',
  //             content: 'hello can I buy a ticket for the um..., it is called zematrix or something?'
  //           }
  //         ]
  //       })
  //       const updated = await llmz.executeContext({ context, cognitive })
  //       expectStatus(updated, 'interrupted')
  //       assert(updated.signal instanceof ExecuteSignal)
  //       expect(updated.signal.toolCall?.assignment).toBeDefined()
  //       expect(updated.signal.toolCall?.assignment).toHaveProperty('evalFn')
  //       expect(updated.signal.toolCall?.assignment?.evalFn.toLowerCase()).toContain('payment')
  //       expect(updated.signal.toolCall?.name).toBe(`getPaymentIntent`)
  //       const snapshot = updated.snapshot
  //       expect(snapshot.callbacks).toHaveLength(2)
  //       expect(snapshot.callbacks[0].type).toBe('resolve')
  //       expect(snapshot.callbacks[0].schema).toBeDefined()
  //       expect(snapshot.callbacks[0].description).toBe('Execution of tool "getPaymentIntent" succeeded')
  //       expect(snapshot.callbacks[1].type).toBe('reject')
  //       expect(snapshot.callbacks[1].schema).toBeUndefined()
  //     })
  //     it.todo('small variables are included in snapshot', async () => {})
  //     it.todo('large variables are excluded from snapshot', async () => {})
  //   })
  //   describe('snapshot restore', async () => {
  //     it('restore snapshot by resolving signal callback', async () => {
  //       const instructions =
  //         'You are a blockbuster operator. You need to help customers buy tickets for movies. Do not confirm before getting the payment intent. Once you have the payment intent, you can proceed to buy the ticket.'
  //       const context = await llmz.createContext({
  //         instructions,
  //         loop: 2,
  //         tools: [tThink()],
  //         objects: [getMovieObject()],
  //         transcript: [
  //           {
  //             role: 'user',
  //             name: 'John',
  //             content: 'hello can I buy a ticket for the Ze Matrix?'
  //           }
  //         ]
  //       })
  //       const updated = await llmz.executeContext({ context, cognitive })
  //       expectStatus(updated, 'interrupted')
  //       assert(updated.signal instanceof ExecuteSignal)
  //       const snapshot = updated.snapshot
  //       ////////////////////////////////////////////////////////////////////////////
  //       ///////////////////////////////////////////////////////////////////////////
  //       const newContext = llmz.createContext({
  //         instructions,
  //         loop: 5,
  //         tools: [tThink()],
  //         objects: [getMovieObject()],
  //         transcript: [
  //           {
  //             role: 'user',
  //             name: 'John',
  //             content: 'hello can I buy a ticket for the Ze Matrix?'
  //           },
  //           {
  //             name: 'Assistant',
  //             role: 'assistant',
  //             content: 'Hey John! Let me check the movie details for you. One moment please...'
  //           }
  //         ]
  //       })
  //       const restored = llmz.resolveContextSnapshot({
  //         snapshot,
  //         context: newContext,
  //         value: { paymentIntent: PAYMENT_INTENT_ID }
  //       })
  //       expect(restored.partialExecutionMessages).toHaveLength(1)
  //       expect(restored.partialExecutionMessages[0].content).toContain('## Important message from the VM')
  //       expect(restored.partialExecutionMessages[0].content).toContain('Ze MaTriX')
  //       expect(restored.partialExecutionMessages[0].content).toContain('movies.getPaymentIntent')
  //       expect(restored.partialExecutionMessages[0].content).toContain(`"paymentIntent": "pi_1J2e3f4g5h6i7j8k9l0"`)
  //       const final = await llmz.executeContext({ context: newContext, cognitive })
  //       expectStatus(final, 'success')
  //       expect(final.iterations.length).toBeGreaterThanOrEqual(1)
  //       check(final.iterations.at(-1)!, 'successfully bought a ticket for the movie "Ze MaTriX"').toBe(true)
  //     })
  //     it('restore snapshot by rejecting signal callback', async () => {
  //       const instructions = 'You are a blockbuster operator. You need to help customers buy tickets for movies'
  //       const context = await llmz.createContext({
  //         instructions,
  //         loop: 2,
  //         tools: [tThink()],
  //         objects: [getMovieObject()],
  //         transcript: [
  //           {
  //             role: 'user',
  //             name: 'John',
  //             content: 'hello can I buy a ticket for the Ze Matrix?'
  //           }
  //         ]
  //       })
  //       const updated = await llmz.executeContext({ context, cognitive })
  //       expectStatus(updated, 'interrupted')
  //       assert(updated.signal instanceof ExecuteSignal)
  //       const snapshot = updated.snapshot
  //       ////////////////////////////////////////////////////////////////////////////
  //       ///////////////////////////////////////////////////////////////////////////
  //       const restored = llmz.rejectContextSnapshot({
  //         snapshot,
  //         context: newContext,
  //         error: new Error('Error: CAPACITY MAXED. Movie "Ze Matrix" is sold out.')
  //       })
  //       expect(restored.partialExecutionMessages).toHaveLength(1)
  //       expect(restored.partialExecutionMessages.slice(-1)[0].content).toContain('"getPaymentIntent" failed')
  //       expect(restored.partialExecutionMessages.slice(-1)[0].content).toContain('CAPACITY MAXED')
  //       const final = await llmz.executeContext({
  //         instructions,
  //         tools: [tThink()],
  //         objects: [getMovieObject()],
  //         transcript: [
  //           {
  //             role: 'user',
  //             name: 'John',
  //             content: 'hello can I buy a ticket for the Ze Matrix?'
  //           },
  //           {
  //             name: 'Assistant',
  //             role: 'assistant',
  //             content: 'Hey John! Let me check the movie details for you. One moment please...'
  //           }
  //         ],
  //         cognitive
  //       })
  //       expectStatus(final, 'success')
  //       expect(final.iterations.length).toBeGreaterThanOrEqual(1)
  //     })
  //   })
})
