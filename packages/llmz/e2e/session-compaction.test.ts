import { z } from '@bpinternal/zui'
import { assert, describe, expect, it } from 'vitest'
import { Exit, Session, execute } from '../src/index.js'
import { cases, client, expectAcceptedProtocol, expectRuntimeModelRoute, models } from './__tests__/model-evaluation.js'

const enabled = models.length > 0 && Boolean(process.env.CLOUD_PAT && process.env.CLOUD_BOT_ID)

// Only provider generation is live. The payment receipt below is synthetic history.
describe.skipIf(!enabled).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'session compaction: $model, sample $run',
  ({ model }) => {
    it(
      'summarizes, persists a summary, and resumes from a queued user event',
      { retry: 0, timeout: 120_000 },
      async () => {
        const session = new Session({ variables: { locale: 'en-CA' } })
        session.append({ role: 'user', content: 'Pay order-42 once, then wait for me to click the shipping button.' })
        const iteration = session.nextIteration('payment')
        session.appendAssistant(iteration.id, {
          output: '',
          toolCalls: [{ id: 'payment-call', name: 'run_javascript', input: { code: 'return inspect(await pay());' } }],
        })
        session.appendToolResult(
          iteration.id,
          'payment-call',
          'Payment succeeded. Order: order-42. Receipt: receipt-73.'
        )
        session.commitIteration({ ...iteration, hasResult: true, result: { paid: true } })
        session.settleIteration(iteration.id)
        session.completeTurn()
        const event = {
          role: 'event' as const,
          name: 'button.clicked',
          payload: { button: 'shipping', eventId: 'click-19' },
        }
        session.append(event)
        const before = session.toJSON()
        const options = { client, model, maxTokens: 512, signal: AbortSignal.timeout(90_000) }

        const preview = await session.summarize(options)
        expect(preview?.content).toContain('order-42')
        expect(preview?.content).toContain('receipt-73')
        expect(session.toJSON()).toEqual(before)

        const summary = await session.compact({ ...options, keepRecentIterations: 0 })
        expect(summary?.content).toContain('receipt-73')
        expect(session.transcript).toEqual([summary, event])
        expect(session.retainedIterationIds).toEqual([])
        const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
        expect(restored.transcript).toEqual(session.transcript)
        expect(restored.memory.variables).toEqual({ locale: 'en-CA' })

        const reviewed = new Exit({
          name: 'reviewed',
          description: 'Report the order state and the latest user interaction.',
          schema: z.object({
            orderId: z.string(),
            receipt: z.string(),
            paid: z.boolean(),
            eventId: z.string(),
            button: z.string(),
          }),
        })
        const result = await execute({
          session: restored,
          client,
          model,
          exits: [reviewed],
          instructions:
            'React to the latest external event. Use the conversation summary to report the confirmed payment and the event payload to report the interaction. Finish with the reviewed exit.',
          options: { loop: 3, timeout: 45_000, maxTokens: 12_000 },
        })

        expectAcceptedProtocol(result)
        expectRuntimeModelRoute(result, model)
        assert(result.is(reviewed), result.isError() ? String(result.error) : 'Expected reviewed exit')
        expect(result.output).toEqual({
          orderId: 'order-42',
          receipt: 'receipt-73',
          paid: true,
          eventId: 'click-19',
          button: 'shipping',
        })
      }
    )
  }
)
