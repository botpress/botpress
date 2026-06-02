import * as sdk from '@botpress/sdk'
import { describe, expect, it } from 'vitest'
import { prepareCreateBotBody } from './bot-body'
import { forOwn } from 'lodash'

describe('prepareCreateBotBody - inline recurring events', () => {
  it('strips recurring from event definitions before sending to the API', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        heartbeat: {
          schema: sdk.z.object({}),
          recurring: { schedule: { cron: '*/5 * * * *' }, payload: { ts: '' } },
        },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.events?.heartbeat).not.toHaveProperty('recurring')
  })

  it('converts inline recurring to a recurringEvents entry', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        heartbeat: {
          schema: sdk.z.object({}),
          recurring: { schedule: { cron: '*/5 * * * *' }, payload: { ts: '' } },
        },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.recurringEvents?.heartbeat).toEqual({
      type: 'heartbeat',
      schedule: { cron: '*/5 * * * *' },
      payload: { ts: '' },
    })
  })

  it('does not add recurringEvents entries for events without a recurring field', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        plain: { schema: sdk.z.object({}) },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.recurringEvents).toEqual({})
  })

  it('explicit recurringEvents overrides inline recurring for the same key', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        heartbeat: {
          schema: sdk.z.object({}),
          recurring: { schedule: { cron: '*/5 * * * *' }, payload: { ts: 'from-inline' } },
        },
      },
      recurringEvents: {
        heartbeat: { type: 'heartbeat', schedule: { cron: '0 * * * *' }, payload: { ts: 'from-explicit' } },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.recurringEvents?.heartbeat).toEqual({
      type: 'heartbeat',
      schedule: { cron: '0 * * * *' },
      payload: { ts: 'from-explicit' },
    })
  })

  it('two recurringEvents entries with different keys but same type both survive', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        foo: { schema: sdk.z.object({}) },
      },
      recurringEvents: {
        foo: { type: 'foo', schedule: { cron: '*/6 * * * *' }, payload: {} },
        foo: { type: 'foo', schedule: { cron: '*/7 * * * *' }, payload: {} },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.recurringEvents?.foo).toEqual({ type: 'foo', schedule: { cron: '*/7 * * * *' }, payload: {} })
  })

  it('preserves explicit recurringEvents that have no inline counterpart', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        heartbeat: { schema: sdk.z.object({}) },
      },
      recurringEvents: {
        dailyDigest: { type: 'heartbeat', schedule: { cron: '0 9 * * *' }, payload: { ts: '' } },
      },
    })

    const body = await prepareCreateBotBody(bot)

    expect(body.recurringEvents?.dailyDigest).toEqual({
      type: 'heartbeat',
      schedule: { cron: '0 9 * * *' },
      payload: { ts: '' },
    })
  })
})
