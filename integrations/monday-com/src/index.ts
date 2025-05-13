import * as actions from 'src/actions'
import { challengeRequestSchema, Webhook, webhookRequestSchema, webhooks } from './misc/custom-schemas'
import { MondayClient } from './misc/monday-client'
import { ensureMondayItemsTableExists, getVanillaClient } from './utils'
import * as bp from '.botpress'

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
    const newWebhooks: Webhook[] = []

    for (const boardId of ctx.configuration.boardIds) {
      for (const webhookName of webhooks) {
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
    const vanillaClient = getVanillaClient(client)

    await vanillaClient.deleteTable({
      table: 'MondayItemsTable',
    })

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
  handler: async ({ client, logger, req }) => {
    if (req.method !== 'POST' || !req.body) {
      return {
        status: 400,
        body: 'Bad request',
      }
    }

    let jsonBody: unknown
    try {
      jsonBody = JSON.parse(req.body)
    } catch {
      return {
        status: 400,
        body: 'Bad request',
      }
    }

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

    const eventResult = webhookRequestSchema.safeParse(jsonBody)
    if (!eventResult.success) {
      logger.forBot().error(eventResult.error)

      // Incoming request doesn't match
      return {
        status: 400,
        body: 'Bad request',
      }
    }

    const { event } = eventResult.data

    if (event.type === 'create_pulse') {
      const vanillaClient = getVanillaClient(client)
      const response = await vanillaClient.upsertTableRows({
        table: 'MondayItemsTable',
        keyColumn: 'itemId',
        rows: [
          {
            boardId: event.boardId.toString(),
            itemId: event.pulseId.toString(),
            name: event.pulseName,
          },
        ],
      })
      if (response.errors) {
        for (const err of response.errors) {
          logger.error('Could not upsert row in MondayItemsTable', err)
        }
      }

      logger.info(`Inserted ${response.inserted.length} items in MondayItemsTable`)
      logger.info(`Updated ${response.updated.length} items in MondayItemsTable`)

      return { status: 200, body: 'Handled event ' + event.type }
    } else if (event.type === 'delete_pulse') {
      const vanillaClient = getVanillaClient(client)

      const result = await vanillaClient.findTableRows({
        table: 'MondayItemsTable',
        filter: {
          itemId: {
            $eq: String(event.itemId),
          },
        },
      })

      const deleteResult = await vanillaClient.deleteTableRows({
        table: 'MondayItemsTable',
        ids: result.rows.map((row) => row.id),
      })

      logger.forBot().info(`Deleted ${deleteResult.deletedRows} items in MondayItemsTable`)

      return { status: 200, body: 'Handled event ' + event.type }
    }

    event satisfies never
  },
})
