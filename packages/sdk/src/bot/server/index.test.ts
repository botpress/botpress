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

type TracingPlugin = DefaultPlugin<{
  actions: {
    inspect: {
      input: Record<string, never>
      output: { traceHeaders: Record<string, string>; clientHeaders: Record<string, unknown> }
    }
  }
}>

const TRACEPARENT = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
const TRACESTATE = 'vendor=value'

const actionRequest = (type: string, extraHeaders: Record<string, string> = {}) => ({
  method: 'POST',
  path: '/',
  query: '',
  headers: {
    ...extraHeaders,
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

  describe('trace context', () => {
    const makeBot = () => {
      const plugin = new PluginImplementation<TracingPlugin>({
        actions: {
          inspect: async ({ ctx, client }) => ({
            traceHeaders: ctx.traceHeaders,
            clientHeaders: { ...client._inner.config.headers },
          }),
        },
      }).initialize({
        alias: 'tracing',
        configuration: {},
        interfaces: {},
        integrations: {},
      })
      return new BotImplementation({
        actions: {},
        plugins: { tracing: plugin },
      })
    }

    const inspect = async (extraHeaders: Record<string, string>, dependencies?: { client: Client }) => {
      const response = await makeBot().handler(actionRequest('tracing#inspect', extraHeaders), dependencies)
      return JSON.parse((response as { body: string }).body).output as TracingPlugin['actions']['inspect']['output']
    }

    it('exposes incoming trace headers to plugin handlers and forwards them on the bot client', async () => {
      const output = await inspect({ traceparent: TRACEPARENT, tracestate: TRACESTATE })

      expect(output.traceHeaders).toEqual({ traceparent: TRACEPARENT, tracestate: TRACESTATE })
      expect(output.clientHeaders).toMatchObject({ traceparent: TRACEPARENT, tracestate: TRACESTATE })
    })

    it('sends no trace headers when the request carries none', async () => {
      const output = await inspect({})

      expect(output.traceHeaders).toEqual({})
      expect(output.clientHeaders).not.toHaveProperty('traceparent')
      expect(output.clientHeaders).not.toHaveProperty('tracestate')
    })

    it('exposes trace headers without modifying an injected client', async () => {
      const injectedHeaders = { 'x-bot-id': 'bot-1' }
      const injectedClient = { config: { headers: injectedHeaders } } as unknown as Client

      const output = await inspect({ traceparent: TRACEPARENT }, { client: injectedClient })

      expect(output.traceHeaders).toEqual({ traceparent: TRACEPARENT })
      expect(output.clientHeaders).toEqual(injectedHeaders)
      expect(injectedHeaders).toEqual({ 'x-bot-id': 'bot-1' })
    })
  })
})
