import { test, expect } from 'vitest'
import { PluginDefinition } from './definition'
import { z } from '../zui'

test('PluginDefinition strips recurrence from events', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      heartbeat: {
        schema: z.object({}),
        recurrence: { cron: '*/5 * * * *', payload: {} },
      },
    },
  })

  expect(plugin.events?.heartbeat).not.toHaveProperty('recurrence')
})

test('PluginDefinition converts inline recurrence to a recurringEvents entry', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      heartbeat: {
        schema: z.object({}),
        recurrence: { cron: '*/5 * * * *', payload: {} },
      },
    },
  })

  expect(plugin.recurringEvents?.heartbeat).toEqual({
    type: 'heartbeat',
    schedule: { cron: '*/5 * * * *' },
    payload: {},
  })
})

test('PluginDefinition recurringEvents is undefined when no recurring events are defined', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      plain: { schema: z.object({}) },
    },
  })

  expect(plugin.recurringEvents).toBeUndefined()
})

test('PluginDefinition: explicit recurringEvents overrides inline recurrence for the same key', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      heartbeat: {
        schema: z.object({}),
        recurrence: { cron: '*/5 * * * *', payload: { foo: 'foo' } },
      },
    },
    recurringEvents: {
      heartbeat: { type: 'heartbeat', schedule: { cron: '0 * * * *' }, payload: { bar: 'bar' } },
    },
  })

  expect(plugin.recurringEvents?.heartbeat).toEqual({
    type: 'heartbeat',
    schedule: { cron: '0 * * * *' },
    payload: { bar: 'bar' },
  })
})

test('PluginDefinition: explicit recurringEvents with no inline counterpart is preserved', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      heartbeat: { schema: z.object({}) },
    },
    recurringEvents: {
      dailyDigest: { type: 'heartbeat', schedule: { cron: '0 9 * * *' }, payload: {} },
    },
  })

  expect(plugin.recurringEvents?.dailyDigest).toEqual({
    type: 'heartbeat',
    schedule: { cron: '0 9 * * *' },
    payload: {},
  })
})

test('PluginDefinition: two explicit recurringEvents entries with different keys both survive', () => {
  const plugin = new PluginDefinition({
    name: 'myplugin',
    version: '1.0.0',
    events: {
      tick: { schema: z.object({}) },
    },
    recurringEvents: {
      tickEvery6: { type: 'tick', schedule: { cron: '*/6 * * * *' }, payload: {} },
      tickEvery7: { type: 'tick', schedule: { cron: '*/7 * * * *' }, payload: {} },
    },
  })

  expect(plugin.recurringEvents?.tickEvery6).toEqual({ type: 'tick', schedule: { cron: '*/6 * * * *' }, payload: {} })
  expect(plugin.recurringEvents?.tickEvery7).toEqual({ type: 'tick', schedule: { cron: '*/7 * * * *' }, payload: {} })
})
