import { z } from '@bpinternal/zui'
import { assert, describe, expect, it } from 'vitest'
import {
  Exit,
  ObjectInstance,
  Session,
  Snapshot,
  SnapshotSignal,
  Tool,
  execute,
  type ExecutionResult,
} from '../src/index.js'
import {
  cases,
  client,
  expectAcceptedProtocol,
  expectRuntimeModelRoute,
  metrics,
  models,
} from './__tests__/model-evaluation.js'

const enabled = models.length > 0 && Boolean(process.env.CLOUD_PAT && process.env.CLOUD_BOT_ID)
const testOptions = { retry: 0, timeout: 120_000 }
const executionOptions = { loop: 4, timeout: 45_000, maxTokens: 12_000 }

function inspectRun(result: ExecutionResult, phase: string, model: string, run: number): void {
  console.info(JSON.stringify({ scenario: 'native-session', phase, model, run, ...metrics(result) }))
  expectAcceptedProtocol(result)
  expectRuntimeModelRoute(result, model)
  expect(result.iterations.length).toBeLessThanOrEqual(executionOptions.loop)
}

function restoreSession(session: Session): Session {
  return Session.fromJSON(JSON.parse(JSON.stringify(session)))
}

// Live provider calls are opt-in. All business tools below only touch local fixture state.
describe.skipIf(!enabled).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'native session: $model, sample $run',
  ({ model, run }) => {
    it('restores named memory and newest-first results across turns without rereading', testOptions, async () => {
      let reads = 0
      const account = { id: 'memory-account-7', plan: 'standard' }
      const readAccount = new Tool({
        name: 'readAccount',
        description: 'Read the local account fixture once. Retain the returned account for later turns.',
        output: z.object({ id: z.string(), plan: z.string() }),
        handler: async () => {
          reads++

          return account
        },
      })
      const loaded = new Exit({
        name: 'loaded',
        description: 'Finish after loading the account and observing both sequence results.',
        schema: z.object({ accountId: z.string() }),
      })
      const first = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        tools: [readAccount],
        exits: [loaded],
        messages: [{ role: 'user', content: 'Load the account and establish two sequential memory results.' }],
        instructions: [
          'Complete this finite memory fixture in three responses.',
          'First call run_javascript with: const account = await readAccount(); return inspect({ sequence: 1, accountId: account.id });',
          'After observing that result, call run_javascript with: return inspect({ sequence: 2, accountId: account.id, previousSequence: $return.sequence, previousIterationSequence: $iterations[0].result.sequence });',
          'After observing the second result, call run_javascript with: return exit("loaded", { accountId: $return.accountId }); Do not read the account again.',
        ].join('\n'),
      })

      inspectRun(first, 'memory-load', model, run)
      assert(first.is(loaded), JSON.stringify(metrics(first)))
      expect(first.output).toEqual({ accountId: account.id })
      expect(reads).toBe(1)
      expect(first.session.memory.variables.account).toEqual(account)
      expect(first.session.memory.getBindings().$return).toEqual({
        sequence: 2,
        accountId: account.id,
        previousSequence: 1,
        previousIterationSequence: 1,
      })

      const restored = restoreSession(first.session)
      const retained = restored.memory.iterations

      expect(retained[0]?.hasResult).toBe(false)
      expect(retained.filter((entry) => entry.hasResult).map((entry) => entry.result)).toEqual([
        {
          sequence: 2,
          accountId: account.id,
          previousSequence: 1,
          previousIterationSequence: 1,
        },
        { sequence: 1, accountId: account.id },
      ])
      expect(retained.map((entry) => entry.number)).toEqual(
        retained.map((entry) => entry.number).sort((left, right) => right - left)
      )

      const verified = new Exit({
        name: 'verified',
        description: 'Finish with the memory audit returned by JavaScript.',
        schema: z.object({
          accountId: z.string(),
          latestSequence: z.number(),
          previousSequence: z.number(),
          retainedSequences: z.array(z.number()),
          latestHasResult: z.boolean(),
        }),
      })
      const second = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        session: restored,
        tools: [readAccount],
        exits: [verified],
        messages: [{ role: 'user', content: 'Audit the restored memory using JavaScript. Do not reread the account.' }],
        instructions: [
          'The previous turn completed. This is a new memory audit task.',
          'Call run_javascript once with: return inspect({ accountId: account.id, latestSequence: $return.sequence, previousSequence: $iterations[1].result.sequence, retainedSequences: $iterations.filter(entry => entry.hasResult).map(entry => entry.result.sequence), latestHasResult: $iterations[0].hasResult });',
          'Then call run_javascript with: return exit("verified", $return); Do not call readAccount or rerun prior code.',
        ].join('\n'),
      })

      inspectRun(second, 'memory-restore', model, run)
      assert(second.is(verified), JSON.stringify(metrics(second)))
      const expectedAudit = {
        accountId: account.id,
        latestSequence: 2,
        previousSequence: 2,
        retainedSequences: [2, 1],
        latestHasResult: false,
      }

      expect(second.output).toEqual(expectedAudit)
      expect(second.session.memory.getBindings().$return).toEqual(expectedAudit)
      expect(second.session.memory.variables.account).toEqual(account)
      expect(second.session.turn).toBe(first.session.turn + 1)
      expect(reads).toBe(1)
    })

    it('retains whole-property updates through unchanged host state and compaction', testOptions, async () => {
      const hostProfile = { region: 'east', quota: 3 }
      const settings = new ObjectInstance({
        name: 'settings',
        properties: [
          {
            name: 'profile',
            value: hostProfile,
            writable: true,
            type: z.object({ region: z.enum(['east', 'west']), quota: z.number().int().min(0).max(10) }),
          },
          { name: 'id', value: 'settings-4', writable: false, type: z.string() },
        ],
      })
      const checked = new Exit({
        name: 'checked',
        description: 'Finish with the observed settings values.',
        schema: z.object({ id: z.string(), region: z.string(), quota: z.number() }),
      })
      const memoryReports: string[] = []
      const first = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        objects: [settings],
        exits: [checked],
        messages: [{ role: 'user', content: 'Set the profile quota to 4 while retaining its region and settings id.' }],
        instructions: [
          'Read the current values, schemas, and access rules in Memory.',
          'Use one run_javascript call: settings.profile = { ...settings.profile, quota: 4 }; return inspect({ id: settings.id, ...settings.profile });',
          'Assign the entire writable profile property. Do not mutate a nested field or the read-only id.',
          'After inspecting the returned values, call run_javascript with: return exit("checked", $return);',
        ].join('\n'),
        onIterationStart: (iteration) => {
          memoryReports.push(String(iteration.messages.at(-1)?.content))
        },
      })

      inspectRun(first, 'object-update', model, run)
      assert(first.is(checked), JSON.stringify(metrics(first)))
      const expected = { id: 'settings-4', region: 'east', quota: 4 }

      expect(first.output).toEqual(expected)
      expect(hostProfile).toEqual({ region: 'east', quota: 3 })
      expect(memoryReports[0]).toContain('settings.profile')
      expect(memoryReports[0]).toContain('quota: 3')
      expect(memoryReports[0]).toContain('min 0')
      expect(memoryReports[0]).toContain('max 10')
      expect(memoryReports[0]).toContain('writable')
      expect(memoryReports[0]).toContain('settings.id')
      expect(memoryReports[0]).toContain('read-only')
      expect(first.session.memory.serialize().objects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            object: 'settings',
            property: 'profile',
            writable: true,
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                quota: expect.objectContaining({ minimum: 0, maximum: 10 }),
              }),
            }),
          }),
        ])
      )

      const persistedProperties = first.session.memory.serialize().objects
      first.session.compact([])
      const restored = restoreSession(first.session)

      expect(restored.retainedIterationIds).toEqual([])
      expect(restored.memory.iterations).toEqual([])
      expect(restored.memory.getBindings().$return).toBeUndefined()
      expect(restored.memory.serialize().objects).toEqual(persistedProperties)

      const restoredMemoryReports: string[] = []
      const second = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        session: restored,
        objects: [settings],
        exits: [checked],
        messages: [{ role: 'user', content: 'Read the retained settings after compaction without modifying them.' }],
        instructions: [
          'The previous update is complete. The current Memory properties are authoritative.',
          'Call run_javascript with: return inspect({ id: settings.id, ...settings.profile });',
          'Then call run_javascript with: return exit("checked", $return); Do not assign any properties.',
        ].join('\n'),
        onIterationStart: (iteration) => {
          restoredMemoryReports.push(String(iteration.messages.at(-1)?.content))
        },
      })

      inspectRun(second, 'object-after-compaction', model, run)
      assert(second.is(checked), JSON.stringify(metrics(second)))
      expect(second.output).toEqual(expected)
      expect(second.session.memory.getBindings().$return).toEqual(expected)
      expect(second.session.memory.getObjectPropertyValue('settings', 'id')).toBe('settings-4')
      expect(second.session.memory.getObjectPropertyValue('settings', 'profile')).toEqual({ region: 'east', quota: 4 })
      expect(restoredMemoryReports[0]).toContain('quota: 4')
      expect(hostProfile).toEqual({ region: 'east', quota: 3 })
    })

    it('resolves a snapshot binding and completes without repeating the completed effect', testOptions, async () => {
      let effects = 0
      let approvalRequests = 0
      let finalizations = 0
      const receipt = { receiptId: 'receipt-local-9' }
      const approval = { approvalId: 'approval-local-2' }
      const completion = { ...receipt, ...approval, completionToken: 'completion-local-42' }
      const tools = [
        new Tool({
          name: 'recordEffect',
          description: 'Record one local fixture effect and return its receipt. Never repeat a completed call.',
          output: z.object({ receiptId: z.string() }),
          handler: async () => {
            effects++

            return receipt
          },
        }),
        new Tool({
          name: 'waitForApproval',
          description: 'Pause once for a fixture approval. The host resolves the pending call later.',
          input: z.object({ receiptId: z.string() }),
          output: z.object({ approvalId: z.string() }),
          handler: async (input) => {
            approvalRequests++
            expect(input.receiptId).toBe(receipt.receiptId)

            throw new SnapshotSignal('The local approval fixture is pending.')
          },
        }),
        new Tool({
          name: 'finishApproval',
          description: 'Finalize the resolved fixture approval exactly once and return its completion token.',
          input: z.object({ receiptId: z.string(), approvalId: z.string() }),
          output: z.object({ receiptId: z.string(), approvalId: z.string(), completionToken: z.string() }),
          handler: async (input) => {
            finalizations++
            expect(input).toEqual({ ...receipt, ...approval })

            return completion
          },
        }),
      ]
      const completed = new Exit({
        name: 'completed',
        description: 'Finish with the receipt, approval, and completion token returned by finishApproval.',
        schema: z.object({ receiptId: z.string(), approvalId: z.string(), completionToken: z.string() }),
      })
      const first = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        tools,
        exits: [completed],
        messages: [{ role: 'user', content: 'Record the local effect and wait for its approval.' }],
        instructions: [
          'Call run_javascript with this sequence, retaining both named bindings:',
          'const receipt = await recordEffect(); const approval = await waitForApproval({ receiptId: receipt.receiptId }); return inspect(await finishApproval({ receiptId: receipt.receiptId, approvalId: approval.approvalId }));',
          'If an operation pauses, it will be resolved by the host. Never repeat completed effects.',
          'After the approval resolves, finishApproval must run exactly once to obtain the completion token.',
          'Once its return is observed, call run_javascript with: return exit("completed", $return);',
        ].join('\n'),
      })

      inspectRun(first, 'snapshot-pause', model, run)
      assert(first.isInterrupted(), JSON.stringify(metrics(first)))
      expect(effects).toBe(1)
      expect(approvalRequests).toBe(1)
      expect(finalizations).toBe(0)
      expect(first.session.memory.variables.receipt).toEqual(receipt)
      expect(first.session.memory.getBindings().$return).toBeUndefined()

      const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(first.snapshot)))
      const pending = snapshot.pendingCall
      assert(pending, 'The snapshot must retain its original native tool-call identity.')
      snapshot.resolve(approval)
      assert(snapshot.session, 'The resolved snapshot must preserve session state.')

      expect(Session.fromJSON(snapshot.session).memory.variables.approval).toEqual(approval)
      expect(snapshot.assignmentError).toBeUndefined()

      const resumed = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        snapshot,
        tools,
        exits: [completed],
        instructions: [
          'Continue the interrupted task. The effect and approval are already completed.',
          'The bindings receipt and approval are restored in Memory. Do not call recordEffect or waitForApproval again.',
          'finishApproval has not run. It is required to obtain the completion token; do not invent that token.',
          'Continue using run_javascript: return inspect(await finishApproval({ receiptId: receipt.receiptId, approvalId: approval.approvalId }));',
          'After observing that return, call run_javascript with: return exit("completed", $return);',
        ].join('\n'),
      })

      inspectRun(resumed, 'snapshot-resume', model, run)
      assert(resumed.is(completed), JSON.stringify(metrics(resumed)))
      expect(resumed.output).toEqual(completion)
      expect(resumed.session.memory.variables).toMatchObject({ receipt, approval })
      expect(resumed.session.memory.getBindings().$return).toEqual(completion)
      expect(resumed.session.pendingCalls).toEqual([])
      expect(resumed.session.messages.filter((message) => message.toolResultCallId === pending.callId)).toHaveLength(1)
      expect(effects).toBe(1)
      expect(approvalRequests).toBe(1)
      expect(finalizations).toBe(1)
    })
  }
)
