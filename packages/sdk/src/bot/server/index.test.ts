import type { Client } from '@botpress/client'
import { describe, expect, it, vi } from 'vitest'
import { type DefaultPlugin, PluginImplementation } from '../../plugin'
import { BotImplementation } from '../implementation'

type HitlPlugin = DefaultPlugin<{
  states: {
    runtimeConfig: {
      type: 'bot'
      payload: { enabled: boolean }
    }
  }
  actions: {
    start: {
      input: Record<string, never>
      output: { enabled: boolean }
    }
  }
}>

const actionRequest = (type: string) => ({
  method: 'POST',
  path: '/',
  query: '',
  headers: {
    'x-bot-id': 'bot-1',
    'x-bp-operation': 'action_triggered',
    'x-bp-type': 'action_triggered',
    'x-bp-configuration': Buffer.from(JSON.stringify({ payload: '{}' })).toString('base64'),
  },
  body: JSON.stringify({ type, input: {} }),
})

describe('botHandler', () => {
  it('uses the request-scoped client for plugin tools', async () => {
    const getState = vi.fn(async () => ({ state: { payload: { enabled: true } } }))
    const injectedClient = { getState } as unknown as Client
    const plugin = new PluginImplementation<HitlPlugin>({
      actions: {
        start: async ({ states }) => await states.bot.runtimeConfig.get('desk-hitl'),
      },
    }).initialize({
      alias: 'desk-hitl',
      configuration: {},
      interfaces: {},
      integrations: {},
    })
    const bot = new BotImplementation({
      actions: {},
      plugins: { 'desk-hitl': plugin },
    })

    const response = await bot.handler(actionRequest('desk-hitl#start'), { client: injectedClient })

    expect(response).toEqual({ status: 200, body: JSON.stringify({ output: { enabled: true } }) })
    expect(getState).toHaveBeenCalledWith({
      type: 'bot',
      name: 'desk-hitl#runtimeConfig',
      id: 'desk-hitl',
    })
  })
})
