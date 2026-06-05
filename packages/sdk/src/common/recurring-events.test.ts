import { test, expect } from 'vitest'
import { resolveRecurrence } from './recurring-events'
import { z } from '../zui'

// resolveRecurrence

test('resolveRecurrence returns undefined events and recurringEvents when no events passed', () => {
  const result = resolveRecurrence(undefined, undefined)
  expect(result.events).toBeUndefined()
  expect(result.recurringEvents).toBeUndefined()
})

test('resolveRecurrence returns events and undefined recurringEvents when events have no recurrence field', () => {
  const schema = z.object({})
  const result = resolveRecurrence({ plain: { schema } }, undefined)
  expect(result.events?.plain?.schema).toBe(schema)
  expect(result.recurringEvents).toBeUndefined()
})

test('resolveRecurrence strips recurrence from events', () => {
  const result = resolveRecurrence(
    { heartbeat: { schema: z.object({}), recurrence: { cron: '*/5 * * * *', payload: {} } } },
    undefined
  )
  expect(result.events?.heartbeat).not.toHaveProperty('recurrence')
})

test('resolveRecurrence derives a recurringEvents entry from an inline recurrence field', () => {
  const result = resolveRecurrence(
    { heartbeat: { schema: z.object({}), recurrence: { cron: '*/5 * * * *', payload: {} } } },
    undefined
  )
  expect(result.recurringEvents).toEqual({
    heartbeat: { type: 'heartbeat', schedule: { cron: '*/5 * * * *' }, payload: {} },
  })
})

test('resolveRecurrence only derives recurringEvents entries for events that have a recurrence field', () => {
  const result = resolveRecurrence(
    {
      heartbeat: { schema: z.object({}), recurrence: { cron: '*/5 * * * *', payload: {} } },
      plain: { schema: z.object({}) },
    },
    undefined
  )
  expect(Object.keys(result.recurringEvents ?? {})).toEqual(['heartbeat'])
})

test('resolveRecurrence preserves explicit recurringEvents when there are no inline recurrence events', () => {
  const result = resolveRecurrence(
    { plain: { schema: z.object({}) } },
    { dailyDigest: { type: 'plain', schedule: { cron: '0 9 * * *' }, payload: {} } }
  )
  expect(result.recurringEvents).toEqual({
    dailyDigest: { type: 'plain', schedule: { cron: '0 9 * * *' }, payload: {} },
  })
})

test('resolveRecurrence: explicit recurringEvents overrides inline recurrence for the same key', () => {
  const result = resolveRecurrence(
    {
      heartbeat: {
        schema: z.object({}),
        recurrence: { cron: '*/5 * * * *', payload: { from: 'inline' } },
      },
    },
    { heartbeat: { type: 'heartbeat', schedule: { cron: '0 * * * *' }, payload: { from: 'explicit' } } }
  )
  expect(result.recurringEvents?.heartbeat).toEqual({
    type: 'heartbeat',
    schedule: { cron: '0 * * * *' },
    payload: { from: 'explicit' },
  })
})

test('resolveRecurrence merges derived and explicit entries with different keys', () => {
  const result = resolveRecurrence(
    { heartbeat: { schema: z.object({}), recurrence: { cron: '*/5 * * * *', payload: {} } } },
    { dailyDigest: { type: 'heartbeat', schedule: { cron: '0 9 * * *' }, payload: {} } }
  )
  expect(Object.keys(result.recurringEvents ?? {}).sort()).toEqual(['dailyDigest', 'heartbeat'])
})
