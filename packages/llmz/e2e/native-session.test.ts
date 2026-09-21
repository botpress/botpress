import { z } from '@bpinternal/zui'
import { assert, describe, expect, it } from 'vitest'

import { Exit, ObjectInstance, Session, Tool, execute, type ExecutionResult } from '../src/index.js'

import {
  cases,
  client,
  expectAcceptedProtocol,
  expectRuntimeModelRoute,
  metrics,
  models,
} from './__tests__/model-evaluation.js'

const enabled = models.length > 0
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
      const session = new Session()
      session.append([{ role: 'user', content: 'Load the account and establish two sequential memory results.' }])

      const first = await execute({
        session,
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        tools: [readAccount],
        exits: [loaded],
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
      expect(first.session.getBindings().$return).toEqual({
        sequence: 2,
        accountId: account.id,
        previousSequence: 1,
        previousIterationSequence: 1,
      })

      const restored = restoreSession(first.session)
      const retained = restored.iterations

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
      restored.append([
        {
          role: 'user',
          content:
            'Capture the restored memory as it stands now, then return that exact snapshot. Do not reread the account.',
        },
      ])

      const second = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        session: restored,
        tools: [readAccount],
        exits: [verified],

        instructions: [
          'The previous turn completed. Capture a point-in-time snapshot of the restored memory in exactly two responses.',
          'The fields refer to memory before this audit starts. previousSequence means the sequence at the literal history index [1], not the previous distinct sequence number. History includes completion entries without results.',
          'First call run_javascript with exactly: const audit = { accountId: account.id, latestSequence: $return.sequence, previousSequence: $iterations[1].result.sequence, retainedSequences: $iterations.filter(entry => entry.hasResult).map(entry => entry.result.sequence), latestHasResult: $iterations[0].hasResult }; return inspect(audit);',
          'Inspection itself adds a history entry and replaces $return with the audit. That is expected: do not inspect history again, recompute the snapshot, or correct its fields based on the newer history.',
          'Once the audit has been inspected, call run_javascript with exactly: return exit("verified", $return); Return the computed snapshot unchanged, without adding fields or substituting literal values. Do not call readAccount or rerun prior code.',
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
      expect(second.session.getBindings().$return).toEqual(expectedAudit)
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
      const session = new Session()
      session.append([
        { role: 'user', content: 'Set the profile quota to 4 while retaining its region and settings id.' },
      ])

      const first = await execute({
        session,
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        objects: [settings],
        exits: [checked],

        instructions: [
          'Read the current values, schemas, and access rules in Memory.',
          'Use one run_javascript call: settings.profile = { ...settings.profile, quota: 4 }; return inspect({ id: settings.id, ...settings.profile });',
          'Assign the entire writable profile property. Do not mutate a nested field or the read-only id.',
          'After inspecting the returned values, call run_javascript with: return exit("checked", $return);',
        ].join('\n'),
        onBeforeRequest: ({ messages }) => {
          memoryReports.push(String(messages.at(-1)?.content))
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
      first.session.prune([])
      const restored = restoreSession(first.session)

      expect(restored.retainedIterationIds).toEqual([])
      expect(restored.iterations).toEqual([])
      expect(restored.getBindings().$return).toBeUndefined()
      expect(restored.memory.serialize().objects).toEqual(persistedProperties)

      const restoredMemoryReports: string[] = []
      restored.append([
        { role: 'user', content: 'Read the retained settings after compaction without modifying them.' },
      ])

      const second = await execute({
        client,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        options: executionOptions,
        session: restored,
        objects: [settings],
        exits: [checked],

        instructions: [
          'The previous update is complete. The current Memory properties are authoritative.',
          'Call run_javascript with: return inspect({ id: settings.id, ...settings.profile });',
          'Then call run_javascript with: return exit("checked", $return); Do not assign any properties.',
        ].join('\n'),
        onBeforeRequest: ({ messages }) => {
          restoredMemoryReports.push(String(messages.at(-1)?.content))
        },
      })

      inspectRun(second, 'object-after-compaction', model, run)
      assert(second.is(checked), JSON.stringify(metrics(second)))
      expect(second.output).toEqual(expected)
      expect(second.session.getBindings().$return).toEqual(expected)
      expect(second.session.memory.getObjectPropertyValue('settings', 'id')).toBe('settings-4')
      expect(second.session.memory.getObjectPropertyValue('settings', 'profile')).toEqual({ region: 'east', quota: 4 })
      expect(restoredMemoryReports[0]).toContain('quota: 4')
      expect(hostProfile).toEqual({ region: 'east', quota: 3 })
    })
  }
)
