import { ClickUpClient } from './client'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (!req.body) {
    return
  }

  const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId)

  const body = JSON.parse(req.body)
  if (body.event === 'taskCommentPosted') {
    const botUser = await clickup.getUser()

    for (const historyItem of body.history_items) {
      if (botUser.id === historyItem.user.id) {
        continue
      }

      const { user } = await client.getOrCreateUser({ tags: { id: historyItem.user.id.toString() } })
      const { conversation } = await client.getOrCreateConversation({
        tags: { taskId: body.task_id.toString() },
        channel: 'comment',
      })
      const { message } = await client.getOrCreateMessage({
        conversationId: conversation.id,
        userId: user.id,
        type: 'text',
        payload: { text: historyItem.comment.text_content },
        tags: { id: historyItem.comment.id.toString() },
      })

      logger.forBot().info('Message created', message.payload.text)
    }
  } else if (['taskCreated', 'taskUpdated', 'taskDeleted'].includes(body.event)) {
    await client.createEvent({ type: body.event, payload: { id: body.task_id.toString() } })
  }
}
