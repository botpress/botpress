import { ClickUpClient } from './client'
import { executeCommentReceived } from './events/executeCommentReceived'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (!req.body) {
    return
  }

  const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId)

  let parsedBody: any
  try {
    parsedBody = JSON.parse(req.body)
  } catch {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Invalid JSON Body' }),
    }
  }

  switch (parsedBody.event) {
    case 'taskCommentPosted':
      return executeCommentReceived({ clickup, body: parsedBody, client, logger })
    case 'taskCreated':
    case 'taskUpdated':
    case 'taskDeleted':
      await client.createEvent({ type: parsedBody.event, payload: { id: parsedBody.task_id.toString() } })
      return
    default:
      return
  }
}
