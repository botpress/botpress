import { z } from '@botpress/sdk'
import { AxiosError } from 'axios'
import * as actions from 'src/actions'
import { getClient, getVanillaClient } from './utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (event) => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */

    const client = getClient(event.ctx.configuration)
    const webhookUrl = event.webhookUrl

    for (const boardId of event.ctx.configuration.boardIds) {
      const existingWebhooksResponse = await client.post('', {
        query: `query($boardId: ID!) {
          webhooks(board_id: $boardId) {
            id
            event
            board_id
            config
          }
        }`,
        variables: { boardId },
      })

      const existingWebhooks = existingWebhooksResponse.data.data.webhooks

      event.logger.info('Existing webhooks:', JSON.stringify(existingWebhooks, null, 2))

      try {
        const createWebhookResponse = await client.post('', {
          query: `mutation($boardId: ID!, $webhookUrl: String!, $event: WebhookEventType!) {
          create_webhook (board_id: $boardId, url: $webhookUrl, event: $event) {
            id
            board_id
          }
        }`,
          variables: {
            boardId,
            webhookUrl,
            event: 'create_item',
          },
        })

        event.logger.info('Create webhook response:', JSON.stringify(createWebhookResponse.data, null, 2))
      } catch (err) {
        if (err instanceof AxiosError) {
          event.logger.error('Failed to create the webhook.')
          event.logger.error(err.message, JSON.stringify(err.response?.data, null, 2))
        } else {
          event.logger.error('Unknown error', JSON.stringify(err, null, 2))
        }
      }
    }
  },
  unregister: async () => {
    /**
     * TODO: Remove integrations we added
     */
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
