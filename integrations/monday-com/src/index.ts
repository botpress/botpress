import { z } from '@botpress/sdk'
import * as actions from 'src/actions'
import { MondayClient } from './misc/monday-client'
import { ensureMondayItemsTableExists, getVanillaClient } from './utils'
import * as bp from '.botpress'
import { States } from '.botpress/implementation/typings/states'

export default new bp.Integration({
  register: async ({ webhookUrl, ctx, client }) => {
    await ensureMondayItemsTableExists(client)

    const monday = MondayClient.create({
      personalAccessToken: ctx.configuration.personalAccessToken,
    })

    const stateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'webhooks',
      payload: {
        registered: [],
      },
    })
    const registered = stateResponse.state.payload.registered
    const newWebhooks: Array<States['webhooks']['payload']['registered'][number]> = []

    const webhooksToRegister = ['create_item', 'item_deleted'] as const

    for (const boardId of ctx.configuration.boardIds) {
      for (const webhookName of webhooksToRegister) {
        if (!registered.find((webhook) => webhook.name === webhookName && webhook.boardId === boardId)) {
          const result = await monday.createWebhook(webhookName, webhookUrl, boardId)

          newWebhooks.push({
            name: webhookName,
            boardId,
            webhookId: result.create_webhook.id,
          })
        }
      }
    }

    if (newWebhooks.length > 0) {
      await client.setState({
        id: ctx.integrationId,
        type: 'integration',
        name: 'webhooks',
        payload: {
          registered: [...registered, ...newWebhooks],
        },
      })
    }
  },
  unregister: async ({ client, ctx, logger }) => {
    // TODO clear out MondayItemsTable

    const monday = MondayClient.create({
      personalAccessToken: ctx.configuration.personalAccessToken,
    })

    try {
      const stateResponse = await client.getState({
        id: ctx.integrationId,
        type: 'integration',
        name: 'webhooks',
      })
      const registered = stateResponse.state.payload.registered

      for (const webhook of registered) {
        logger.info('delete webhook', {
          boardId: webhook.boardId,
          webhookId: webhook.webhookId,
          name: webhook.name,
        })
        await monday.deleteWebhook(webhook.webhookId).catch((err) => {
          logger.forBot().error(JSON.stringify(err, null, 2))
          logger.forBot().error('Could not delete Monday.com webhook with ID ', webhook.webhookId)
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

    const baseEventSchema = z.object({
      app: z.literal('monday'),
      triggerTime: z.coerce.date(),
      subscriptionId: z.number(),
      isRetry: z.boolean(),
      userId: z.number(),
      originalTriggerUuid: z.string().nullable(),
      triggerUuid: z.string(),
    })
    const createItemSchema = baseEventSchema.extend({
      type: z.literal('create_pulse'),
      boardId: z.number(),
      pulseId: z.number(),
      pulseName: z.string(),
      groupId: z.string(),
      groupName: z.string(),
      groupColor: z.string(),
      isTopGroup: z.boolean(),
      columnValues: z.record(z.string(), z.unknown()),
    })
    const deleteItemSchema = baseEventSchema.extend({
      type: z.literal('delete_pulse'),
      boardId: z.number(),
      itemId: z.number(),
      itemName: z.string(),
    })

    const eventSchema = z.discriminatedUnion('type', [createItemSchema, deleteItemSchema])

    const webhookRequestSchema = z.object({ event: eventSchema })

    const eventResult = webhookRequestSchema.safeParse(jsonBody)
    if (eventResult.success) {
      const mondayEvent = eventResult.data.event

      event.logger.info('Monday event: ', JSON.stringify(mondayEvent, null, 2))

      if (mondayEvent.type === 'create_pulse') {
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
      } else if (mondayEvent.type === 'delete_pulse') {
        const bpClient = getVanillaClient(event.client)
        const result = await bpClient.findTableRows({
          table: 'MondayItemsTable',
          filter: {
            itemId: {
              $eq: String(mondayEvent.itemId),
            },
          },
        })

        await bpClient.deleteTableRows({
          table: 'MondayItemsTable',
          ids: result.rows.map((row) => row.id),
        })

        return { status: 200, body: 'Handled event ' + mondayEvent.type }
      }
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
