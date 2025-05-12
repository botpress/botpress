import { z } from '@botpress/sdk'
import * as actions from 'src/actions'
import { MondayClient } from './misc/monday-client'
import { getVanillaClient } from './utils'
import * as bp from '.botpress'
import { States } from '.botpress/implementation/typings/states'

export default new bp.Integration({
  register: async (event) => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */

    const client = MondayClient.create({
      personalAccessToken: event.ctx.configuration.personalAccessToken,
    })
    const webhookUrl = event.webhookUrl

    event.logger.info('start')
    const stateResponse = await event.client.getOrSetState({
      id: event.ctx.integrationId,
      type: 'integration',
      name: 'webhooks',
      payload: {
        registered: [],
      },
    })
    const registered = stateResponse.state.payload.registered
    const new_webhooks: Array<States['webhooks']['payload']['registered'][number]> = []

    for (const boardId of event.ctx.configuration.boardIds) {
      if (!registered.find((webhook) => webhook.name === 'createItem' && webhook.boardId === boardId)) {
        const result = await client.createWebhook('create_item', webhookUrl, boardId)

        new_webhooks.push({
          name: 'createItem',
          boardId,
          webhookId: result.create_webhook.id,
        })
      }
    }

    if (new_webhooks.length > 0) {
      await event.client.setState({
        id: event.ctx.integrationId,
        type: 'integration',
        name: 'webhooks',
        payload: {
          registered: [...registered, ...new_webhooks],
        },
      })
    }
  },
  unregister: async (event) => {
    const client = MondayClient.create({
      personalAccessToken: event.ctx.configuration.personalAccessToken,
    })

    try {
      const stateResponse = await event.client.getState({
        id: event.ctx.integrationId,
        type: 'integration',
        name: 'webhooks',
      })
      const registered = stateResponse.state.payload.registered

      for (const webhook of registered) {
        event.logger.info('delete webhook', {
          boardId: webhook.boardId,
          webhookId: webhook.webhookId,
          name: webhook.name,
        })
        await client.deleteWebhook(webhook.webhookId).catch((err) => {
          event.logger.forBot().error(JSON.stringify(err, null, 2))
          event.logger.forBot().error('Could not delete Monday.com webhook with ID ', webhook.webhookId)
        })
      }
    } catch {
      // TODO should we just let uninstallation continue or is it beneficial to raise an error here?
    }
  },
  actions,
  channels: {},
  handler: async (event) => {
    event.logger.info(
      JSON.stringify(
        {
          method: event.req.method,
          body: event.req.body,
          headers: event.req.headers,
          path: event.req.path,
          query: event.req.query,
        },
        null,
        2
      )
    )
    if (event.req.method !== 'POST' || !event.req.body) {
      return {
        status: 400,
        body: 'Bad request',
      }
    }

    let jsonBody: unknown
    try {
      jsonBody = JSON.parse(event.req.body)
    } catch {
      return {
        status: 400,
        body: 'Bad request',
      }
    }

    const challengeRequestSchema = z.object({ challenge: z.string().min(1) })
    const challengeResult = challengeRequestSchema.safeParse(jsonBody)
    if (challengeResult.success) {
      return {
        status: 200,
        body: JSON.stringify({
          ...challengeResult.data,
          botpress: 'cool',
        }),
      }
    }

    const eventSchema = z.object({
      event: z.object({
        app: z.literal('monday'),
        type: z.enum(['create_pulse']),
        triggerTime: z.coerce.date(),
        subscriptionId: z.number(),
        isRetry: z.boolean(),
        userId: z.number(),
        originalTriggerUuid: z.string().nullable(),
        boardId: z.number(),
        pulseId: z.number(),
        pulseName: z.string(),
        groupId: z.string(),
        groupName: z.string(),
        groupColor: z.string(),
        isTopGroup: z.boolean(),
        columnValues: z.record(z.string(), z.unknown()),
        triggerUuid: z.string(),
      }),
    })
    const eventResult = eventSchema.safeParse(jsonBody)
    if (eventResult.success) {
      const mondayEvent = eventResult.data.event

      event.logger.info('Monday event: ', JSON.stringify(mondayEvent, null, 2))

      const bpClient = getVanillaClient(event.client)
      const response = await bpClient.upsertTableRows({
        table: 'MondayItemsTable',
        keyColumn: 'itemId',
        rows: [
          {
            boardId: mondayEvent.boardId.toString(),
            itemId: mondayEvent.pulseId.toString(),
            name: mondayEvent.pulseName,
          },
        ],
      })
      if (response.errors) {
        for (const err of response.errors) {
          event.logger.error('upsert error', err)
        }
      }
      event.logger.info('inserted', response.inserted.length)
      event.logger.info('updated', response.updated.length)
      return { status: 200, body: 'Handled event ' + mondayEvent.type }
    } else {
      event.logger.error(eventResult.error)
      event.logger.error(eventResult.error.toString())
      event.logger.error(JSON.stringify(eventResult.error))
    }

    // Incoming request doesn't match
    return {
      status: 400,
      body: 'Bad request',
    }
  },
})
