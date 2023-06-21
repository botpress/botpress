import { WebClient } from '@slack/web-api'
import { Implementation } from '../misc/types'
import { getTag } from '../misc/utils'

export const addReaction: Implementation['actions']['addReaction'] = async ({ ctx, client, input }) => {
  const slackClient = new WebClient(ctx.configuration.botToken)

  if (input.messageId) {
    const { message } = await client.getMessage({ id: input.messageId })
    const { conversation } = await client.getConversation({ id: message.conversationId })

    await slackClient.reactions.add({
      name: input.name,
      channel: getTag(conversation.tags, 'id'),
      timestamp: getTag(message.tags, 'ts'),
    })
  }

  return {}
}
