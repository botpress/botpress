import { test, expect } from 'vitest'
import { stripRecurringFromEvents, resolveRecurringEvents } from './recurring-events'
import { z } from '../zui'

// stripRecurringFromEvents

test('stripRecurringFromEvents returns undefined when events is undefined', () => {
  expect(stripRecurringFromEvents(undefined)).toBeUndefined()
})

test('stripRecurringFromEvents removes the recurring field from events', () => {
  const result = stripRecurringFromEvents({
    heartbeat: { schema: z.object({}), recurring: { schedule: { cron: '*/5 * * * *' }, payload: {} } },
  })
  expect(result?.heartbeat).not.toHaveProperty('recurring')
})

test('stripRecurringFromEvents preserves other event fields', () => {
  const result = stripRecurringFromEvents({
    heartbeat: {
      schema: z.object({}),
      attributes: { foo: 'bar' },
      recurring: { schedule: { cron: '*/5 * * * *' }, payload: {} },
    },
  })
  expect(result?.heartbeat).toHaveProperty('attributes', { foo: 'bar' })
  expect(result?.heartbeat).toHaveProperty('schema')
})

test('stripRecurringFromEvents handles events without a recurring field', () => {
  const input = { plain: { schema: z.object({}) } }
  const result = stripRecurringFromEvents(input)
  expect(result?.plain).not.toHaveProperty('recurring')
  expect(result?.plain?.schema).toBe(input.plain.schema)
})

// resolveRecurringEvents

test('resolveRecurringEvents returns undefined when there are no events and no explicit recurringEvents', () => {
  expect(resolveRecurringEvents(undefined, undefined)).toBeUndefined()
})

test('resolveRecurringEvents returns undefined when events have no recurring field and no explicit recurringEvents', () => {
  expect(resolveRecurringEvents({ plain: { schema: z.object({}) } }, undefined)).toBeUndefined()
})

test('resolveRecurringEvents derives a recurringEvents entry from an inline recurring field', () => {
  const result = resolveRecurringEvents(
    { heartbeat: { schema: z.object({}), recurring: { schedule: { cron: '*/5 * * * *' }, payload: { ts: '' } } } },
    undefined
  )
  expect(result).toEqual({
    heartbeat: { type: 'heartbeat', schedule: { cron: '*/5 * * * *' }, payload: { ts: '' } },
  })
})

test('resolveRecurringEvents only derives entries for events that have a recurring field', () => {
  const result = resolveRecurringEvents(
    {
      heartbeat: { schema: z.object({}), recurring: { schedule: { cron: '*/5 * * * *' }, payload: { ts: '' } } },
      plain: { schema: z.object({}) },
    },
    undefined
  )
  expect(Object.keys(result ?? {})).toEqual(['heartbeat'])
})

test('resolveRecurringEvents preserves explicit recurringEvents when there are no inline recurring events', () => {
  const result = resolveRecurringEvents(
    { plain: { schema: z.object({}) } },
    { dailyDigest: { type: 'plain', schedule: { cron: '0 9 * * *' }, payload: {} } }
  )
  expect(result).toEqual({
    dailyDigest: { type: 'plain', schedule: { cron: '0 9 * * *' }, payload: {} },
  })
})

test('resolveRecurringEvents: explicit recurringEvents overrides inline recurring for the same key', () => {
  const result = resolveRecurringEvents(
    {
      heartbeat: {
        schema: z.object({}),
        recurring: { schedule: { cron: '*/5 * * * *' }, payload: { from: 'inline' } },
      },
    },
    { heartbeat: { type: 'heartbeat', schedule: { cron: '0 * * * *' }, payload: { from: 'explicit' } } }
  )
  expect(result?.heartbeat).toEqual({
    type: 'heartbeat',
    schedule: { cron: '0 * * * *' },
    payload: { from: 'explicit' },
  })
})

test('resolveRecurringEvents merges derived and explicit entries with different keys', () => {
  const result = resolveRecurringEvents(
    { heartbeat: { schema: z.object({}), recurring: { schedule: { cron: '*/5 * * * *' }, payload: {} } } },
    { dailyDigest: { type: 'heartbeat', schedule: { cron: '0 9 * * *' }, payload: {} } }
  )
  expect(Object.keys(result ?? {}).sort()).toEqual(['dailyDigest', 'heartbeat'])
})
