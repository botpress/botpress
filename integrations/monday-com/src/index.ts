import * as actions from 'src/actions'
import { challengeRequestSchema, Webhook, webhookRequestSchema, webhookNames } from './misc/custom-schemas'
import { MondayClient } from './misc/monday-client'
import { ensureMondayItemsTableExists, getVanillaClient } from './utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ logger, webhookUrl, ctx, client }) => {
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

    const { registered } = stateResponse.state.payload

    const newWebhooks: Webhook[] = []
    const webhooksToKeep: Webhook[] = []

    for (const webhook of registered) {
      if (ctx.configuration.boardIds.includes(webhook.boardId)) {
        webhooksToKeep.push(webhook)
      } else {
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
    }

    for (const boardId of ctx.configuration.boardIds) {
      for (const webhookName of webhookNames) {
        if (!webhooksToKeep.find((webhook) => webhook.name === webhookName && webhook.boardId === boardId)) {
          const result = await monday.createWebhook(webhookName, webhookUrl, boardId)

          newWebhooks.push({
            name: webhookName,
            boardId,
            webhookId: result.create_webhook.id,
          })
        }
      }
    }

    if (newWebhooks.length > 0 || webhooksToKeep.length !== registered.length) {
      await client.setState({
        id: ctx.integrationId,
        type: 'integration',
        name: 'webhooks',
        payload: {
          registered: [...webhooksToKeep, ...newWebhooks],
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
      // Ignore error and just let uninstallation continue
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
          success: true,
          challenge: challengeResult.data.challenge,
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

    switch (event.type) {
      case 'create_pulse': {
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
      }
      case 'delete_pulse': {
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
      default:
        throw event satisfies never
    }
  },
})
