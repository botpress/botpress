import integration from './index'
import { Client } from '@botpress/client'
import { buildRequest, generateContext, ClientMock } from '@botpress/integrations-testing'
import { IntegrationEvent, Event, TriggerRequestBody, ZapierTriggersState, ZapierTriggersStateName } from './types'
import type { CreateEventProps } from '@botpress/client/dist/gen/client'
import type { Configuration } from '.botpress/implementation/configuration'
import { constants } from 'http2'

type Logger = Parameters<(typeof integration)['register']>[0]['logger']

describe('Zapier integration', () => {
  const client = new Client()
  const clientMock = new ClientMock(client)

  const logger: Logger = {
    forBot: () => ({
      debug: console.debug,
      error: console.error,
      info: console.info,
      warn: console.warn,
    }),
  }

  beforeAll(() => {
    clientMock.nock.disableNetConnect()
  })

  beforeEach(() => {
    clientMock.reset()
  })

  afterAll(() => {
    clientMock.nock.enableNetConnect()
  })

  it('trigger: notifies Zapier REST hooks', async () => {
    const ctx = generateContext<Configuration>('action_triggered')
    const zapierHookUrl1 = 'http://test1'
    const zapierHookUrl2 = 'http://test2'

    clientMock.getState(ZapierTriggersStateName).returns(<ZapierTriggersState>{
      subscribers: [{ url: zapierHookUrl1 }, { url: zapierHookUrl2 }],
    })

    const input = {
      data: JSON.stringify({ message: 'Hello' }),
      correlationId: '1234',
    }

    clientMock.http(zapierHookUrl1, 'POST').listen(({ body }) => {
      expect(body).toMatchObject(<TriggerRequestBody>{
        botId: ctx.botId,
        data: input.data,
        correlationId: input.correlationId,
      })
    })

    clientMock.http(zapierHookUrl2, 'POST').listen(({ body }) => {
      expect(body).toMatchObject(<TriggerRequestBody>{
        botId: ctx.botId,
        data: input.data,
        correlationId: input.correlationId,
      })
    })

    expect.assertions(3)

    const output = await integration.actions.trigger({
      ctx,
      client,
      type: 'trigger',
      input,
      logger,
    })

    expect(output).toEqual({})
  })

  it('trigger: unsubscribes Zapier REST hook when gone', async () => {
    const ctx = generateContext<Configuration>('action_triggered')
    const zapierHookUrl1 = 'http://test1'
    const zapierHookUrl2 = 'http://test2'

    clientMock.getState(ZapierTriggersStateName, { times: 2 }).returns(<ZapierTriggersState>{
      subscribers: [{ url: zapierHookUrl1 }, { url: zapierHookUrl2 }],
    })

    clientMock.http(zapierHookUrl1, 'POST').reply(constants.HTTP_STATUS_GONE)

    clientMock.http(zapierHookUrl2, 'POST').listen(({ body }) => {
      expect(body).toMatchObject(<TriggerRequestBody>{
        botId: ctx.botId,
      })
    })

    clientMock.setState(ZapierTriggersStateName).listen(({ payload }) => {
      expect((<ZapierTriggersState>payload).subscribers).toMatchObject([{ url: zapierHookUrl2 }])
    })

    expect.assertions(3)

    const output = await integration.actions.trigger({
      ctx,
      client,
      type: 'trigger',
      input: {
        data: JSON.stringify({ message: 'Hello' }),
        correlationId: '1234',
      },
      logger,
    })

    expect(output).toEqual({})
  })

  it('handler: processes Zapier trigger subscription', async () => {
    const zapierHookUrl = 'http://test'

    const ctx = generateContext('webhook_received')
    const req = buildRequest(ctx, <IntegrationEvent>{
      action: 'subscribe:triggers',
      url: zapierHookUrl,
    })

    clientMock.http(zapierHookUrl, 'POST').listen(({ body }) => {
      expect(body).toMatchObject(<TriggerRequestBody>{
        botId: ctx.botId,
        data: expect.any(String),
        correlationId: expect.any(String),
      })
    })

    clientMock.getState(ZapierTriggersStateName).returns(<ZapierTriggersState>{
      subscribers: [],
    })

    clientMock.setState(ZapierTriggersStateName).listen(({ payload }) => {
      expect(payload).toMatchObject(<ZapierTriggersState>{
        subscribers: [{ url: zapierHookUrl }],
      })
    })

    expect.assertions(3)

    const response = await integration.handler(req)

    expect(response).toMatchObject({
      status: 200,
    })
  })

  it('handler: processes Zapier trigger unsubscription', async () => {
    const zapierHookUrl = 'http://test'

    const ctx = generateContext('webhook_received')
    const req = buildRequest(ctx, <IntegrationEvent>{
      action: 'unsubscribe:triggers',
      url: zapierHookUrl,
    })

    clientMock.getState(ZapierTriggersStateName).returns(<ZapierTriggersState>{
      subscribers: [{ url: zapierHookUrl }],
    })

    clientMock.setState(ZapierTriggersStateName).listen(({ payload }) => {
      expect(payload).toMatchObject(<ZapierTriggersState>{
        subscribers: [],
      })
    })

    expect.assertions(2)

    const response = await integration.handler(req)

    expect(response).toMatchObject({
      status: 200,
    })
  })

  it('handler: processes events received', async () => {
    const eventPayload = <Event>{
      data: JSON.stringify({ message: 'Hello' }),
      correlationId: '1234',
    }

    const ctx = generateContext('webhook_received')
    const req = buildRequest(ctx, eventPayload)

    clientMock.createEvent().listen(({ body }) => {
      expect(body).toMatchObject(<CreateEventProps>{
        type: 'zapier:event',
        payload: eventPayload,
      })
    })

    expect.assertions(2)

    const response = await integration.handler(req)

    expect(response).toMatchObject({
      status: 200,
    })
  })
})
