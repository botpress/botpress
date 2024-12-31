import { ClickUpClient } from 'src/client'
import * as bp from '.botpress'

export const executeCommentReceived = async ({
  clickup,
  body,
  client,
  logger,
}: {
  clickup: ClickUpClient
  body: any
  client: bp.Client
  logger: bp.Logger
}) => {
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
}
