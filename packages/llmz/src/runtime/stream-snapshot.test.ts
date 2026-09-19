import type { CognitiveStreamChunk } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Chat } from '../chat.js'
import type { RuntimeGenerateContentInput } from '../custom-client.js'
import { SnapshotSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Snapshot } from '../snapshots.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const Completed = new Exit({
  name: 'completed',
  description: 'Complete after approval.',
  schema: z.object({ saved: z.number(), approved: z.boolean() }),
})

describe('snapshots from overlapping execution and response streams', () => {
  test.each(['transport', 'restart', 'cancel'] as const)(
    'preserves the pending operation after a late %s failure',
    async (failure) => {
      const launch = vi.fn(() => {
        throw new SnapshotSignal('Approval is pending.')
      })
      const after = vi.fn()
      const handler = vi.fn()
      const controller = new AbortController()
      let executionComplete!: () => void
      const completed = new Promise<void>((resolve) => {
        executionComplete = resolve
      })
      const transportError = 'Transport failed bp_pat_testSecret.\u0000' + 'x'.repeat(3000)

      class InterruptedStream extends NativeClient {
        public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
          const response = await this.generateText(input)
          yield { created: 1, toolCalls: response.toolCalls }
          await completed

          if (failure === 'transport') {
            throw new Error(transportError)
          }

          if (failure === 'restart') {
            yield {
              created: 2,
              restart: { attempt: 2, fromModel: 'fake', toModel: 'replacement', reason: 'Transport failed' },
            }
            return
          }

          controller.abort(new Error('Stream cancelled after the operation started.'))
        }
      }

      const tools = [new Tool({ name: 'launch', handler: launch }), new Tool({ name: 'after', handler: after })]
      const client = new InterruptedStream([
        javascript('const saved = 15; const approval = await launch(); await after(); return exit();'),
      ])
      const first = await executeContext({
        client,
        tools,
        exits: [Completed],
        chat: new Chat({ handler, onMessageDelta: () => {} }),
        signal: controller.signal,
        options: { midStreamFallback: true },
        onTrace: ({ trace }) => {
          if (trace.type === 'code_execution') {
            executionComplete()
          }
        },
      })

      expect(first.isInterrupted()).toBe(true)
      expect(client.requests).toHaveLength(1)
      expect(first.iteration?.llm?.status).toBe('error')
      expect(first.session.pendingCalls).toHaveLength(1)
      expect(first.session.memory.iterations[0]?.outcome).toBe('callback_requested')
      expect(first.session.memory.variables).toEqual({ saved: 15 })
      expect(launch).toHaveBeenCalledOnce()
      expect(after).not.toHaveBeenCalled()
      expect(handler).not.toHaveBeenCalled()

      if (!first.isInterrupted()) {
        throw new Error('Expected the started operation to retain its snapshot.')
      }

      const persisted = JSON.parse(JSON.stringify(first.snapshot))
      const snapshot = Snapshot.fromJSON(persisted)
      const pending = snapshot.pendingCall!

      expect(pending.interruption).toBeTruthy()
      expect(pending.interruption!.length).toBeLessThanOrEqual(2000)
      expect(pending.interruption).not.toContain('bp_pat_testSecret')
      expect(pending.interruption).not.toContain('\u0000')

      snapshot.resolve({ approved: true })
      const resumedClient = new NativeClient([
        javascript('return exit("completed", { saved, approved: approval.approved });'),
      ])
      const resumed = await executeContext({ client: resumedClient, snapshot, tools, exits: [Completed] })

      expect(resumed.output).toEqual({ saved: 15, approved: true })
      expect(resumed.session.pendingCalls).toHaveLength(0)
      expect(launch).toHaveBeenCalledOnce()
      expect(after).not.toHaveBeenCalled()
      const feedback = resumedClient.requests[0]?.messages.find(
        (message) => message.toolResultCallId === pending.callId
      )

      expect(feedback?.content).toContain('response stream failed after this operation started')
      expect(feedback?.content).toContain(pending.interruption)
    }
  )
})
